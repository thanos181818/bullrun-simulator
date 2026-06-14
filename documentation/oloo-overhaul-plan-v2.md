# Oloo Trading Platform — Complete Overhaul & Feature Roadmap
**Version 2.1 | June 2026 | Revised after architectural review**

---

> **Revision Notes (v2.0 → v2.1):** Four architectural issues were identified in the previous version and are resolved in this revision. Changes are marked with ⚠️ REVISED throughout. Summary of changes:
> 1. In-memory server cache replaced with **Upstash Redis** to fix Vercel serverless isolation
> 2. Historical data source boundary **explicitly defined** per time range (Finnhub vs. Yahoo)
> 3. **Portfolio Snapshot Cron** added to support the portfolio-value-over-time chart
> 4. **WebSocket vs. SWR polling decision** resolved with clear reasoning and an upgrade path

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architectural Decisions & Tradeoffs](#part-0-architectural-decisions--tradeoffs-read-first)
3. [THE CORE PROBLEM: Real Market Data](#part-1-the-core-problem-real-market-data)
4. [Critical Bug Fixes](#part-2-critical-bug-fixes-fix-before-anything-else)
5. [Performance Overhaul](#part-3-performance-overhaul)
6. [Architecture & Reliability](#part-4-architecture--reliability-fixes)
7. [New Features to Build](#part-5-new-features-to-build)
8. [Complete Backend Changes Map](#part-6-complete-backend-changes-map)
9. [Phased Implementation Roadmap](#part-7-phased-implementation-roadmap)

---

## Executive Summary

The Oloo platform has a solid foundation: MongoDB transactions, badge gamification, an AI insights engine, and a clean UI architecture. However there are **14 active bugs**, a **fundamentally broken data layer** (random-walk simulation instead of real prices), and several missing features that users of a trading simulator expect as standard.

This document provides exact solutions for every issue, a proven real-data architecture, and a prioritised feature roadmap. Issues are graded:

- 🔴 **CRITICAL** — App is broken or insecure right now
- 🟠 **HIGH** — Significantly harms user experience
- 🟡 **MEDIUM** — Technical debt, should fix soon
- 🟢 **ENHANCEMENT** — New feature that adds real value

**One critical warning preserved from the review:** Do not delete your `seed-mongodb.ts` scripts until the new Finnhub integration is fully verified. The symbol names in your database (e.g. `BTC`, `AAPL`) must exactly match the symbols used in Finnhub API calls. Any mismatch silently returns null prices.

---

## PART 0: Architectural Decisions & Tradeoffs (Read First)

Before diving into implementation, four architectural decisions need to be made explicitly. Leaving these vague causes the kind of inconsistencies found in v2.0 of this plan. Each decision is explained with reasoning so you understand the tradeoff, not just the conclusion.

---

### Decision A ⚠️ REVISED — Caching Strategy: Upstash Redis, Not In-Memory

**The problem with in-memory caching on Vercel:**

When you deploy a Next.js app to Vercel, your API routes run as isolated serverless functions. Each function invocation gets its own memory space that exists for the duration of that one request. There is no shared memory between invocations. This means:

- User A visits the site → Vercel spins up Function Instance #1 → cache is empty → hits Finnhub API
- User B visits the site 3 seconds later → Vercel spins up Function Instance #2 → cache is still empty → hits Finnhub API again
- With 10 concurrent users, you may make 10 separate calls to Finnhub in the same second

At 60 requests/minute free-tier limit, 10 concurrent users with naive in-memory caching will breach the limit in seconds.

**The solution: Upstash Redis**

Upstash is a serverless-native Redis service. It has a free tier of 10,000 commands/day (more than enough for a simulator). Unlike a traditional Redis server, Upstash is accessed over HTTP, meaning it works perfectly from Vercel serverless functions with no persistent connection needed.

```
All Vercel function instances → Upstash Redis (shared external store) → Finnhub API (only on cache miss)
```

With a 12-second cache TTL on a price lookup, 10,000 daily commands supports roughly 840 price-fetch cycles per day — enough for continuous operation.

**Setup:**
1. Register free at [upstash.com](https://upstash.com)
2. Create a Redis database (free tier)
3. Copy `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` from the dashboard

---

### Decision B ⚠️ REVISED — Historical Data Source: Hard Boundary by Time Range

The previous plan said "use yahoo-finance2 for historical data" without defining what "historical" means. This caused a conflict because yahoo-finance2 is unreliable for intraday data.

**Hard rule — never deviate from this table:**

| Chart Range | Data Source | Endpoint | Reason |
|---|---|---|---|
| **1D** (intraday) | Finnhub Candles API | `/api/v1/stock/candle?resolution=5` | yahoo-finance2 blocks intraday with anti-bot measures. Finnhub free tier includes 1-minute and 5-minute candles. |
| **1W** | Finnhub Candles API | `/api/v1/stock/candle?resolution=60` | Still recent enough to use Finnhub for hourly candles. |
| **1M, 3M, 6M, 1Y** | yahoo-finance2 | Internal `yahoofinance.ts` | Deep history. Yahoo is reliable for data this old and saves Finnhub API quota. |
| **Crypto (all ranges)** | CoinGecko Market Chart | `/api/v3/coins/{id}/market_chart` | CoinGecko provides free historical crypto data for all ranges. No Finnhub needed for crypto charts. |

This boundary is enforced in the history API route with an explicit `if/else` block, not a comment or convention.

---

### Decision C ⚠️ REVISED — Real-Time vs. Polling: SWR Polling is the Correct Choice for Vercel

**The confusion in the previous plan:** The executive summary mentioned WebSockets, but Section 1.9 implemented SWR polling. These are completely different approaches and cannot coexist as written.

**Why WebSockets do not work on standard Vercel Serverless:**

Vercel Serverless Functions are stateless and short-lived. A WebSocket requires a persistent, stateful connection that lives for minutes or hours. Vercel kills idle functions after a few seconds. The function cannot hold a WebSocket connection open.

**The three real options and why we chose polling:**

| Approach | How It Works | Vercel Compatible? | Complexity | Update Frequency |
|---|---|---|---|---|
| **SWR Polling** | Client calls your API every N seconds | ✅ Yes, natively | Low | Every 15 seconds |
| **Server-Sent Events (SSE)** | Server streams updates one-way via Edge Runtime | ✅ Yes, with Edge Runtime | Medium | Sub-second possible |
| **WebSockets** | Full duplex, persistent connection | ❌ Not on Serverless | High | True real-time |
| **Separate WS Server** | Deploy WebSocket server on Railway/Render | ✅ Yes (separate service) | Very High | True real-time |

**Decision: SWR Polling at 15-second intervals for Phase 2.**

For a paper trading simulator, 15-second price updates are entirely adequate. Users are not executing high-frequency trades. They are learning to read markets, build positions, and manage risk — all activities where a 15-second lag is imperceptible. Binance updates in milliseconds because milliseconds matter when real money is at stake. They do not matter here.

**The upgrade path (Phase 5 optional):** If you later want sub-5-second updates, add Server-Sent Events via a Vercel Edge Function. This does not require a separate server and can be added without changing the client-side Zustand store — only the transport layer changes. This is documented in Part 5 as an optional enhancement.

**Bottom line:** Remove all WebSocket references from the plan. The architecture is: **SWR polling (15s) → Next.js API Route → Upstash Redis cache → Finnhub/CoinGecko**.

---

### Decision D ⚠️ REVISED — Portfolio History: Requires Periodic Snapshots

**The problem the previous plan missed:**

If you delete the `update-prices` endpoint (correct, for security reasons), you lose the mechanism that keeps price data flowing into MongoDB. The `PriceHistory` collection needs regular writes to power the portfolio-value-over-time chart.

Without periodic snapshots, you can show a user their current portfolio value. But you cannot show how it changed yesterday, last week, or last month. That chart would be permanently empty.

**The solution: Hourly Portfolio Snapshot Cron**

A Vercel Cron job runs every hour, fetches the current price of every asset, and writes one snapshot record per user. This is tiny data (one document per user per hour), trivially cheap to store, and the only correct way to reconstruct historical portfolio performance without trusting the client to push data.

This is a new addition to the architecture. Full implementation is in Section 1.12.

---

## PART 1: THE CORE PROBLEM — Real Market Data

The current setup in `src/hooks/use-asset-prices.ts` generates prices using a random-walk algorithm on the client:

- Prices are **completely fabricated** — no relationship to actual market conditions
- A user buys "Apple stock" at $195 when the real price is $210 — every P&L calculation is wrong
- The trending logic (direction flip every 3–5 hours) teaches users **wrong market behaviour**
- There is no concept of market open/close, earnings, news events, or volatility clustering
- Users cannot learn anything real about trading because the data is fictional

---

### 1.1 API Provider Comparison

| Provider | Free Tier | Intraday Data | Stocks | Crypto | Historical | Reliability | Notes |
|---|---|---|---|---|---|---|---|
| **Finnhub** | 60 req/min | ✅ 1-min candles | ✅ US + Global | ✅ | ✅ 1yr | ⭐⭐⭐⭐⭐ | Primary choice. News, earnings, fundamentals. |
| **Twelve Data** | 800 req/day | ✅ 1-min | ✅ Wide | ✅ | ✅ Deep | ⭐⭐⭐⭐ | Good backup. Rate limit is tight on free tier. |
| **Yahoo Finance (yahoo-finance2)** | Unlimited | ⚠️ Unreliable | ✅ | ✅ | ✅ Deep | ⭐⭐ | **Unofficial scraper. Breaks for intraday. Use only for 1M+ charts.** |
| **CoinGecko** | 30 req/min | ❌ Hourly minimum | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ | Best free crypto data. Used for all crypto charts and prices. |
| **Alpha Vantage** | 25 req/day | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐ | Too limited for real-time. Fundamentals only. |
| **Polygon.io** | End-of-day | ❌ (free) | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | Best production data, but real-time requires a paid plan. |

---

### 1.2 Recommended Data Stack

**Stocks (real-time quotes):** Finnhub REST API — 60 req/min, cached in Upstash Redis for 12 seconds. With 8 stock symbols and a 12-second TTL, one cold cache miss costs 8 Finnhub calls. At worst-case 5 cold misses per minute, that is 40 calls/min — within the 60/min limit with headroom.

**Crypto (real-time quotes):** CoinGecko — one batch call returns all crypto prices. Cached for 15 seconds. Costs 1 Upstash command and 1 CoinGecko call per cache miss.

**Stocks (intraday charts, 1D and 1W):** Finnhub Candles API — returns OHLCV data for any time resolution.

**Crypto (all chart ranges):** CoinGecko Market Chart endpoint — returns price history for any range.

**Stocks (1M charts and above):** yahoo-finance2 — reliable for data this old, saves Finnhub quota.

---

### 1.3 New Data Architecture Overview ⚠️ REVISED

```
BEFORE (broken):
Client Browser → random-walk algorithm → fake prices stored in localStorage

AFTER (correct):
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME PRICE FLOW                         │
│                                                                 │
│  Finnhub API  ──┐                                               │
│  CoinGecko API ─┤→ Upstash Redis (12s TTL) → /api/market/quotes │
│                  │      ↑ shared across all Vercel instances    │
│                  └──────────────────────────────────────────────┘
│                                     ↓                          │
│                    SWR polling (every 15s)                      │
│                                     ↓                          │
│                  Zustand store (sliced selectors)               │
│                                     ↓                          │
│                           UI Components                        │
├─────────────────────────────────────────────────────────────────┤
│                    HISTORICAL CHART FLOW                        │
│                                                                 │
│  Finnhub Candles API → /api/market/history/[symbol]?range=1D   │
│  CoinGecko Market Chart → /api/market/history/[symbol]?range=* │
│  yahoo-finance2 → /api/market/history/[symbol]?range=1M+       │
│  MongoDB $bucket aggregation → TradingView Canvas Chart        │
├─────────────────────────────────────────────────────────────────┤
│                  PORTFOLIO SNAPSHOT FLOW (NEW)                  │
│                                                                 │
│  Vercel Cron (every hour) → /api/cron/snapshot-prices          │
│  → Fetch all current prices → Write PortfolioSnapshot to MongoDB│
│  → Powers the portfolio-value-over-time chart                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1.4 Environment Variables ⚠️ REVISED

```bash
# Market Data — Required
FINNHUB_API_KEY=your_finnhub_key_here

# Cache — Required (replaces broken in-memory cache)
UPSTASH_REDIS_URL=https://your-instance.upstash.io
UPSTASH_REDIS_TOKEN=your_upstash_token_here

# Email — Required for password reset
RESEND_API_KEY=re_your_key_here

# Internal API protection
INTERNAL_API_SECRET=generate_a_random_32_char_string_here
CRON_SECRET=generate_another_random_32_char_string_here

# Existing (keep these, rotate if compromised)
MONGODB_URI=your_mongo_uri
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com
GEMINI_API_KEY=your_gemini_key
```

---

### 1.5 Implementation: Upstash Redis Cache ⚠️ REVISED (replaces broken in-memory cache)

**Install:**
```bash
npm install @upstash/redis
```

**Create `src/lib/redis.ts`** — the single Redis client used everywhere:
```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

// Singleton Redis client — safe to import anywhere
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache key constants — centralise these to avoid typos
export const CACHE_KEYS = {
  stockPrices: 'prices:stocks',
  cryptoPrices: 'prices:crypto',
  quotePrefix: (symbol: string) => `quote:${symbol}`,
  historyPrefix: (symbol: string, range: string) => `history:${symbol}:${range}`,
  newsPrefix: (symbol: string) => `news:${symbol}`,
  marketStatus: 'market:status',
} as const;

// TTL constants in seconds (Redis uses seconds, not milliseconds)
export const CACHE_TTL = {
  livePrices: 12,       // 12 seconds — aggressive refresh for price data
  singleQuote: 10,      // 10 seconds
  history1D: 300,       // 5 minutes — intraday candles don't need to be fresher
  history1W: 900,       // 15 minutes
  history1M: 3600,      // 1 hour — monthly data barely changes
  historyLong: 14400,   // 4 hours — 3M, 6M, 1Y charts
  news: 300,            // 5 minutes
  marketStatus: 60,     // 1 minute
} as const;
```

**Why this is better than in-memory:**
- All Vercel function instances read from and write to the same Redis instance
- One cache miss → one Finnhub call → result stored for all subsequent instances
- With 12-second TTL and ~15-second client polling, the cache hit rate is close to 99%
- The free Upstash tier (10,000 commands/day) supports roughly 700 price fetches/day before any cost

---

### 1.6 Implementation: Batch Stock Quotes Route ⚠️ REVISED

**Create `src/app/api/market/quotes/route.ts`:**

```typescript
// src/app/api/market/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

// These must exactly match the symbols in your MongoDB Asset collection
// Verify against your seed-mongodb.ts before changing this list
const STOCK_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'META', 'NVDA', 'NFLX'];

const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
};

async function fetchAllStockPrices(): Promise<Record<string, number>> {
  // Fetch all symbols in parallel — costs 8 Finnhub calls (one per symbol)
  const results = await Promise.allSettled(
    STOCK_SYMBOLS.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      return { symbol, price: data.c as number };
    })
  );

  const prices: Record<string, number> = {};
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.price > 0) {
      prices[result.value.symbol] = result.value.price;
    }
  }
  return prices;
}

async function fetchAllCryptoPrices(): Promise<Record<string, number>> {
  const ids = Object.values(CRYPTO_COINGECKO_IDS).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { cache: 'no-store' }
  );
  const data = await res.json();

  const prices: Record<string, number> = {};
  for (const [symbol, geckoId] of Object.entries(CRYPTO_COINGECKO_IDS)) {
    if (data[geckoId]?.usd) prices[symbol] = data[geckoId].usd;
  }
  return prices;
}

export async function GET(req: NextRequest) {
  // Try Redis cache first — this is a shared cache, works across all Vercel instances
  const [cachedStocks, cachedCrypto] = await Promise.all([
    redis.get<Record<string, number>>(CACHE_KEYS.stockPrices),
    redis.get<Record<string, number>>(CACHE_KEYS.cryptoPrices),
  ]);

  let stockPrices = cachedStocks;
  let cryptoPrices = cachedCrypto;

  // Fetch from external APIs only on cache miss
  if (!stockPrices) {
    stockPrices = await fetchAllStockPrices();
    await redis.set(CACHE_KEYS.stockPrices, stockPrices, { ex: CACHE_TTL.livePrices });
  }

  if (!cryptoPrices) {
    cryptoPrices = await fetchAllCryptoPrices();
    await redis.set(CACHE_KEYS.cryptoPrices, cryptoPrices, { ex: CACHE_TTL.livePrices });
  }

  return NextResponse.json({
    prices: { ...stockPrices, ...cryptoPrices },
    timestamp: Date.now(),
    source: 'live',
    cacheHit: { stocks: !!cachedStocks, crypto: !!cachedCrypto },
  });
}
```

---

### 1.7 Implementation: Single Asset Quote Route

**Create `src/app/api/market/quote/[symbol]/route.ts`:**

```typescript
// src/app/api/market/quote/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE']);
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
  'BNB': 'binancecoin', 'ADA': 'cardano', 'DOGE': 'dogecoin',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  const cacheKey = CACHE_KEYS.quotePrefix(symbol);

  // Check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  let quoteData: Record<string, unknown>;

  if (CRYPTO_SYMBOLS.has(symbol)) {
    const geckoId = COINGECKO_IDS[symbol];
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false`
    );
    const data = await res.json();
    quoteData = {
      symbol,
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h,
      change24hAbs: data.market_data.price_change_24h,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      marketCap: data.market_data.market_cap.usd,
      volume: data.market_data.total_volume.usd,
      type: 'crypto',
    };
  } else {
    // Stock — fetch quote and company profile in parallel (2 Finnhub calls)
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
    ]);
    const [quote, profile] = await Promise.all([quoteRes.json(), profileRes.json()]);

    quoteData = {
      symbol,
      price: quote.c,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      prevClose: quote.pc,
      change: quote.d,
      changePercent: quote.dp,
      companyName: profile.name,
      sector: profile.finnhubIndustry,
      marketCap: (profile.marketCapitalization ?? 0) * 1_000_000,
      logo: profile.logo,
      exchange: profile.exchange,
      type: 'stock',
    };
  }

  // Cache the result in Redis
  await redis.set(cacheKey, quoteData, { ex: CACHE_TTL.singleQuote });

  return NextResponse.json(quoteData);
}
```

---

### 1.8 Implementation: Historical Data Route ⚠️ REVISED — Hard Source Boundary

**Create `src/app/api/market/history/[symbol]/route.ts`:**

```typescript
// src/app/api/market/history/[symbol]/route.ts
// DATA SOURCE DECISION TABLE (enforced by if/else — not convention):
//
//  Range    | Source           | Resolution | Reason
//  ---------+------------------+------------+--------------------------------
//  1D       | Finnhub Candles  | 5-min      | Yahoo blocks intraday scraping
//  1W       | Finnhub Candles  | 60-min     | Still recent, Finnhub reliable
//  1M+      | yahoo-finance2   | Daily      | Deep history, saves Finnhub quota
//  Any crypto | CoinGecko      | Varies     | CoinGecko owns crypto history

import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import yahooFinance from 'yahoo-finance2';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE']);
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
  'BNB': 'binancecoin', 'ADA': 'cardano', 'DOGE': 'dogecoin',
};

type Range = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

// Finnhub resolution codes
const FINNHUB_RESOLUTION: Record<'1D' | '1W', string> = {
  '1D': '5',   // 5-minute candles
  '1W': '60',  // 60-minute candles
};

// How many days back each range covers
const RANGE_DAYS: Record<Range, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365,
};

// TTL for each range
const RANGE_TTL: Record<Range, number> = {
  '1D': CACHE_TTL.history1D,
  '1W': CACHE_TTL.history1W,
  '1M': CACHE_TTL.history1M,
  '3M': CACHE_TTL.historyLong,
  '6M': CACHE_TTL.historyLong,
  '1Y': CACHE_TTL.historyLong,
};

interface Candle {
  time: number;   // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

async function fetchFinnhubCandles(symbol: string, range: '1D' | '1W'): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - RANGE_DAYS[range] * 24 * 60 * 60;
  const resolution = FINNHUB_RESOLUTION[range];

  const res = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_KEY}`
  );
  const data = await res.json();

  // Finnhub returns { s: 'ok'|'no_data', t: [timestamps], o: [...], h: [...], l: [...], c: [...] }
  if (data.s !== 'ok' || !data.t) return [];

  return data.t.map((timestamp: number, i: number) => ({
    time: timestamp * 1000,  // convert to milliseconds
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v?.[i],
  }));
}

async function fetchYahooHistory(symbol: string, range: Range): Promise<Candle[]> {
  const period1 = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
  const period2 = new Date();

  const result = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: range === '1M' ? '1d' : range === '3M' ? '1d' : '1wk',
  });

  return (result.quotes ?? []).map((q: any) => ({
    time: new Date(q.date).getTime(),
    open: q.open ?? 0,
    high: q.high ?? 0,
    low: q.low ?? 0,
    close: q.close ?? 0,
    volume: q.volume,
  }));
}

async function fetchCoinGeckoHistory(symbol: string, range: Range): Promise<Candle[]> {
  const geckoId = COINGECKO_IDS[symbol];
  const days = RANGE_DAYS[range];
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`
  );
  const data = await res.json();

  // CoinGecko returns { prices: [[timestamp, price], ...] }
  // Convert to OHLCV-style by treating each point as its own candle
  return (data.prices ?? []).map(([time, price]: [number, number]) => ({
    time,
    open: price,
    high: price,
    low: price,
    close: price,
  }));
}

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const range = (req.nextUrl.searchParams.get('range') ?? '1M') as Range;
  const cacheKey = CACHE_KEYS.historyPrefix(symbol, range);

  // Check Redis cache
  const cached = await redis.get<Candle[]>(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true });

  let candles: Candle[];

  // HARD BOUNDARY — enforced by if/else, not convention
  if (CRYPTO_SYMBOLS.has(symbol)) {
    // All crypto charts use CoinGecko regardless of range
    candles = await fetchCoinGeckoHistory(symbol, range);
  } else if (range === '1D' || range === '1W') {
    // Short-range stocks use Finnhub (yahoo-finance2 unreliable for intraday)
    candles = await fetchFinnhubCandles(symbol, range);
  } else {
    // Long-range stocks use yahoo-finance2 (deep history, saves Finnhub quota)
    candles = await fetchYahooHistory(symbol, range);
  }

  await redis.set(cacheKey, candles, { ex: RANGE_TTL[range] });
  return NextResponse.json({ data: candles, cached: false });
}
```

---

### 1.9 Implementation: Frontend Price Hook ⚠️ REVISED (SWR Polling — No WebSockets)

**Completely rewrite `src/hooks/use-asset-prices.ts`:**

The random-walk simulation is deleted entirely. Replaced with SWR polling from the real quotes endpoint. The 15-second interval was chosen to balance freshness against API usage:

```typescript
// src/hooks/use-asset-prices.ts
'use client';
import useSWR from 'swr';
import { useEffect } from 'react';
import { useAssetPriceStore } from '@/store/asset-price-store';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Market data fetch failed: ${r.status}`);
  return r.json();
});

export function useAssetPrices() {
  const setPrices = useAssetPriceStore(state => state.setPrices);
  const prices = useAssetPriceStore(state => state.prices);
  const lastUpdated = useAssetPriceStore(state => state.lastUpdated);

  const { data, error, isLoading, isValidating } = useSWR(
    '/api/market/quotes',
    fetcher,
    {
      refreshInterval: 15_000,       // poll every 15 seconds
      revalidateOnFocus: true,        // refresh when user returns to tab
      revalidateOnReconnect: true,    // refresh after network reconnect
      dedupingInterval: 10_000,       // ignore duplicate requests within 10s
      onSuccess: (data) => {
        if (data?.prices) setPrices(data.prices);
      },
    }
  );

  return {
    prices,
    isLoading,
    isError: !!error,
    isRefreshing: isValidating && !isLoading,
    lastUpdated,
  };
}
```

---

### 1.10 Implementation: Rebuilt Zustand Store with Sliced Selectors

**Replace `src/store/asset-price-store.ts`:**

```typescript
// src/store/asset-price-store.ts
import { create } from 'zustand';

interface PricePoint {
  price: number;
  time: number;
}

interface AssetPriceState {
  prices: Record<string, number>;
  previousPrices: Record<string, number>;
  lastUpdated: number | null;
  setPrices: (newPrices: Record<string, number>) => void;
  getPrice: (symbol: string) => number | null;
}

const MAX_DISPLAY_POINTS = 200;  // rolling window cap — prevents memory leak

export const useAssetPriceStore = create<AssetPriceState>((set, get) => ({
  prices: {},
  previousPrices: {},
  lastUpdated: null,

  setPrices: (newPrices) =>
    set((state) => ({
      previousPrices: { ...state.prices },
      prices: newPrices,
      lastUpdated: Date.now(),
    })),

  getPrice: (symbol) => get().prices[symbol] ?? null,
}));

// ─── SLICED SELECTORS ─────────────────────────────────────────────────────────
// Always import and use these in components. Never call useAssetPriceStore()
// without a selector — that subscribes to the entire store and causes
// the component to re-render on every price update for every asset.

export const selectPrice = (symbol: string) =>
  (state: AssetPriceState) => state.prices[symbol] ?? null;

export const selectPrevPrice = (symbol: string) =>
  (state: AssetPriceState) => state.previousPrices[symbol] ?? null;

export const selectAllPrices =
  (state: AssetPriceState) => state.prices;

export const selectLastUpdated =
  (state: AssetPriceState) => state.lastUpdated;

// Derived selector: direction of last price movement for a symbol
// Returns 'up', 'down', or 'flat'
export const selectPriceDirection = (symbol: string) =>
  (state: AssetPriceState) => {
    const current = state.prices[symbol];
    const previous = state.previousPrices[symbol];
    if (!current || !previous || current === previous) return 'flat';
    return current > previous ? 'up' : 'down';
  };
```

---

### 1.11 Implementation: Remove the Client-Push Price Endpoint

**Delete: `src/app/api/assets/update-prices/route.ts`**

This endpoint accepts price data from the browser and writes it to the database. This is a security anti-pattern regardless of intent — the database must never trust price data from the client.

After deletion, no client-side code should write to the `Asset.price` field. The `Asset` collection becomes metadata-only (name, type, sector, logo). Live prices come exclusively from the server-side cache layer described above.

**Also update `src/lib/models/schemas.ts`:**
```typescript
// AssetModel — remove 'price' as a live-data field, keep as snapshot reference
// Add a comment making this clear:
const AssetSchema = new Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['stock', 'crypto'], required: true },
  sector: { type: String, default: null },
  logo: { type: String, default: null },
  exchange: { type: String, default: null },
  marketCap: { type: Number, default: null },
  // NOTE: 'price' is NOT a live price field. It stores the last known price
  // from the hourly snapshot cron only. Do not read this for UI display.
  // Use /api/market/quotes for live prices.
  lastSnapshotPrice: { type: Number, default: null },
  lastSnapshotAt: { type: Date, default: null },
});
```

---

### 1.12 Implementation: Portfolio Snapshot Cron ⚠️ NEW — Fixes Portfolio History Gap

**Why this is required:** Removing the client-push price endpoint means nothing writes historical price data to MongoDB. Without historical price data, the portfolio-value-over-time chart has nothing to plot. This cron fills that gap.

**Add new MongoDB collection to `src/lib/models/schemas.ts`:**
```typescript
// New collection: PortfolioSnapshot
// One document per user per hour. Powers the "portfolio value over time" chart.
const PortfolioSnapshotSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now },
  totalValue: { type: Number, required: true },    // cash + holdings value at snapshot time
  cashBalance: { type: Number, required: true },
  holdingsValue: { type: Number, required: true },
  priceSnapshot: {                                  // prices used for this calculation
    type: Map,
    of: Number,
    default: {},
  },
});

// Compound index for efficient range queries (get all snapshots for a user in a time range)
PortfolioSnapshotSchema.index({ userId: 1, timestamp: -1 });

export const PortfolioSnapshotModel =
  mongoose.models.PortfolioSnapshot ||
  mongoose.model('PortfolioSnapshot', PortfolioSnapshotSchema);
```

**Create `src/app/api/cron/snapshot-prices/route.ts`:**
```typescript
// src/app/api/cron/snapshot-prices/route.ts
// Vercel Cron — runs every hour
// Fetches all current prices and writes one PortfolioSnapshot per active user

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel, PortfolioModel, PortfolioSnapshotModel } from '@/lib/models/schemas';
import { redis, CACHE_KEYS } from '@/lib/redis';

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron invocation, not a public request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  // Fetch current prices from Redis cache (or external API if cache is cold)
  let prices: Record<string, number> =
    (await redis.get<Record<string, number>>(CACHE_KEYS.stockPrices)) ?? {};
  const cryptoPrices =
    (await redis.get<Record<string, number>>(CACHE_KEYS.cryptoPrices)) ?? {};
  prices = { ...prices, ...cryptoPrices };

  // Get all active users (those with at least one trade in the last 30 days)
  // Avoid snapshotting inactive users to save storage
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await UserModel.find(
    { updatedAt: { $gte: thirtyDaysAgo } },
    { _id: 1, cashBalance: 1 }
  );

  const snapshots = [];

  for (const user of activeUsers) {
    // Get user's current holdings
    const portfolio = await PortfolioModel.findOne({ userId: user._id });
    if (!portfolio) continue;

    let holdingsValue = 0;
    for (const holding of portfolio.holdings) {
      const currentPrice = prices[holding.assetSymbol];
      if (currentPrice) {
        holdingsValue += holding.quantity * currentPrice;
      }
    }

    snapshots.push({
      userId: user._id,
      timestamp: new Date(),
      totalValue: user.cashBalance + holdingsValue,
      cashBalance: user.cashBalance,
      holdingsValue,
      priceSnapshot: prices,
    });
  }

  if (snapshots.length > 0) {
    await PortfolioSnapshotModel.insertMany(snapshots);
  }

  return NextResponse.json({
    success: true,
    snapshotsWritten: snapshots.length,
    timestamp: new Date().toISOString(),
  });
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot-prices",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/update-leaderboard",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**New API route to read portfolio history:**
Create `src/app/api/users/[id]/portfolio-history/route.ts` which queries `PortfolioSnapshotModel` by userId and date range, then returns the `totalValue` and `timestamp` fields to the frontend portfolio chart.

---

## PART 2: Critical Bug Fixes (Fix Before Anything Else)

---

### Fix #1 🔴 — Vercel Root Layout

**File:** `src/app/layout.tsx`

**Problem:** The `'use client'` directive at the top of the root layout breaks Next.js App Router. The root layout MUST be a Server Component to handle metadata, SEO, and static generation.

**Create `src/app/_components/providers.tsx`:**
```typescript
'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { KeyboardShortcutsProvider } from '@/components/shared/keyboard-shortcuts-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <KeyboardShortcutsProvider>
          {children}
        </KeyboardShortcutsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

**Fix `src/app/layout.tsx`:**
```typescript
// No 'use client' — this is a Server Component
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './_components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Oloo — Paper Trading Simulator',
  description: 'Learn to trade with real market data and zero risk.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### Fix #2 🔴 — Compromised Credentials

**Do these right now, before writing a single line of code:**

1. Log into MongoDB Atlas → rotate the database user password → update connection string
2. Go to Google AI Studio → delete the old Gemini key → create a new one
3. Purge git history to remove the committed `.env.local`:
   ```bash
   git filter-repo --path .env.local --invert-paths
   git push origin --force --all
   ```
4. Add to `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```
5. Add all environment variables to Vercel dashboard (Project → Settings → Environment Variables)

---

### Fix #3 🔴 — Email Service (Password Reset)

**Install:** `npm install resend`

**Rewrite `src/lib/email.ts`:**
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  baseUrl: string
): Promise<void> {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const { error } = await resend.emails.send({
    from: 'Oloo <noreply@yourdomain.com>',
    to: toEmail,
    subject: 'Reset your Oloo password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Expires in 1 hour.</p>`,
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
```

**Also add token expiry to the reset flow** in `src/app/api/auth/request-reset/route.ts`:
```typescript
// When creating a reset token:
const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
await UserModel.findByIdAndUpdate(user._id, {
  passwordResetToken: hashedToken,
  passwordResetExpiry: expiry,
});

// When verifying in reset-password route:
const user = await UserModel.findOne({
  passwordResetToken: hashedToken,
  passwordResetExpiry: { $gt: new Date() }, // reject expired tokens
});
```

---

### Fix #4 🟠 — Duplicate Database Field Update

**File:** `src/app/api/users/[id]/execute-trade/route.ts` line ~200

Search for `totalReturnPercent` inside the same `$set` object. Delete the first occurrence. Keep only the final calculated value that appears later in the same update call.

---

### Fix #5 🟠 — MongoDB Connection Race Conditions

**Rewrite `src/lib/mongodb.ts`:**
```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global.__mongoose ?? { conn: null, promise: null };
if (!global.__mongoose) global.__mongoose = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
```

---

## PART 3: Performance Overhaul

---

### Perf Fix #1 🟠 — Zustand Render Thrashing (Sliced Selectors)

**The problem:** Any component calling `const { prices } = useAssetPriceStore()` subscribes to the entire store. Every 15-second price refresh re-renders every subscribed component, even if its specific asset price did not change.

**The fix:** All components must use the exported selectors:
```typescript
// ✅ CORRECT — only re-renders when AAPL specifically changes
const aaplPrice = useAssetPriceStore(selectPrice('AAPL'));
const direction = useAssetPriceStore(selectPriceDirection('AAPL'));

// ❌ WRONG — re-renders on every price update for any asset
const { prices } = useAssetPriceStore();
const aaplPrice = prices['AAPL'];
```

**Files to update:** Every component that renders a price. Run this search to find all of them:
```bash
grep -r "useAssetPriceStore()" src/components --include="*.tsx" -l
```

**Add price flash animation to `globals.css`:**
```css
@keyframes flash-green { 0% { background: #16a34a30; } 100% { background: transparent; } }
@keyframes flash-red   { 0% { background: #dc262630; } 100% { background: transparent; } }
.flash-up   { animation: flash-green 0.8s ease-out; }
.flash-down { animation: flash-red   0.8s ease-out; }
```

---

### Perf Fix #2 🟠 — Charts: Recharts → TradingView Lightweight Charts

**Install:** `npm install lightweight-charts`

**Create `src/components/charts/trading-chart.tsx`:**
```typescript
'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';

interface Candle {
  time: number; open: number; high: number; low: number; close: number;
}

export function TradingChart({
  data,
  livePrice,
}: {
  data: Candle[];
  livePrice?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f293780', style: LineStyle.Dotted },
        horzLines: { color: '#1f293780', style: LineStyle.Dotted },
      },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });

    // Lightweight Charts expects time in seconds, not milliseconds
    series.setData(data.map(d => ({ ...d, time: Math.floor(d.time / 1000) as any })));
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });
    observer.observe(containerRef.current);

    return () => { observer.disconnect(); chart.remove(); };
  }, [data]);   // only recreate when historical data changes

  // Update live price tick efficiently — does NOT recreate the chart
  useEffect(() => {
    if (!seriesRef.current || !livePrice || data.length === 0) return;
    const last = data[data.length - 1];
    seriesRef.current.update({
      time: Math.floor(Date.now() / 1000) as any,
      open: last.open,
      high: Math.max(last.high, livePrice),
      low: Math.min(last.low, livePrice),
      close: livePrice,
    });
  }, [livePrice]);   // only updates the last candle — O(1), no full redraw

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
```

---

### Perf Fix #3 🟠 — MongoDB $bucket Aggregation for History

**File:** In the history route already defined in Section 1.8 — when pulling from MongoDB's `PriceHistory` collection, use `$bucketAuto` instead of loading all records into memory:

```typescript
// Use this pattern instead of fetching all records and filtering in JS:
const pipeline = [
  { $match: { symbol, timestamp: { $gte: startMs, $lte: Date.now() } } },
  {
    $bucketAuto: {
      groupBy: '$timestamp',
      buckets: targetBuckets,  // e.g. 48 for 1D, 52 for 1Y
      output: {
        open:  { $first: '$price' },
        close: { $last: '$price' },
        high:  { $max: '$price' },
        low:   { $min: '$price' },
        time:  { $avg: '$timestamp' },
      },
    },
  },
  { $sort: { time: 1 } },
];
const candles = await PriceHistoryModel.aggregate(pipeline);
```

---

### Perf Fix #4 🟠 — Memory Leak: Rolling Cache Cap

The `priceHistory` buffer in the Zustand store must have a maximum length. The rolling window approach drops the oldest data point when the buffer is full:

```typescript
// In the store's setPrices — always cap at MAX_POINTS
const MAX_POINTS = 200;

// When appending to a price buffer:
const newBuffer = [...oldBuffer.slice(-(MAX_POINTS - 1)), newPoint];
```

---

## PART 4: Architecture & Reliability Fixes

---

### Arch Fix #1 🟠 — Zod Validation on All API Routes

**Install:** `npm install zod`

**Create `src/lib/schemas/api-schemas.ts`:**
```typescript
import { z } from 'zod';

export const ExecuteTradeSchema = z.object({
  assetSymbol: z.string().min(1).max(10).regex(/^[A-Z]+$/),
  orderType: z.enum(['buy', 'sell', 'limit-buy', 'limit-sell', 'stop-loss']),
  quantity: z.number().positive().max(1_000_000),
  price: z.number().positive(),
  limitPrice: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(50).trim(),
});

export const PriceAlertSchema = z.object({
  symbol: z.string().min(1).max(10),
  targetPrice: z.number().positive(),
  direction: z.enum(['above', 'below']),
});

export const HistoryQuerySchema = z.object({
  range: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y']).default('1M'),
});
```

**Validation helper (avoids repeating try/catch):**
```typescript
// src/lib/validate-request.ts
import { ZodSchema, ZodError } from 'zod';
import { NextResponse } from 'next/server';

export async function validateBody<T>(req: Request, schema: ZodSchema<T>):
  Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          { error: 'Validation failed', details: e.flatten() },
          { status: 400 }
        ),
      };
    }
    return { data: null, error: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) };
  }
}
```

---

### Arch Fix #2 🟠 — React Error Boundaries

**Create `src/components/shared/error-boundary.tsx`:**
```typescript
'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; section?: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    // Replace with Sentry.captureException(error) in production
    console.error(`[ErrorBoundary:${this.props.section}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          This section encountered an error. Refresh the page to retry.
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap every major dashboard section in `<ErrorBoundary section="name">`.

---

### Arch Fix #3 🟡 — Standardise User ID

All API routes must use MongoDB `_id` (ObjectId). The session JWT contains `user.id` which is the ObjectId string. Create a helper:

```typescript
// src/lib/get-user-by-id.ts
import mongoose from 'mongoose';
import { UserModel } from './models/schemas';

export async function getUserById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid user ID: ${id}`);
  }
  return UserModel.findById(id);
}
```

Run this search to find routes that still use email as a lookup key:
```bash
grep -r "findOne.*email" src/app/api/users --include="*.ts" -l
```

---

### Arch Fix #4 🟡 — Structured Logging

**Create `src/lib/logger.ts`:**
```typescript
const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  info: (msg: string, data?: unknown) =>
    { if (!isProd) console.log(`[INFO] ${msg}`, data ?? ''); },
  error: (msg: string, err?: unknown) =>
    { console.error(`[ERROR] ${msg}`, err ?? ''); /* Sentry.captureException(err) */ },
  warn: (msg: string, data?: unknown) =>
    { if (!isProd) console.warn(`[WARN] ${msg}`, data ?? ''); },
};
```

Replace all `console.error(...)` calls with `logger.error(...)`:
```bash
# Count how many need replacing:
grep -r "console\.error\|console\.log" src/app/api src/lib --include="*.ts" | wc -l
```

---

## PART 5: New Features to Build

---

### Feature #1 🟢 — Market Hours Indicator

**Create `src/lib/market-hours.ts`:**
```typescript
export type SessionType = 'pre-market' | 'regular' | 'after-hours' | 'closed';

export function getMarketStatus(): {
  isOpen: boolean;
  sessionType: SessionType;
  nextEvent: string;
} {
  const nyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const mins = nyTime.getHours() * 60 + nyTime.getMinutes();

  if (day === 0 || day === 6)
    return { isOpen: false, sessionType: 'closed', nextEvent: 'Opens Monday 9:30 AM ET' };
  if (mins >= 4 * 60 && mins < 9 * 60 + 30)
    return { isOpen: false, sessionType: 'pre-market', nextEvent: 'Regular session opens 9:30 AM ET' };
  if (mins >= 9 * 60 + 30 && mins < 16 * 60)
    return { isOpen: true, sessionType: 'regular', nextEvent: 'Closes 4:00 PM ET' };
  if (mins >= 16 * 60 && mins < 20 * 60)
    return { isOpen: false, sessionType: 'after-hours', nextEvent: 'After-hours end 8:00 PM ET' };
  return { isOpen: false, sessionType: 'closed', nextEvent: 'Opens 9:30 AM ET' };
}
```

Add `<MarketStatusBadge />` to the dashboard header. For crypto assets, always show "24/7 Open".

---

### Feature #2 🟢 — Real-Time News Feed

**Create `src/app/api/market/news/route.ts`:**
```typescript
// GET /api/market/news?symbol=AAPL  (company news)
// GET /api/market/news               (general market news)

import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const cacheKey = symbol ? CACHE_KEYS.newsPrefix(symbol) : 'news:market';
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  let url: string;
  if (symbol) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${FINNHUB_KEY}`;
  } else {
    url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
  }

  const res = await fetch(url);
  const news = (await res.json()).slice(0, 15);
  await redis.set(cacheKey, news, { ex: CACHE_TTL.news });
  return NextResponse.json(news);
}
```

Poll with SWR every 5 minutes. Show on dashboard sidebar and on individual asset trade pages.

---

### Feature #3 🟢 — Price Alerts System

**Database addition to User schema:**
```typescript
priceAlerts: [{
  symbol: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  direction: { type: String, enum: ['above', 'below'], required: true },
  isTriggered: { type: Boolean, default: false },
  notifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}],
```

**New API routes:**
```
POST   /api/users/[id]/alerts          — Create alert
GET    /api/users/[id]/alerts          — List alerts
DELETE /api/users/[id]/alerts/[alertId] — Delete alert
```

**Cron: `src/app/api/cron/check-alerts/route.ts`** — Runs every 5 minutes. Fetches current prices, checks all untriggered alerts, sends email (via Resend) when triggered.

**UI:** Alert bell icon on each asset card. Modal with "Alert me when [SYMBOL] goes above/below $___".

---

### Feature #4 🟢 — Portfolio Analytics Dashboard

**New metrics — all computed in `src/lib/portfolio-analytics.ts`:**
- **Win Rate:** Percentage of closed sell trades that were profitable
- **Profit Factor:** Total winning trade value ÷ total losing trade value. Above 1.0 is net profitable.
- **Max Drawdown:** Largest peak-to-trough decline in portfolio value (needs snapshot data from 1.12)
- **Sharpe Ratio:** (Portfolio Return − Risk-Free Rate) ÷ Standard Deviation of returns (simplified)
- **Sector Allocation:** Donut chart of holdings by sector using the `sector` field added to AssetModel
- **Benchmark Comparison:** Your return vs S&P 500 over the same period (fetch SPY data from Finnhub)

**UI additions to the portfolio page:**
- New "Analytics" tab alongside "Holdings"
- Stat cards: Win Rate, Profit Factor, Best Trade, Worst Trade
- Line chart: Portfolio value vs SPY (benchmark) using snapshot data
- Donut chart: Sector allocation

---

### Feature #5 🟢 — Limit Orders and Stop-Loss

**Database additions to Trade schema:**
```typescript
status:     { type: String, enum: ['pending', 'filled', 'cancelled', 'expired'], default: 'filled' },
limitPrice: { type: Number, default: null },
expiresAt:  { type: Date, default: null },
```

**New API route:** `src/app/api/users/[id]/pending-orders/route.ts`

**Order processing cron** (`/api/cron/check-pending-orders`, runs every 5 minutes):
- Fetches all orders with `status: 'pending'`
- Compares `limitPrice` against current market prices
- Executes orders that meet their conditions via the existing `execute-trade` logic
- Marks expired orders as `cancelled`

**UI:** Two tabs on the trade page: "Market Order" (instant) and "Limit Order" (price input + expiry selector).

---

### Feature #6 🟢 — Global Leaderboard

**Database additions to User schema:**
```typescript
isPublic:    { type: Boolean, default: true },
displayName: { type: String, default: null },
leaderboardStats: {
  totalReturnPercent: { type: Number, default: 0 },
  rank: { type: Number, default: null },
  lastCalculated: { type: Date, default: null },
},
```

**Cron** (`/api/cron/update-leaderboard`, runs hourly):
Sorts all public users by `portfolioValue` descending, writes `rank` and `totalReturnPercent` back to each user document.

**New page: `src/app/leaderboard/page.tsx`** — Table of top 100 users, paginated, with Rank, Name, Portfolio Value, Total Return %, and badge count columns.

---

### Feature #7 🟢 — Portfolio Snapshot API (Enables History Chart)

**New route:** `src/app/api/users/[id]/portfolio-history/route.ts`

```typescript
// GET /api/users/[id]/portfolio-history?range=1W
// Returns the time-series portfolio value data from PortfolioSnapshot collection

export async function GET(req, { params }) {
  const { id } = params;
  const range = req.nextUrl.searchParams.get('range') ?? '1W';
  const days = { '1D': 1, '1W': 7, '1M': 30, '3M': 90 }[range] ?? 7;
  const since = new Date(Date.now() - days * 86400000);

  const snapshots = await PortfolioSnapshotModel.find(
    { userId: id, timestamp: { $gte: since } },
    { totalValue: 1, timestamp: 1, _id: 0 }
  ).sort({ timestamp: 1 });

  return NextResponse.json(snapshots);
}
```

This powers the portfolio-value-over-time line chart on the portfolio page.

---

### Feature #8 🟢 — Stock Screener

**New page: `src/app/screener/page.tsx`**

**Filters:** Asset type, sector, price range, daily change %, market cap tier. All data comes from your Asset collection enriched with live prices from the quotes endpoint.

**New route:** `src/app/api/market/screener/route.ts`
```typescript
// Accepts: ?type=stock&sector=Technology&minPrice=10&maxPrice=500&minChange=3
// Joins Asset metadata with live prices from Redis cache
// Returns filtered, sorted asset list
```

---

### Feature #9 🟢 — Technical Indicators on Charts

**Install:** `npm install technicalindicators`

**Create `src/lib/indicators.ts`:**
```typescript
import { SMA, EMA, RSI, MACD } from 'technicalindicators';

// All functions return arrays with leading nulls to align with input data
export const indicators = {
  sma: (prices: number[], period: number) => {
    const result = SMA.calculate({ period, values: prices });
    return [...Array(prices.length - result.length).fill(null), ...result];
  },
  ema: (prices: number[], period: number) => {
    const result = EMA.calculate({ period, values: prices });
    return [...Array(prices.length - result.length).fill(null), ...result];
  },
  rsi: (prices: number[], period = 14) => {
    const result = RSI.calculate({ period, values: prices });
    return [...Array(prices.length - result.length).fill(null), ...result];
  },
};
```

**UI:** "Indicators" dropdown above the chart. Checkboxes for SMA(20), SMA(50), EMA(20), RSI(14). RSI renders in a separate panel below the main chart (TradingView Lightweight Charts supports panels natively).

---

### Feature #10 🟢 — Earnings Calendar

**New route:** `src/app/api/market/earnings/route.ts`
```typescript
// Uses Finnhub earnings calendar: /api/v1/calendar/earnings
// Filters to only return symbols in the user's watchlist + portfolio
// Cached in Redis for 6 hours (earnings dates don't change minute to minute)
```

**UI:** Earnings calendar widget on dashboard. Warning badge on trade pages when an earnings event is within 5 days ("⚠️ Earnings in 3 days — expect high volatility").

---

### Feature #11 🟢 — Trade Journal

**Database additions to Trade schema:**
```typescript
notes:     { type: String, default: null, maxLength: 1000 },
strategy:  { type: String, enum: ['momentum', 'value', 'swing', 'scalp', 'news', 'other'], default: null },
tags:      [{ type: String }],
sentiment: { type: String, enum: ['bullish', 'bearish', 'neutral'], default: null },
```

**New route:** `PATCH /api/users/[id]/trades/[tradeId]/notes`

**UI:** "Add Notes" button on each trade in the history list. Modal with text area, strategy dropdown, and sentiment buttons. Grouping by strategy tag on the trade history page.

---

### Feature #12 🟢 — Asset Comparison Mode

**New page:** `src/app/compare/page.tsx` at URL `/compare?a=AAPL&b=TSLA&range=3M`

Both assets' prices are indexed to 100 at the start of the range, then plotted as two line series on the same TradingView chart. Stat comparison table below the chart.

---

### Optional Enhancement: Server-Sent Events Upgrade Path (Phase 5)

If you later want sub-5-second price updates without leaving Vercel, Server-Sent Events (SSE) via the Edge Runtime is the right path. Unlike WebSockets, SSE is one-way (server pushes to client), stateless-friendly, and supported by Vercel's Edge Functions.

The architecture: Vercel Edge Function reads from Upstash Redis every 2 seconds and streams the latest prices to connected clients. The client receives price updates as an event stream instead of polling.

This is an upgrade to the transport layer only. The Zustand store, sliced selectors, and component logic do not change.

---

## PART 6: Complete Backend Changes Map

---

### Files to DELETE
```
src/hooks/use-asset-prices.ts (old simulation version)
src/app/api/assets/update-prices/route.ts  — clients must never push prices to DB
```

### Files to CREATE
```
src/lib/redis.ts                              — Upstash Redis client + cache keys
src/lib/price-cache.ts                        — DELETED (replaced by redis.ts)
src/lib/market-hours.ts                       — NYSE open/close logic
src/lib/alert-checker.ts                      — Price alert processing
src/lib/order-processor.ts                    — Limit order filling logic
src/lib/portfolio-analytics.ts               — Analytics calculations
src/lib/indicators.ts                         — Technical indicators (SMA, EMA, RSI)
src/lib/logger.ts                             — Structured logging utility

src/lib/schemas/api-schemas.ts               — Zod validation schemas
src/lib/validate-request.ts                  — Validation helper utility

src/app/api/market/quotes/route.ts           — Batch real-time prices (Redis-cached)
src/app/api/market/quote/[symbol]/route.ts   — Single asset extended quote
src/app/api/market/history/[symbol]/route.ts — Historical OHLCV (hard data source boundary)
src/app/api/market/news/route.ts             — Finnhub news feed
src/app/api/market/screener/route.ts         — Stock screener with filters
src/app/api/market/earnings/route.ts         — Finnhub earnings calendar

src/app/api/users/[id]/alerts/route.ts               — CRUD for price alerts
src/app/api/users/[id]/alerts/[alertId]/route.ts      — Delete single alert
src/app/api/users/[id]/pending-orders/route.ts        — Limit orders list
src/app/api/users/[id]/portfolio-history/route.ts     — Snapshot-based history chart
src/app/api/users/[id]/trades/[tradeId]/notes/route.ts — Trade journal patch

src/app/api/leaderboard/route.ts                     — Global leaderboard endpoint

src/app/api/cron/snapshot-prices/route.ts            — Hourly portfolio snapshot
src/app/api/cron/update-leaderboard/route.ts         — Hourly rank calculation
src/app/api/cron/check-alerts/route.ts               — 5-min alert checker
src/app/api/cron/check-pending-orders/route.ts       — 5-min limit order processor

src/app/_components/providers.tsx                    — Client providers wrapper (layout fix)
src/app/leaderboard/page.tsx                         — Leaderboard page
src/app/screener/page.tsx                            — Screener page
src/app/compare/page.tsx                             — Comparison chart page

src/components/charts/trading-chart.tsx              — TradingView canvas chart
src/components/news/news-feed.tsx                    — News feed component
src/components/market/market-status-badge.tsx        — Market open/closed indicator
src/components/portfolio/analytics-panel.tsx         — Analytics tab
src/components/shared/error-boundary.tsx             — React error boundary
src/store/asset-price-store.ts                       — Rebuilt Zustand store
```

### Files to MODIFY
```
src/app/layout.tsx                     — Remove 'use client', add real metadata
src/lib/mongodb.ts                     — Fix connection race conditions
src/lib/email.ts                       — Implement Resend email service
src/lib/badge-service.ts              — Add logger, add Zod validation
src/lib/models/schemas.ts             — Add all new fields + PortfolioSnapshot model:
                                         User:  priceAlerts, watchlistGroups, isPublic,
                                                displayName, leaderboardStats,
                                                passwordResetToken, passwordResetExpiry
                                         Trade: status, limitPrice, expiresAt,
                                                notes, strategy, tags, sentiment
                                         Asset: sector, logo, exchange, lastSnapshotPrice
                                         NEW:   PortfolioSnapshotModel

src/app/api/auth/signup/route.ts       — Add Zod validation
src/app/api/auth/request-reset/route.ts — Connect real email + add token expiry
src/app/api/auth/reset-password/route.ts — Check token expiry on reset

src/app/api/users/[id]/execute-trade/route.ts — Fix duplicate field, add Zod,
                                                  use server-side price verification
src/app/api/users/[id]/portfolio/route.ts     — Use live prices from cache for valuation
src/app/api/assets/route.ts                   — Remove price field from response
src/app/api/assets/[symbol]/quote/route.ts    — Redirect to /api/market/quote

src/app/trade/[symbol]/page.tsx        — Use new quote API, add limit order tab
src/components/charts/stock-chart.tsx  — Replace entirely with TradingChart
src/components/watchlist/watchlist-table.tsx   — Use sliced Zustand selectors
src/components/portfolio/holdings-table.tsx    — Use sliced Zustand selectors
src/components/dashboard/market-overview.tsx   — Use sliced Zustand selectors

vercel.json                            — Add all cron jobs
.gitignore                             — Ensure .env* is excluded
```

### Database Schema Changes Summary
```typescript
// ─── User model additions ──────────────────────────────
priceAlerts:       [{ symbol, targetPrice, direction, isTriggered, notifiedAt, createdAt }]
watchlistGroups:   [{ name, symbols, color }]
isPublic:          Boolean (default true)
displayName:       String (null = use email prefix)
leaderboardStats:  { totalReturnPercent, rank, lastCalculated }
passwordResetToken: String
passwordResetExpiry: Date

// ─── Trade model additions ─────────────────────────────
status:     enum ['pending', 'filled', 'cancelled', 'expired'] (default 'filled')
limitPrice: Number (null for market orders)
expiresAt:  Date   (null for GTC orders)
notes:      String (max 1000 chars)
strategy:   enum ['momentum', 'value', 'swing', 'scalp', 'news', 'other']
tags:       [String]
sentiment:  enum ['bullish', 'bearish', 'neutral']

// ─── Asset model changes ────────────────────────────────
sector:             String
logo:               String (URL)
exchange:           String
lastSnapshotPrice:  Number (replaces 'price' as live data field)
lastSnapshotAt:     Date

// ─── NEW: PortfolioSnapshot collection ─────────────────
userId:         ObjectId (indexed)
timestamp:      Date (indexed compound with userId)
totalValue:     Number
cashBalance:    Number
holdingsValue:  Number
priceSnapshot:  Map<String, Number>
```

---

## PART 7: Phased Implementation Roadmap

---

### Phase 1: Critical Fixes — Week 1
**Goal:** App is deployable, secure, and email works.

| Task | Effort | Priority |
|---|---|---|
| Rotate MongoDB URI + Gemini key | 10 min | 🔴 Do now |
| Fix `.gitignore`, purge git history | 20 min | 🔴 Do now |
| Fix root layout (Server Component + providers wrapper) | 1 hr | 🔴 Critical |
| Fix MongoDB connection race conditions | 30 min | 🔴 Critical |
| Fix duplicate `totalReturnPercent` in execute-trade | 10 min | 🔴 Critical |
| Implement Resend email + token expiry for password reset | 2 hr | 🔴 Critical |
| Add all env vars to Vercel dashboard | 20 min | 🔴 Critical |

**Deliverable:** App deploys to Vercel. Credentials secure. Password reset works.

---

### Phase 2: Real Market Data + Cache Infrastructure — Week 2
**Goal:** Real prices everywhere. Upstash Redis live. Simulation deleted.

| Task | Effort | Priority |
|---|---|---|
| Register Finnhub + Upstash accounts, get keys | 10 min | 🔴 Critical |
| Add FINNHUB_API_KEY + Upstash vars to Vercel | 5 min | 🔴 Critical |
| Build `src/lib/redis.ts` | 1 hr | 🔴 Critical |
| Build `/api/market/quotes` (batch, Redis-cached) | 3 hr | 🔴 Critical |
| Build `/api/market/quote/[symbol]` (single, Redis-cached) | 2 hr | 🔴 Critical |
| Build `/api/market/history/[symbol]` (hard data boundary) | 4 hr | 🔴 Critical |
| Rebuild Zustand store with sliced selectors | 2 hr | 🔴 Critical |
| Rebuild `use-asset-prices.ts` (SWR polling, real data) | 1 hr | 🔴 Critical |
| Delete `update-prices` API route | 30 min | 🔴 Critical |
| Update portfolio valuation to use live prices | 2 hr | 🟠 High |
| Fix all components to use sliced Zustand selectors | 3 hr | 🟠 High |
| Add `PortfolioSnapshot` model to schemas | 1 hr | 🟠 High |
| Build snapshot cron + portfolio-history endpoint | 3 hr | 🟠 High |
| Configure `vercel.json` cron jobs | 30 min | 🟠 High |
| Verify symbol name mapping: seed data vs Finnhub | 1 hr | 🔴 Critical |

> **Do not skip symbol verification.** Open your MongoDB Asset collection and list all symbols. Open Finnhub's API sandbox and verify each symbol returns a valid quote. Any symbol that returns `{ c: 0 }` needs to be corrected in your seed data before going live.

**Deliverable:** Real prices on all assets. Portfolio values are accurate. Portfolio history chart populated hourly.

---

### Phase 3: Performance & Reliability — Week 3
**Goal:** 60FPS charts, crash-safe app, all inputs validated.

| Task | Effort | Priority |
|---|---|---|
| Migrate charts to TradingView Lightweight Charts | 4 hr | 🟠 High |
| Add MongoDB `$bucket` aggregation to history route | 2 hr | 🟠 High |
| Add rolling window cap to price store | 1 hr | 🟠 High |
| Add React Error Boundaries to all major sections | 2 hr | 🟠 High |
| Add Zod validation to all API routes | 4 hr | 🟡 Medium |
| Replace all `console.error` with `logger.error` | 1 hr | 🟡 Medium |
| Standardise all user lookups to ObjectId | 2 hr | 🟡 Medium |
| Add price flash animation (green/red) | 1 hr | 🟢 Nice |
| Add market hours indicator to dashboard | 2 hr | 🟢 Nice |

**Deliverable:** Charts render smoothly. No full-page crashes. Clean input validation.

---

### Phase 4: Core Engagement Features — Weeks 4–5
**Goal:** Transform from a basic buy/sell tool into a real learning platform.

| Task | Effort |
|---|---|
| Real-time news feed (Finnhub + Redis cache) | 3 hr |
| Price alerts (schema + API + cron + email) | 6 hr |
| Portfolio analytics (win rate, Sharpe, drawdown, benchmark) | 7 hr |
| Limit orders + stop-loss (schema + processor cron) | 8 hr |
| Global leaderboard (schema + API + cron + UI) | 5 hr |
| Earnings calendar widget | 3 hr |

**Deliverable:** Meaningful engagement loop beyond basic trading.

---

### Phase 5: Advanced Features — Weeks 6–8

| Task | Effort |
|---|---|
| Technical indicators on charts (SMA, EMA, RSI, MACD) | 6 hr |
| Stock screener page | 5 hr |
| Trade journal (notes, strategy, tags) | 4 hr |
| Asset comparison mode (/compare page) | 4 hr |
| Watchlist grouping | 3 hr |
| Complete or remove placeholder i18n languages | 2 hr |
| Write automated tests (trade execution, badge logic) | 6 hr |
| (Optional) SSE upgrade for sub-5s price updates | 6 hr |

**Deliverable:** Full-featured trading simulator. Automated test coverage on critical paths.

---

## Quick Reference: The Six Things To Do Right Now

1. **Rotate your MongoDB URI and Gemini API key.** They are compromised. Do this before anything else.
2. **Fix `src/app/layout.tsx`** — remove `'use client'`, extract providers. This is why Vercel deploys fail.
3. **Register at [finnhub.io](https://finnhub.io) and [upstash.com](https://upstash.com).** Both are free. Get your API keys.
4. **Build the Redis-cached `/api/market/quotes` route.** This is the single most impactful change to the platform.
5. **Delete the random-walk simulation** in the old `use-asset-prices.ts` and replace with SWR polling.
6. **Verify symbol mapping** between your MongoDB seed data and Finnhub before shipping to any real user.

---

*Document v2.1 — Revised June 2026. Incorporates architectural review feedback: Upstash Redis cache, explicit historical data source boundaries, portfolio snapshot cron, and resolved WebSocket/polling decision.*
