import { Redis } from '@upstash/redis';

// Singleton Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache key constants
export const CACHE_KEYS = {
  stockPrices: 'prices:stocks',
  cryptoPrices: 'prices:crypto',
  quotePrefix: (symbol: string) => `quote:${symbol}`,
  historyPrefix: (symbol: string, range: string) => `history:${symbol}:${range}`,
  newsPrefix: (symbol: string) => `news:${symbol}`,
  marketStatus: 'market:status',
  coingeckoMapping: 'mapping:coingecko',
} as const;

// TTL constants in seconds
export const CACHE_TTL = {
  livePrices: 90,       // 90s (refreshed every 60s by cron)
  singleQuote: 30,      // 30s
  history1D: 300,       // 5m
  history1W: 900,       // 15m
  history1M: 3600,      // 1h
  historyLong: 14400,   // 4h
  news: 300,            // 5m
  marketStatus: 60,     // 1m
  coingeckoMapping: 86400, // 24h
} as const;
