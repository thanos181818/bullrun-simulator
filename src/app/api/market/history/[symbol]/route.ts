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

const FINNHUB_RESOLUTION: Record<'1D' | '1W', string> = {
  '1D': '5',
  '1W': '60',
};

const RANGE_DAYS: Record<Range, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365,
};

const RANGE_TTL: Record<Range, number> = {
  '1D': CACHE_TTL.history1D,
  '1W': CACHE_TTL.history1W,
  '1M': CACHE_TTL.history1M,
  '3M': CACHE_TTL.historyLong,
  '6M': CACHE_TTL.historyLong,
  '1Y': CACHE_TTL.historyLong,
};

interface Candle {
  time: number;
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

  if (data.s !== 'ok' || !data.t) return [];

  return data.t.map((timestamp: number, i: number) => ({
    time: timestamp * 1000,
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

  try {
    const result: any = await yahooFinance.chart(symbol, {
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
  } catch (error) {
    console.error(`Yahoo fetch failed for ${symbol}:`, error);
    return [];
  }
}

async function fetchCoinGeckoHistory(symbol: string, range: Range): Promise<Candle[]> {
  const geckoId = COINGECKO_IDS[symbol];
  if (!geckoId) return [];
  
  const days = RANGE_DAYS[range];
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.prices ?? []).map(([time, price]: [number, number]) => ({
    time,
    open: price,
    high: price,
    low: price,
    close: price,
  }));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const range = (req.nextUrl.searchParams.get('range') ?? '1M') as Range;
  const cacheKey = CACHE_KEYS.historyPrefix(symbol, range);

  const cached = await redis.get<Candle[]>(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true });

  let candles: Candle[];

  if (CRYPTO_SYMBOLS.has(symbol)) {
    candles = await fetchCoinGeckoHistory(symbol, range);
  } else if (range === '1D' || range === '1W') {
    candles = await fetchFinnhubCandles(symbol, range);
  } else {
    candles = await fetchYahooHistory(symbol, range);
  }

  await redis.set(cacheKey, candles, { ex: RANGE_TTL[range] });
  return NextResponse.json({ data: candles, cached: false });
}
