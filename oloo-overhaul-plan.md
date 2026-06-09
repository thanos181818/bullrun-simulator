# Oloo Trading Platform — Complete Overhaul & Feature Roadmap
**Version 2.0 Planning Document | June 2026**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [THE CORE PROBLEM: Real Market Data](#part-1-the-core-problem-real-market-data)
3. [Critical Bug Fixes](#part-2-critical-bug-fixes-fix-before-anything-else)
4. [Performance Overhaul](#part-3-performance-overhaul)
5. [Architecture & Reliability](#part-4-architecture--reliability-fixes)
6. [New Features to Build](#part-5-new-features-to-build)
7. [Complete Backend Changes Map](#part-6-complete-backend-changes-map)
8. [Phased Implementation Roadmap](#part-7-phased-implementation-roadmap)

---

## Executive Summary

The Oloo platform has a solid foundation — MongoDB transactions, badge gamification, an AI insights engine, and a clean UI architecture. However, there are **14 active bugs**, a **fundamentally broken data layer** (random-walk simulation instead of real prices), and several missing features that users of a trading simulator expect as standard.

This document provides exact solutions for every issue, a recommended real-data architecture, and a prioritised feature roadmap. Issues are graded:

- 🔴 **CRITICAL** — App is broken or insecure right now
- 🟠 **HIGH** — Significantly harms user experience
- 🟡 **MEDIUM** — Technical debt, should fix soon
- 🟢 **ENHANCEMENT** — New feature that adds real value

---

## PART 1: THE CORE PROBLEM — Real Market Data

This is the single most important section in the entire document. Every other improvement is secondary to fixing the data layer. A trading simulator showing made-up numbers is a toy; one showing real prices is a learning tool.

### Why the Current Simulation Is a Problem

The current setup in `src/hooks/use-asset-prices.ts` generates prices using a random-walk algorithm on the client side:

- Prices are **completely fabricated** — they have no relationship to actual market conditions
- A user buys "Apple stock" at $195, but the real price is $210 — every portfolio calculation is meaningless
- The trending logic (direction flip every 3–5 hours) teaches users **wrong market behaviour**
- There is no concept of market open/close, earnings, news events, or volatility clustering
- Users cannot learn anything useful about real trading because the data is fictional

The fix is not complicated, but it requires touching the data layer from the API all the way through to the frontend. Here is the full plan.

---

### 1.1 API Provider Comparison

You need a market data provider. Here is a detailed comparison of every viable free-tier option:

| Provider | Free Tier | WebSocket | Stocks | Crypto | Historical | Reliability | Notes |
|---|---|---|---|---|---|---|---|
| **Finnhub** | 60 req/min | ✅ 50 symbols | ✅ US + Global | ✅ | ✅ 1yr | ⭐⭐⭐⭐⭐ | Best free option. Also has company news and fundamentals. |
| **Twelve Data** | 800 req/day, 8/min | ✅ 50 symbols | ✅ Wide coverage | ✅ | ✅ Deep history | ⭐⭐⭐⭐ | Best for historical OHLCV. Slightly complex auth. |
| **Yahoo Finance (yahoo-finance2)** | Unlimited | ❌ | ✅ | ✅ | ✅ Deep history | ⭐⭐ | **Unofficial scraper. Not for production. Can break without warning.** |
| **Alpha Vantage** | 25 req/day | ❌ | ✅ | ✅ | ✅ | ⭐⭐⭐ | Far too limited for real-time use. OK for fundamentals only. |
| **Polygon.io** | End-of-day only | ❌ (free) | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | Best production option but requires paid plan for real-time. |
| **Alpaca Markets** | IEX feed (15-min delay) | ✅ | ✅ US only | ❌ | ✅ | ⭐⭐⭐⭐ | Great for paper trading, weak for crypto. |
| **CoinGecko** | 30 req/min | ❌ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ | Best free crypto data. Pairs well with Finnhub for stocks. |

### 1.2 Recommended Data Stack (Free Tier)

Use two providers — one for stocks, one for crypto. This is the most pragmatic free setup:

**Stocks & ETFs:** [Finnhub.io](https://finnhub.io)
- Register free at finnhub.io — you get an API key immediately
- 60 REST calls/minute is enough for a simulator with good caching
- Real-time WebSocket for up to 50 symbols simultaneously
- Also provides company news, earnings calendar, basic fundamentals
- API key format: `FINNHUB_API_KEY=your_key_here`

**Crypto:** [CoinGecko API](https://www.coingecko.com/api/documentation)
- Completely free, no key required for basic endpoints
- Returns real-time prices for any cryptocurrency
- Very reliable and widely used
- Endpoint example: `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`

**Historical Charts:** Keep `yahoo-finance2` for historical chart data only (not for live prices). It is reliable enough for OHLCV candles that are days or weeks old.

---

### 1.3 New Data Architecture Overview

The architecture shift is from a client-side random-walk simulator to a server-side cached proxy:

```
BEFORE (broken):
Client Browser → random-walk algorithm in use-asset-prices.ts → fake prices

AFTER (correct):
Finnhub/CoinGecko → Next.js API Route (with 10s server cache) → SWR polling client → Zustand store → UI
Yahoo Finance → Next.js API Route (MongoDB aggregation) → chart component
```

The key insight: **all external API calls happen on the server**, not the client. The server caches responses so you do not burn through rate limits. The client polls your own `/api/market/quotes` every 10–15 seconds.

---

### 1.4 Implementation: New Environment Variables

Add these to `.env.local` and to Vercel's Environment Variables dashboard:

```bash
# Market Data (Required)
FINNHUB_API_KEY=your_finnhub_key_here

# CoinGecko has no key for free tier — no variable needed

# Internal API security (generate a random 32-char string)
INTERNAL_API_SECRET=some_random_long_string_here

# Existing variables (keep these)
MONGODB_URI=your_mongo_uri
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://yourdomain.com
GEMINI_API_KEY=your_gemini_key
```

---

### 1.5 Implementation: Server-Side Price Cache

**Create a new file: `src/lib/price-cache.ts`**

This is a lightweight in-memory cache with TTL (time-to-live) that prevents hammering the external APIs on every request. In a serverless environment like Vercel, each function invocation may have its own memory, so this acts as a per-invocation buffer and reduces rate limit pressure.

```typescript
// src/lib/price-cache.ts
interface CacheEntry {
  data: Record<string, number>;
  timestamp: number;
}

// Cache TTL in milliseconds — 10 seconds for stocks, 15 for crypto
const STOCK_CACHE_TTL = 10_000;
const CRYPTO_CACHE_TTL = 15_000;

const cache = new Map<string, CacheEntry>();

export function getCached(key: string): Record<string, number> | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const ttl = key === 'crypto' ? CRYPTO_CACHE_TTL : STOCK_CACHE_TTL;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: Record<string, number>): void {
  cache.set(key, { data, timestamp: Date.now() });
}
```

---

### 1.6 Implementation: New API Route — Batch Stock Quotes

**Create: `src/app/api/market/quotes/route.ts`**

This single endpoint fetches real prices for multiple symbols at once, caches the result server-side for 10 seconds, and returns a clean JSON object to the frontend.

```typescript
// src/app/api/market/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/price-cache';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

// The fixed list of stock symbols your app supports
const STOCK_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'META', 'NVDA', 'NFLX'];

async function fetchFinnhubQuote(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 0 } }  // no Next.js caching — we handle it ourselves
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Finnhub returns { c: currentPrice, h: high, l: low, o: open, pc: prevClose }
    return data.c > 0 ? data.c : null;
  } catch {
    return null;
  }
}

async function fetchCryptoPrices(): Promise<Record<string, number>> {
  // Map your internal symbols to CoinGecko IDs
  const idMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
  };

  const ids = Object.values(idMap).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { next: { revalidate: 0 } }
  );
  const data = await res.json();

  const result: Record<string, number> = {};
  for (const [symbol, geckoId] of Object.entries(idMap)) {
    if (data[geckoId]?.usd) {
      result[symbol] = data[geckoId].usd;
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  // Check cache first
  const cachedStocks = getCached('stocks');
  const cachedCrypto = getCached('crypto');

  let stockPrices: Record<string, number> = cachedStocks ?? {};
  let cryptoPrices: Record<string, number> = cachedCrypto ?? {};

  // Fetch only what is not cached
  if (!cachedStocks) {
    const results = await Promise.all(
      STOCK_SYMBOLS.map(async (sym) => ({
        symbol: sym,
        price: await fetchFinnhubQuote(sym),
      }))
    );
    stockPrices = {};
    for (const { symbol, price } of results) {
      if (price !== null) stockPrices[symbol] = price;
    }
    setCache('stocks', stockPrices);
  }

  if (!cachedCrypto) {
    cryptoPrices = await fetchCryptoPrices();
    setCache('crypto', cryptoPrices);
  }

  return NextResponse.json({
    prices: { ...stockPrices, ...cryptoPrices },
    timestamp: Date.now(),
    source: 'live',
  });
}
```

---

### 1.7 Implementation: New API Route — Single Asset Quote

**Create: `src/app/api/market/quote/[symbol]/route.ts`**

Used by the trade page when you need one specific asset's price with extended data:

```typescript
// src/app/api/market/quote/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE']);
const COINGECKO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
  'BNB': 'binancecoin', 'ADA': 'cardano', 'DOGE': 'dogecoin',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();

  if (CRYPTO_SYMBOLS.has(symbol)) {
    const geckoId = COINGECKO_ID_MAP[symbol];
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false`
    );
    const data = await res.json();
    return NextResponse.json({
      symbol,
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      marketCap: data.market_data.market_cap.usd,
      volume: data.market_data.total_volume.usd,
    });
  }

  // Stock quote from Finnhub
  const [quoteRes, profileRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
  ]);

  const quote = await quoteRes.json();
  const profile = await profileRes.json();

  return NextResponse.json({
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
    marketCap: profile.marketCapitalization * 1_000_000,
    logo: profile.logo,
  });
}
```

---

### 1.8 Implementation: Historical Data Route (Improved)

**Modify: `src/app/api/market/history/[symbol]/route.ts`**

Replace the current yahoo-finance2-dependent history route with one that uses Finnhub for stocks and CoinGecko for crypto, falling back to yahoo-finance2 for deep historical charts:

```typescript
// Supported range params: '1D', '1W', '1M', '3M', '6M', '1Y'
// For '1D': use Finnhub candles (1-minute intervals)
// For '1W' and beyond: use yahoo-finance2 (already working)
// This keeps yahoo-finance2 for what it does best — deep historical data
```

The key change: **do NOT use yahoo-finance2 for real-time or recent prices**. Only use it for charts going back weeks, months, or years.

---

### 1.9 Implementation: Replace the Frontend Price Hook

**Completely rewrite: `src/hooks/use-asset-prices.ts`**

Delete all the random-walk simulation code. Replace it with a simple SWR hook that polls your new real-data API:

```typescript
// src/hooks/use-asset-prices.ts
import useSWR from 'swr';
import { useAssetPriceStore } from '@/store/asset-price-store';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useAssetPrices() {
  const setPrices = useAssetPriceStore(state => state.setPrices);  // sliced selector!
  const prices = useAssetPriceStore(state => state.prices);        // sliced selector!

  const { data, error, isLoading } = useSWR(
    '/api/market/quotes',
    fetcher,
    {
      refreshInterval: 15_000,      // poll every 15 seconds — respectful of free tier limits
      revalidateOnFocus: true,      // refresh when user comes back to tab
      dedupingInterval: 10_000,     // don't fire duplicate requests within 10s
      onSuccess: (data) => {
        if (data?.prices) {
          setPrices(data.prices);   // update global store
        }
      },
    }
  );

  return {
    prices,
    isLoading,
    isError: !!error,
    lastUpdated: data?.timestamp,
  };
}
```

---

### 1.10 Implementation: Update the Zustand Store

**Modify: `src/store/asset-price-store.ts`** (rename from use-asset-prices if it is currently there)

The store needs to hold the real prices map and expose sliced selectors:

```typescript
// src/store/asset-price-store.ts
import { create } from 'zustand';

interface AssetPriceState {
  prices: Record<string, number>;   // { AAPL: 213.45, BTC: 68420.00, ... }
  previousPrices: Record<string, number>;  // for flash animations (green/red)
  lastUpdated: number | null;
  setPrices: (newPrices: Record<string, number>) => void;
  getPrice: (symbol: string) => number | null;
}

export const useAssetPriceStore = create<AssetPriceState>((set, get) => ({
  prices: {},
  previousPrices: {},
  lastUpdated: null,

  setPrices: (newPrices) =>
    set((state) => ({
      previousPrices: { ...state.prices },  // keep old prices for flash animation
      prices: newPrices,
      lastUpdated: Date.now(),
    })),

  getPrice: (symbol) => get().prices[symbol] ?? null,
}));

// SLICED SELECTORS — import and use these in components, not the full store
export const selectPrice = (symbol: string) =>
  (state: AssetPriceState) => state.prices[symbol] ?? null;

export const selectPrevPrice = (symbol: string) =>
  (state: AssetPriceState) => state.previousPrices[symbol] ?? null;

export const selectAllPrices = (state: AssetPriceState) => state.prices;
export const selectLastUpdated = (state: AssetPriceState) => state.lastUpdated;
```

**Usage in components (CORRECT pattern):**
```typescript
// ✅ CORRECT — only re-renders when AAPL price changes
const aaplPrice = useAssetPriceStore(selectPrice('AAPL'));

// ❌ WRONG (current code) — re-renders on EVERY price change
const { prices } = useAssetPriceStore();
```

---

### 1.11 Impact on the Database

The `AssetModel` in MongoDB currently stores `price` as the live price, updated by the frontend simulator. With real data, this field becomes a **snapshot cache**, updated by your server-side route, not the client.

**Remove entirely:** The `update-prices` API route (`/api/assets/update-prices/route.ts`) which lets the frontend update prices in MongoDB. This is a security risk and an architectural anti-pattern. The database should never trust price data sent from the client.

**New approach:** The MongoDB `Asset` collection stores metadata (name, sector, marketCap, type). Live prices come from the API cache layer. Portfolio valuations use live prices fetched at calculation time, not stored prices.

**Modify `src/app/api/users/[id]/portfolio/route.ts`:**
When calculating portfolio value, fetch current prices from your `/api/market/quotes` endpoint (server-to-server, using the cache) rather than reading the `price` field from the Asset collection.

---

## PART 2: Critical Bug Fixes (Fix Before Anything Else)

---

### Fix #1 🔴 — Vercel Deployment Failure: Root Layout

**File:** `src/app/layout.tsx`

**Problem:** The `'use client'` directive at the top of the root layout breaks Next.js App Router. The root layout MUST be a Server Component. This causes 404 errors on Vercel because metadata exports are ignored in Client Components.

**The Pattern To Follow:**

```
src/app/
├── layout.tsx          ← Server Component (no 'use client')
└── _components/
    └── providers.tsx   ← Client Component (has 'use client')
```

**Step 1 — Create `src/app/_components/providers.tsx`:**
```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { KeyboardShortcutsProvider } from '@/components/shared/keyboard-shortcuts-provider';
// ...any other client-only providers

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

**Step 2 — Fix `src/app/layout.tsx`:**
```typescript
// NO 'use client' here
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './_components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// This now works correctly because layout is a Server Component
export const metadata: Metadata = {
  title: 'Oloo — Paper Trading Simulator',
  description: 'Practice trading with real market data and zero risk.',
  openGraph: { ... },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Backend impact:** None. Frontend-only change.

---

### Fix #2 🔴 — Compromised Credentials

**Problem:** `.env.local` was committed to git. The MONGODB_URI and GEMINI_API_KEY are now permanently visible in the repository's git history, even if you delete the file today.

**Immediate steps — do these now, before any code changes:**

1. **Rotate MONGODB_URI:** Log into MongoDB Atlas → Network Access → rotate the connection string password. Takes 2 minutes.
2. **Rotate GEMINI_API_KEY:** Go to Google AI Studio → delete the old key → create a new one.
3. **Purge git history:**
   ```bash
   git filter-repo --path .env.local --invert-paths
   # This rewrites the entire git history. Force-push required after.
   git push origin --force --all
   ```
   Alternatively, if the repo is private and you trust your collaborators, you can simply rotate the keys and move on.
4. **Fix `.gitignore`:**
   ```
   # Add to .gitignore:
   .env
   .env.local
   .env.*.local
   .env.development.local
   .env.production.local
   ```
5. **Add all keys to Vercel:** Go to Project → Settings → Environment Variables. Add every key there. Never put them in the code again.

---

### Fix #3 🔴 — Email Service (Password Reset)

**File:** `src/lib/email.ts`

**Problem:** The password reset route calls an email function that only `console.log`s instead of actually sending emails. Users cannot recover accounts.

**Recommended service:** [Resend](https://resend.com) — free tier is 3,000 emails/month, has excellent TypeScript SDK, takes 5 minutes to set up.

**Step 1 — Install:**
```bash
npm install resend
```

**Step 2 — Add env var:**
```bash
RESEND_API_KEY=re_your_key_here
```

**Step 3 — Rewrite `src/lib/email.ts`:**
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
    from: 'Oloo <noreply@yourdomain.com>',  // must be a verified domain on Resend
    to: toEmail,
    subject: 'Reset your Oloo password',
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" 
           style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
}
```

**Step 4 — Update `src/app/api/auth/request-reset/route.ts`:**
```typescript
// Remove the TODO comment and console.log mock
// Replace with:
await sendPasswordResetEmail(user.email, resetToken, process.env.NEXTAUTH_URL!);
```

**Also add:** Token expiry to the reset token schema (tokens should expire after 1 hour):
```typescript
// In User schema, add:
passwordResetToken: { type: String, default: null },
passwordResetExpiry: { type: Date, default: null },

// When creating token:
const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
await UserModel.findByIdAndUpdate(user._id, {
  passwordResetToken: hashedToken,
  passwordResetExpiry: expiry,
});

// When verifying token:
const user = await UserModel.findOne({
  passwordResetToken: hashedToken,
  passwordResetExpiry: { $gt: new Date() },  // check not expired
});
```

---

### Fix #4 🟠 — Duplicate Database Update

**File:** `src/app/api/users/[id]/execute-trade/route.ts` line ~200

**Problem:** `totalReturnPercent` is set twice in the same MongoDB `$set` operation. The second assignment silently overwrites the first. MongoDB may throw an error in strict mode.

**Fix:** Find the execute-trade route and search for two occurrences of `totalReturnPercent` within the same `updateOne` or `findOneAndUpdate` call. Delete the first one and keep only the final calculated value.

---

### Fix #5 🟠 — MongoDB Connection Race Conditions

**File:** `src/lib/mongodb.ts`

**Problem:** The current connection caching pattern is not safe in concurrent serverless invocations.

**Replace with:**
```typescript
// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Use a global variable to cache the connection across hot reloads in dev
declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

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
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
```

---

## PART 3: Performance Overhaul

---

### Perf Fix #1 🟠 — Zustand Render Thrashing

**File:** `src/hooks/use-asset-prices.ts` and all components that use it

**Problem:** Components call `const { prices } = useAssetPriceStore()` which subscribes to the **entire store**. Every 15 seconds when prices update, every single component using this hook re-renders — even ones displaying completely different data.

**The Fix — use sliced selectors everywhere:**

```typescript
// src/components/market/price-cell.tsx — BEFORE (wrong)
const { prices } = useAssetPriceStore();
const price = prices[symbol];

// AFTER (correct) — only re-renders when this specific symbol's price changes
const price = useAssetPriceStore(selectPrice(symbol));
const prevPrice = useAssetPriceStore(selectPrevPrice(symbol));
const isUp = prevPrice ? price > prevPrice : null;
```

**Files that need this update:**
- Any component that renders a price value
- The portfolio value component
- The watchlist table rows
- The market overview table
- The trade page

**Extra: Add price flash animation with the prevPrice comparison:**
```typescript
// Green flash when price goes up, red flash when it goes down
const priceFlashClass = isUp === true ? 'animate-flash-green'
                      : isUp === false ? 'animate-flash-red'
                      : '';
```
Add to `globals.css`:
```css
@keyframes flash-green { 0% { background: #16a34a40; } 100% { background: transparent; } }
@keyframes flash-red   { 0% { background: #dc262640; } 100% { background: transparent; } }
.animate-flash-green { animation: flash-green 0.6s ease-out; }
.animate-flash-red   { animation: flash-red   0.6s ease-out; }
```

---

### Perf Fix #2 🟠 — Chart Rendering: Migrate to TradingView Lightweight Charts

**File:** `src/components/charts/stock-chart.tsx`

**Problem:** Recharts uses SVG. For a chart with 500 data points that updates in real-time, SVG must recalculate every path, polygon, and coordinate on every update. This causes visible lag and stutter.

**Solution:** [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) — Canvas-based, open source (Apache 2.0), built specifically for financial time-series data. Handles 10,000+ candles smoothly.

**Install:**
```bash
npm install lightweight-charts
```

**New chart component: `src/components/charts/trading-chart.tsx`:**
```typescript
'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';

interface Candle {
  time: number;   // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  data: Candle[];
  symbol: string;
  livePrice?: number;  // new real-time price tick
}

export function TradingChart({ data, symbol, livePrice }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<any>(null);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937', style: LineStyle.Dotted },
        horzLines: { color: '#1f2937', style: LineStyle.Dotted },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: { borderColor: '#374151', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    series.setData(data.map(d => ({
      ...d,
      time: Math.floor(d.time / 1000) as any,  // convert ms to seconds
    })));

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);  // only create once

  // Update last candle when live price arrives
  useEffect(() => {
    if (!seriesRef.current || !livePrice || data.length === 0) return;
    const lastCandle = data[data.length - 1];
    seriesRef.current.update({
      time: Math.floor(Date.now() / 1000) as any,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, livePrice),
      low: Math.min(lastCandle.low, livePrice),
      close: livePrice,
    });
  }, [livePrice]);  // only runs when live price changes — very efficient

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
```

---

### Perf Fix #3 🟠 — MongoDB Aggregation for Price History

**File:** `src/app/api/market/history/[symbol]/route.ts` (current: `src/app/api/price-history/route.ts`)

**Problem:** The API loads thousands of raw records from MongoDB into Node.js memory and then filters them with JavaScript array methods. This is slow, expensive, and will crash for long time ranges.

**Fix — use MongoDB `$bucket` aggregation:**

```typescript
// For the '1Y' range — this runs entirely on the MongoDB server
// It groups all price records into weekly buckets and returns ONE record per week
// Instead of fetching 365 records and filtering, you get 52 pre-averaged records

const pipeline = [
  {
    $match: {
      symbol: symbol,
      timestamp: { $gte: startTimestamp, $lte: Date.now() },
    },
  },
  {
    $bucketAuto: {
      groupBy: '$timestamp',
      buckets: targetDataPoints,  // e.g. 52 for 1Y, 30 for 1M, 24 for 1D
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

const history = await PriceHistoryModel.aggregate(pipeline);
```

**Data points by range:**
```typescript
const RANGE_CONFIG = {
  '1D': { startOffset: 24 * 60 * 60 * 1000,      buckets: 48  },   // 30-min candles
  '1W': { startOffset: 7 * 24 * 60 * 60 * 1000,  buckets: 42  },   // 4-hour candles
  '1M': { startOffset: 30 * 24 * 60 * 60 * 1000, buckets: 30  },   // daily candles
  '3M': { startOffset: 90 * 24 * 60 * 60 * 1000, buckets: 45  },   // 2-day candles
  '6M': { startOffset: 180 * 24 * 60 * 60 * 1000, buckets: 52 },   // weekly candles
  '1Y': { startOffset: 365 * 24 * 60 * 60 * 1000, buckets: 52 },   // weekly candles
};
```

---

### Perf Fix #4 🟠 — Memory Leak: Rolling Price Cache

**File:** `src/store/asset-price-store.ts`

**Problem:** The price history array in the browser grows without bound.

**Fix:** Cap the history at a maximum length and use a FIFO (first-in, first-out) approach:

```typescript
// Inside the store, if you keep a price history buffer for the live chart:
const MAX_HISTORY_POINTS = 500;  // keep at most 500 real-time ticks in memory

setPrices: (newPrices) =>
  set((state) => {
    // Update price history for each symbol with bounded array
    const updatedHistory = { ...state.priceHistory };
    for (const [symbol, price] of Object.entries(newPrices)) {
      const current = updatedHistory[symbol] ?? [];
      updatedHistory[symbol] = [
        ...current.slice(-(MAX_HISTORY_POINTS - 1)),  // keep last 499
        { price, time: Date.now() },                   // add new one
      ];
    }
    return {
      previousPrices: { ...state.prices },
      prices: newPrices,
      priceHistory: updatedHistory,
      lastUpdated: Date.now(),
    };
  }),
```

---

### Perf Fix #5 🟡 — Timer Cleanup

**File:** `src/hooks/use-asset-prices.ts` (old simulation hook)

This is no longer needed after migrating to SWR polling. SWR handles its own cleanup automatically. Delete the old `setInterval`-based simulation entirely. SWR's `refreshInterval` option replaces it cleanly.

---

## PART 4: Architecture & Reliability Fixes

---

### Arch Fix #1 🟠 — Input Validation with Zod

**Problem:** API routes process raw request bodies without validation, making them vulnerable to malformed requests that crash the server or corrupt the database.

**Install:**
```bash
npm install zod
```

**Create `src/lib/schemas/api-schemas.ts`:**
```typescript
import { z } from 'zod';

export const ExecuteTradeSchema = z.object({
  assetSymbol: z.string().min(1).max(10).regex(/^[A-Z]+$/),
  orderType: z.enum(['buy', 'sell']),
  quantity: z.number().positive().max(1_000_000),
  price: z.number().positive(),
});

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(50),
});

export const WatchlistUpdateSchema = z.object({
  symbol: z.string().min(1).max(10),
  action: z.enum(['add', 'remove']),
});

export const PriceHistoryQuerySchema = z.object({
  symbol: z.string().min(1).max(10),
  range: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y']).default('1M'),
});
```

**Usage in every API route:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = ExecuteTradeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { assetSymbol, orderType, quantity, price } = result.data;
  // ...proceed safely
}
```

---

### Arch Fix #2 🟠 — Error Boundaries

**Create `src/components/shared/error-boundary.tsx`:**
```typescript
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to your monitoring service here (Sentry, etc.)
    console.error(`[ErrorBoundary:${this.props.section}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-8 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">
            Something went wrong in this section. Please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Wrap every major page section:**
```typescript
// In dashboard layout:
<ErrorBoundary section="portfolio-panel">
  <PortfolioPanel />
</ErrorBoundary>

<ErrorBoundary section="market-overview">
  <MarketOverview />
</ErrorBoundary>

<ErrorBoundary section="ai-insights">
  <AIInsights />
</ErrorBoundary>
```

---

### Arch Fix #3 🟡 — Standardise User ID to ObjectId

**Problem:** Some routes use `email` to look up users, others use `_id`. This creates inconsistent behaviour.

**Rule going forward:** All `/api/users/[id]/` routes must use `_id` (MongoDB ObjectId). The session JWT stores both the `_id` and `email` — always pass `_id` to API calls.

**Audit checklist:**
- `src/app/api/users/[id]/route.ts` — verify it uses `_id`
- `src/app/api/users/[id]/portfolio/route.ts` — verify it uses `_id`
- `src/app/api/users/[id]/execute-trade/route.ts` — verify it uses `_id`
- `src/app/api/users/[id]/balance-history/route.ts` — verify it uses `_id`

**Create a helper:**
```typescript
// src/lib/get-user-by-id.ts
import { UserModel } from './models/schemas';
import mongoose from 'mongoose';

export async function getUserById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user ID format');
  }
  return await UserModel.findById(id);
}
```

---

### Arch Fix #4 🟡 — Structured Logging

**Problem:** 40+ `console.error` calls expose implementation details in production.

**Quick fix — create a logger utility:**
```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev) console.log(`[INFO] ${msg}`, data ?? '');
    // In production: send to Sentry, Datadog, etc.
  },
  error: (msg: string, error?: unknown) => {
    if (isDev) console.error(`[ERROR] ${msg}`, error ?? '');
    // In production: Sentry.captureException(error)
  },
  warn: (msg: string, data?: unknown) => {
    if (isDev) console.warn(`[WARN] ${msg}`, data ?? '');
  },
};
```

**Replace all `console.error(...)` with `logger.error(...)`** across the codebase. This is a mechanical find-and-replace that can be done all at once.

---

## PART 5: New Features to Build

These are features that every trading simulator needs but your current architecture does not have. Each one has a business justification and full implementation guidance.

---

### Feature #1 🟢 — Market Hours Indicator

**Why it matters:** Real stock markets only trade Monday–Friday, 9:30AM–4:00PM ET. Users need to know when the market is open or closed, and whether prices shown are from the last trading session. Without this, real prices can look "frozen" overnight and confuse users.

**What to build:**
- A small status badge on the dashboard: `● MARKET OPEN` (green) / `● MARKET CLOSED` (red)
- For crypto: Always show `● CRYPTO: 24/7` since crypto markets never close
- When market is closed, add a subtle notice to stock charts: "Showing last closing price"

**Create `src/lib/market-hours.ts`:**
```typescript
export function isNYSEOpen(): boolean {
  const now = new Date();
  // Convert to US Eastern Time
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();      // 0=Sun, 6=Sat
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  if (day === 0 || day === 6) return false;           // Weekend
  if (timeInMinutes < 9 * 60 + 30) return false;     // Before 9:30 AM
  if (timeInMinutes >= 16 * 60) return false;         // After 4:00 PM

  // TODO: Add US market holidays (MLK Day, Memorial Day, etc.)
  return true;
}

export function getMarketStatus(): {
  isOpen: boolean;
  nextEvent: string;
  sessionType: 'pre-market' | 'regular' | 'after-hours' | 'closed';
} {
  const nyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const timeInMinutes = nyTime.getHours() * 60 + nyTime.getMinutes();

  if (timeInMinutes >= 4 * 60 && timeInMinutes < 9 * 60 + 30)
    return { isOpen: false, nextEvent: 'Regular market opens 9:30 AM ET', sessionType: 'pre-market' };
  if (timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 16 * 60)
    return { isOpen: true, nextEvent: 'Market closes 4:00 PM ET', sessionType: 'regular' };
  if (timeInMinutes >= 16 * 60 && timeInMinutes < 20 * 60)
    return { isOpen: false, nextEvent: 'After-hours end 8:00 PM ET', sessionType: 'after-hours' };

  return { isOpen: false, nextEvent: 'Market opens 9:30 AM ET', sessionType: 'closed' };
}
```

**Add to dashboard header:** A `<MarketStatusBadge />` component that calls `getMarketStatus()` and renders the appropriate indicator.

---

### Feature #2 🟢 — Real-Time News Feed

**Why it matters:** Financial news directly moves stock prices. Without news, users have no idea why NVDA is up 5% today. This transforms the simulator from a price-watching tool into an actual learning platform.

**Data source:** Finnhub provides free company news. You already have the Finnhub API key from Part 1.

**Create `src/app/api/market/news/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const key = process.env.FINNHUB_API_KEY!;

  if (symbol) {
    // Company-specific news (last 7 days)
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${key}`
    );
    const news = await res.json();
    return NextResponse.json(news.slice(0, 10));   // top 10 articles
  }

  // General market news
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${key}`
  );
  const news = await res.json();
  return NextResponse.json(news.slice(0, 15));
}
```

**Create `src/components/news/news-feed.tsx`:**
- A scrollable list of news cards showing headline, source, time ago, and sentiment indicator (positive/negative)
- SWR polling every 5 minutes (`refreshInterval: 300_000`)
- Show on the dashboard sidebar and on individual asset trade pages

**Also useful:** Finnhub provides a `sentiment` score for news articles. You can use this to show a bullish/bearish indicator next to each headline.

---

### Feature #3 🟢 — Price Alerts System

**Why it matters:** Users set a target price and get notified when an asset hits it. This is a standard feature of every trading platform and drives re-engagement.

**Database changes — add to User schema:**
```typescript
// Add to User model in src/lib/models/schemas.ts
priceAlerts: [{
  symbol: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  direction: { type: String, enum: ['above', 'below'], required: true },
  // 'above' = alert when price goes ABOVE target
  // 'below' = alert when price goes BELOW target
  isTriggered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}],
```

**New API routes:**
```
POST   /api/users/[id]/alerts          — Create a new price alert
GET    /api/users/[id]/alerts          — List all alerts
DELETE /api/users/[id]/alerts/[alertId] — Delete an alert
```

**Alert checking logic — create `src/lib/alert-checker.ts`:**
```typescript
// This runs server-side when prices are fetched
// Check if any user's alerts have been triggered
export async function checkPriceAlerts(currentPrices: Record<string, number>) {
  const triggeredAlerts = await UserModel.aggregate([
    { $unwind: '$priceAlerts' },
    { $match: { 'priceAlerts.isTriggered': false } },
    // Find alerts where the condition is now met
  ]);

  for (const alert of triggeredAlerts) {
    const currentPrice = currentPrices[alert.priceAlerts.symbol];
    if (!currentPrice) continue;

    const isTriggered =
      (alert.priceAlerts.direction === 'above' && currentPrice >= alert.priceAlerts.targetPrice) ||
      (alert.priceAlerts.direction === 'below' && currentPrice <= alert.priceAlerts.targetPrice);

    if (isTriggered) {
      // Mark alert as triggered
      await UserModel.updateOne(
        { _id: alert._id, 'priceAlerts._id': alert.priceAlerts._id },
        { $set: { 'priceAlerts.$.isTriggered': true } }
      );
      // Send email notification
      await sendAlertEmail(alert.email, alert.priceAlerts.symbol, currentPrice);
    }
  }
}
```

**UI:** An alert bell icon on each asset card. Clicking it opens a dialog: "Alert me when [AAPL] goes above/below [$___]".

---

### Feature #4 🟢 — Portfolio Analytics Dashboard

**Why it matters:** A raw list of holdings with P&L is the bare minimum. Real trading platforms show risk-adjusted metrics. Adding these makes Oloo genuinely educational.

**New metrics to calculate and display:**

**All calculated in `src/lib/portfolio-analytics.ts`:**

```typescript
export interface PortfolioAnalytics {
  totalReturn: number;          // % return since account creation
  dailyReturn: number;          // % change today
  bestPosition: string;         // symbol with highest return %
  worstPosition: string;        // symbol with lowest return %
  winRate: number;              // % of closed trades that were profitable
  avgWin: number;               // average profit on winning trades (dollars)
  avgLoss: number;              // average loss on losing trades (dollars)
  profitFactor: number;         // totalWins / totalLosses — above 1.0 is profitable
  sharpeRatio: number;          // risk-adjusted return (simplified)
  maxDrawdown: number;          // largest peak-to-trough drop in portfolio value
  sectorAllocation: Record<string, number>;   // { Technology: 45%, Finance: 20%, ... }
  assetTypeAllocation: { stocks: number; crypto: number };  // diversification view
  benchmarkComparison: number;  // your return vs S&P500 return over same period
}
```

**How to calculate Win Rate and Profit Factor:**
```typescript
// Query all SELL trades for the user
const sellTrades = await TradeModel.find({ userId, orderType: 'sell' });

let wins = 0, losses = 0, totalWinAmount = 0, totalLossAmount = 0;

for (const trade of sellTrades) {
  // Find the original buy trades for this symbol to get cost basis
  const avgBuyPrice = ...; // from portfolio holdings
  const profit = (trade.price - avgBuyPrice) * trade.quantity;

  if (profit > 0) { wins++; totalWinAmount += profit; }
  else             { losses++; totalLossAmount += Math.abs(profit); }
}

const winRate = wins / (wins + losses);
const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : Infinity;
```

**UI:** Add a new "Analytics" tab on the portfolio page with:
- A radial chart showing win/loss ratio
- A line chart of portfolio value over time vs S&P 500
- A donut chart for sector allocation
- Stat cards for Sharpe Ratio, Max Drawdown, Profit Factor

---

### Feature #5 🟢 — Limit Orders and Stop-Loss

**Why it matters:** All real trading involves limit orders and stop-losses. Market orders (the only current type) are the least realistic order type. Adding limit orders teaches proper trading discipline and risk management.

**Database changes — update Trade schema:**
```typescript
// Add to TradeModel
orderType: { type: String, enum: ['buy', 'sell', 'limit-buy', 'limit-sell', 'stop-loss'] },
status: { type: String, enum: ['pending', 'filled', 'cancelled', 'expired'], default: 'filled' },
limitPrice: { type: Number, default: null },    // execution target price
expiresAt: { type: Date, default: null },        // GTC vs GTD orders
```

**New API route: `src/app/api/users/[id]/pending-orders/route.ts`**

**Order processing logic — create `src/lib/order-processor.ts`:**
```typescript
// Runs when prices update (every 15 seconds)
// Checks all pending limit orders against current prices
export async function processPendingOrders(currentPrices: Record<string, number>) {
  const pendingOrders = await TradeModel.find({ status: 'pending' });

  for (const order of pendingOrders) {
    const currentPrice = currentPrices[order.assetSymbol];
    if (!currentPrice) continue;

    // Check expiry
    if (order.expiresAt && new Date() > order.expiresAt) {
      await TradeModel.findByIdAndUpdate(order._id, { status: 'cancelled' });
      continue;
    }

    let shouldFill = false;

    if (order.orderType === 'limit-buy' && currentPrice <= order.limitPrice!) {
      shouldFill = true;   // Buy when price falls to or below limit
    }
    if (order.orderType === 'limit-sell' && currentPrice >= order.limitPrice!) {
      shouldFill = true;   // Sell when price rises to or above limit
    }
    if (order.orderType === 'stop-loss' && currentPrice <= order.limitPrice!) {
      shouldFill = true;   // Stop loss fires when price drops to trigger
    }

    if (shouldFill) {
      await fillOrder(order, currentPrice);  // executes the trade at current price
    }
  }
}
```

**UI:** On the trade page, add two tabs: "Market Order" (current) and "Limit Order". For limit orders, show a price input and an "expires" selector (1 day / 1 week / Good till cancelled).

---

### Feature #6 🟢 — Global Leaderboard

**Why it matters:** Competition is the single most powerful engagement driver in a trading simulator. Seeing that you rank #47 globally makes users come back every day to improve.

**Database changes — add to User schema:**
```typescript
isPublic: { type: Boolean, default: true },       // opt-out of leaderboard
displayName: { type: String, default: null },      // shown on leaderboard instead of email
leaderboardStats: {
  totalReturnPercent: { type: Number, default: 0 },
  rank: { type: Number, default: null },
  lastCalculated: { type: Date, default: null },
},
```

**New API route: `src/app/api/leaderboard/route.ts`:**
```typescript
export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1');
  const limit = 50;

  const leaders = await UserModel.find(
    { isPublic: true },
    { displayName: 1, portfolioValue: 1, 'leaderboardStats.totalReturnPercent': 1, badgeIds: 1 }
  )
  .sort({ portfolioValue: -1 })
  .skip((page - 1) * limit)
  .limit(limit);

  return NextResponse.json(leaders);
}
```

**Add a background job** (Vercel Cron, free): `src/app/api/cron/update-leaderboard/route.ts`
- Runs every hour
- Recalculates `totalReturnPercent` and `rank` for all users
- Costs essentially nothing in compute
- Set up in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/update-leaderboard", "schedule": "0 * * * *" }
  ]
}
```

**UI:** A `/leaderboard` page with a table of top 100 users, paginated, with columns for Rank, Display Name, Portfolio Value, Total Return %, and Badges earned.

---

### Feature #7 🟢 — Stock Screener

**Why it matters:** How do users discover what to trade? Right now there is no discovery mechanism. A screener lets users filter by criteria and find assets matching their strategy.

**Use Finnhub's free screener endpoint** plus your local Asset collection.

**Create `src/app/api/market/screener/route.ts`:**
```typescript
// Accepts query params: ?type=stock&sector=Technology&minPrice=10&maxPrice=500
// Returns matching assets from your Asset collection plus live prices
```

**Filters to support:**
- Asset type (stock / crypto)
- Sector (Technology, Healthcare, Finance, Energy, etc.)
- Price range (min, max)
- Daily change % (e.g., "show me stocks up >3% today")
- Market cap (large-cap, mid-cap, small-cap)

**UI:** A `/screener` page with filter chips and a sortable results table. "Add to Watchlist" button on each row.

---

### Feature #8 🟢 — Trade Journal

**Why it matters:** Serious traders keep a journal. Adding notes to trades teaches reflection and strategy. This is a differentiator from most trading simulators.

**Database changes — add to Trade schema:**
```typescript
notes: { type: String, default: null, maxLength: 1000 },
strategy: { type: String, enum: ['momentum', 'value', 'swing', 'scalp', 'news', 'other'], default: null },
tags: [{ type: String }],
sentiment: { type: String, enum: ['bullish', 'bearish', 'neutral'], default: null },
```

**New API route: `src/app/api/users/[id]/trades/[tradeId]/notes/route.ts`**
- `PATCH` — Update notes, strategy, tags on an existing trade

**UI:** On the trade history page, add an "Add Notes" button to each trade. A modal opens with a text area for notes, a strategy dropdown, and sentiment buttons. Optionally show all trades with the same strategy tag grouped together.

---

### Feature #9 🟢 — Asset Comparison Mode

**Why it matters:** Users frequently want to compare two assets — "Is AAPL or TSLA a better trade right now?" A comparison chart is a standard feature of professional platforms.

**Create `src/app/compare/page.tsx`:**
```
URL: /compare?a=AAPL&b=TSLA&range=3M
```

**Implementation:**
- Fetch historical data for both symbols from your history endpoint
- Normalise both to 100 at the start of the range (index to 100 approach)
- Plot both on the same TradingChart with two line series (green vs. blue)
- Show a stat comparison table below: Current Price, Change %, Volume, Market Cap, P/E (if stock)

**On each asset page/card**, add a "Compare with..." button that populates the compare URL.

---

### Feature #10 🟢 — Earnings Calendar Integration

**Why it matters:** Earnings announcements cause the biggest single-day price movements. Users should be able to see upcoming earnings for stocks they hold.

**Data source:** Finnhub provides free earnings calendar data.

**Create `src/app/api/market/earnings/route.ts`:**
```typescript
// GET /api/market/earnings?from=2026-06-01&to=2026-06-30
// Returns upcoming earnings for all symbols in the user's watchlist + portfolio
const res = await fetch(
  `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${key}`
);
```

**UI:** An "Earnings Calendar" widget on the dashboard showing a list of upcoming earnings dates for assets the user owns or watches. A warning badge on trade pages when an earnings event is within 5 days ("⚠️ Earnings in 3 days — high volatility expected").

---

### Feature #11 🟢 — Technical Indicators on Charts

**Why it matters:** Technical analysis is a core part of trading education. Moving averages, RSI, and MACD are the three most commonly used indicators.

**Install:**
```bash
npm install technicalindicators
```

**Create `src/lib/indicators.ts`:**
```typescript
import { SMA, EMA, RSI, MACD } from 'technicalindicators';

export function calculateSMA(prices: number[], period: number): (number | null)[] {
  const result = SMA.calculate({ period, values: prices });
  // Pad the front with nulls so it aligns with the original data
  return [...Array(prices.length - result.length).fill(null), ...result];
}

export function calculateRSI(prices: number[], period = 14): (number | null)[] {
  const result = RSI.calculate({ period, values: prices });
  return [...Array(prices.length - result.length).fill(null), ...result];
}

export function calculateMACD(prices: number[]) {
  return MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
}
```

**UI additions to `TradingChart`:**
- An "Indicators" button above the chart opening a dropdown
- Checkboxes for: SMA(20), SMA(50), EMA(20), RSI, MACD
- When selected, overlay the indicator on the chart as an additional line series
- RSI and MACD should render in a separate panel below the main chart (TradingView Lightweight Charts supports this natively)

---

### Feature #12 🟢 — Watchlist Grouping

**Why it matters:** Power users have 20+ assets on their watchlist. Flat lists become unmanageable. Allow users to create named groups.

**Database changes:**
```typescript
// Replace the current simple watchlist: [String] array
// with:
watchlistGroups: [{
  name: { type: String, required: true },
  symbols: [{ type: String }],
  color: { type: String, default: '#6366f1' },  // for visual identification
}],
```

**UI:** On the watchlist panel, allow drag-and-drop reordering and adding/removing group tabs. Default groups: "Favourites", "Crypto", "Tech Stocks".

---

## PART 6: Complete Backend Changes Map

A complete inventory of every file that needs to be modified or created.

---

### Files to DELETE
```
src/hooks/use-asset-prices.ts        — Replace with SWR-based hook (see Part 1.9)
src/app/api/assets/update-prices/    — Security risk: clients should not push prices to DB
```

### Files to CREATE (New)
```
src/lib/price-cache.ts               — Server-side TTL cache (Part 1.5)
src/lib/market-hours.ts              — NYSE open/close logic (Feature #1)
src/lib/alert-checker.ts             — Price alert processing (Feature #3)
src/lib/order-processor.ts           — Limit order filling (Feature #5)
src/lib/portfolio-analytics.ts       — Analytics calculations (Feature #4)
src/lib/indicators.ts                — Technical indicators (Feature #11)
src/lib/logger.ts                    — Structured logging (Arch Fix #4)

src/lib/schemas/api-schemas.ts       — Zod validation schemas (Arch Fix #1)

src/app/api/market/quotes/route.ts          — Batch real-time prices (Part 1.6)
src/app/api/market/quote/[symbol]/route.ts  — Single asset quote (Part 1.7)
src/app/api/market/history/[symbol]/route.ts — Historical OHLCV (Part 1.8)
src/app/api/market/news/route.ts            — News feed (Feature #2)
src/app/api/market/screener/route.ts        — Stock screener (Feature #7)
src/app/api/market/earnings/route.ts        — Earnings calendar (Feature #10)

src/app/api/users/[id]/alerts/route.ts          — CRUD for price alerts (Feature #3)
src/app/api/users/[id]/alerts/[alertId]/route.ts — Delete alert
src/app/api/users/[id]/pending-orders/route.ts   — Limit orders list (Feature #5)
src/app/api/users/[id]/trades/[tradeId]/notes/route.ts — Trade journal (Feature #8)

src/app/api/leaderboard/route.ts             — Global leaderboard (Feature #6)
src/app/api/cron/update-leaderboard/route.ts — Hourly leaderboard refresh
src/app/api/cron/check-alerts/route.ts       — Alerts checker cron

src/app/_components/providers.tsx           — Client-side provider wrapper (Fix #1)
src/app/leaderboard/page.tsx                — Leaderboard page (Feature #6)
src/app/screener/page.tsx                   — Screener page (Feature #7)
src/app/compare/page.tsx                    — Compare mode (Feature #9)

src/components/charts/trading-chart.tsx         — TradingView chart (Perf Fix #2)
src/components/news/news-feed.tsx               — News feed UI (Feature #2)
src/components/market/market-status-badge.tsx   — Market open/close (Feature #1)
src/components/portfolio/analytics-panel.tsx    — Analytics UI (Feature #4)
src/components/shared/error-boundary.tsx        — Error boundary (Arch Fix #2)
src/store/asset-price-store.ts                  — Rebuilt Zustand store (Part 1.10)
```

### Files to MODIFY (Existing)
```
src/app/layout.tsx                   — Remove 'use client', add metadata (Fix #1)
src/lib/mongodb.ts                   — Fix race conditions (Fix #5)
src/lib/email.ts                     — Implement Resend (Fix #3)
src/lib/badge-service.ts             — Add logger, add Zod validation
src/lib/models/schemas.ts            — Add new fields to User, Trade, Asset models:
                                         User: priceAlerts, watchlistGroups, isPublic,
                                               displayName, leaderboardStats
                                         Trade: notes, strategy, status, limitPrice,
                                                expiresAt, tags, sentiment
                                         Asset: sector, logo (already partially there)

src/app/api/auth/signup/route.ts     — Add Zod schema validation
src/app/api/auth/request-reset/route.ts — Connect real email service
src/app/api/auth/reset-password/route.ts — Add token expiry check

src/app/api/users/[id]/execute-trade/route.ts — Fix duplicate field,
                                                  add Zod validation,
                                                  use real price from API not client,
                                                  add logger

src/app/api/users/[id]/portfolio/route.ts    — Use live prices for valuation
src/app/api/assets/route.ts                  — Remove price field from response
src/app/api/assets/[symbol]/quote/route.ts   — Redirect to new /api/market/quote route

src/app/trade/[symbol]/page.tsx      — Use new quote API, add limit order UI
src/components/charts/stock-chart.tsx — Replace with TradingChart (Perf Fix #2)
src/components/watchlist/watchlist-table.tsx — Use sliced Zustand selectors
src/components/portfolio/holdings-table.tsx  — Use sliced Zustand selectors
src/components/dashboard/market-overview.tsx — Use sliced Zustand selectors

vercel.json                          — Add cron configuration
.gitignore                           — Ensure .env.local is ignored
```

### Database Schema Changes Summary
```typescript
// User model additions:
priceAlerts:       [{ symbol, targetPrice, direction, isTriggered, createdAt }]
watchlistGroups:   [{ name, symbols, color }]
isPublic:          Boolean
displayName:       String
leaderboardStats:  { totalReturnPercent, rank, lastCalculated }
passwordResetToken: String
passwordResetExpiry: Date

// Trade model additions:
status:     enum ['pending', 'filled', 'cancelled', 'expired']
limitPrice: Number
expiresAt:  Date
notes:      String
strategy:   enum ['momentum', 'value', 'swing', 'scalp', 'news', 'other']
tags:       [String]
sentiment:  enum ['bullish', 'bearish', 'neutral']

// Asset model additions:
sector:     String
logo:       String  (URL from Finnhub profile)
exchange:   String
```

---

## PART 7: Phased Implementation Roadmap

Do not try to implement everything at once. Follow this sequence. Each phase builds on the previous one.

---

### Phase 1: Critical Fixes — Week 1
**Goal:** App is deployable and secure. These must be done before any user faces the platform.

| Task | Effort | Priority |
|---|---|---|
| Rotate exposed credentials (MongoDB, Gemini) | 10 min | 🔴 Do now |
| Fix `.gitignore` to exclude `.env.local` | 5 min | 🔴 Do now |
| Fix root layout (remove `use client`, add providers wrapper) | 1 hr | 🔴 Critical |
| Fix MongoDB connection race conditions | 30 min | 🔴 Critical |
| Fix duplicate `totalReturnPercent` in execute-trade | 10 min | 🔴 Critical |
| Implement Resend email for password reset | 2 hr | 🔴 Critical |
| Add Vercel environment variables for all API keys | 20 min | 🔴 Critical |

**Deliverable:** App successfully deploys to Vercel with no 404 errors. Credentials are rotated and safe.

---

### Phase 2: Real Market Data — Week 2
**Goal:** Replace all simulated prices with real data from Finnhub and CoinGecko.

| Task | Effort | Priority |
|---|---|---|
| Create Finnhub account, get free API key | 5 min | 🔴 Critical |
| Build `src/lib/price-cache.ts` | 1 hr | 🔴 Critical |
| Build `/api/market/quotes/route.ts` (batch quotes) | 3 hr | 🔴 Critical |
| Build `/api/market/quote/[symbol]/route.ts` (single quote) | 2 hr | 🔴 Critical |
| Rebuild `src/store/asset-price-store.ts` with sliced selectors | 2 hr | 🔴 Critical |
| Rebuild `src/hooks/use-asset-prices.ts` (SWR-based, real data) | 2 hr | 🔴 Critical |
| Remove `update-prices` API route | 30 min | 🔴 Critical |
| Update portfolio valuation to use live prices | 2 hr | 🟠 High |
| Update all components to use sliced Zustand selectors | 3 hr | 🟠 High |
| Add market hours indicator to dashboard | 2 hr | 🟢 Enhancement |

**Deliverable:** All prices on the platform are real market data. Portfolio values are accurate. No more random-walk simulation.

---

### Phase 3: Performance & Reliability — Week 3
**Goal:** App is fast, crash-resistant, and validates all inputs.

| Task | Effort | Priority |
|---|---|---|
| Migrate charts to TradingView Lightweight Charts | 4 hr | 🟠 High |
| Implement MongoDB `$bucket` aggregation for history | 3 hr | 🟠 High |
| Add rolling cache cap to price history store | 1 hr | 🟠 High |
| Implement React Error Boundaries on all major sections | 2 hr | 🟠 High |
| Add Zod validation to all API routes | 4 hr | 🟡 Medium |
| Replace `console.error` with structured logger | 2 hr | 🟡 Medium |
| Standardise user ID to ObjectId across all routes | 2 hr | 🟡 Medium |
| Add price flash animation (green/red) | 1 hr | 🟢 Enhancement |

**Deliverable:** Charts render at 60FPS. No full-page crashes. All API inputs are validated.

---

### Phase 4: Core New Features — Weeks 4–5
**Goal:** Add the features that transform this from a basic simulator into a real trading education platform.

| Task | Effort |
|---|---|
| Real-time news feed (Finnhub integration) | 3 hr |
| Price alerts system (UI + API + cron checker) | 5 hr |
| Portfolio analytics dashboard (win rate, Sharpe, drawdown) | 6 hr |
| Limit orders and stop-loss (UI + order processor) | 8 hr |
| Global leaderboard (UI + cron updater) | 4 hr |
| Earnings calendar widget | 3 hr |

**Deliverable:** Platform has meaningful engagement features beyond basic buy/sell.

---

### Phase 5: Advanced Features — Weeks 6–8
**Goal:** Advanced tools that retain power users and differentiate Oloo from generic simulators.

| Task | Effort |
|---|---|
| Technical indicators on charts (SMA, EMA, RSI, MACD) | 6 hr |
| Stock screener page | 5 hr |
| Trade journal with notes and strategy tagging | 4 hr |
| Asset comparison mode | 4 hr |
| Watchlist grouping | 3 hr |
| Complete i18n translations (or remove placeholder languages) | 3 hr |
| Write automated tests for trade execution + badge logic | 6 hr |

**Deliverable:** Full-featured trading simulator competitive with established paper trading apps.

---

## Quick Reference: Most Important Things To Do Right Now

If you read nothing else, do these five things today:

1. **Rotate your MongoDB URI and Gemini API key.** They are compromised.
2. **Register at finnhub.io** and get your free API key. Takes 2 minutes.
3. **Fix `src/app/layout.tsx`** — remove `'use client'`, extract providers to a wrapper component. This is why your Vercel deploys fail.
4. **Build the `/api/market/quotes` route** with Finnhub + CoinGecko. This is the single biggest upgrade you can make to the platform.
5. **Delete the random-walk simulation code** in `use-asset-prices.ts` and replace with SWR polling from your new quotes endpoint.

Everything else in this document improves the platform. Those five things make it real.

---

*Document prepared June 2026. All API pricing and feature availability reflects free tiers as of this date.*
