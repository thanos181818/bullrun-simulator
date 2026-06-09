import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { fetchAllStockPrices, fetchAllCryptoPrices } from '@/lib/market-fetchers';

export async function GET(req: NextRequest) {
  const [cachedStocks, cachedCrypto] = await Promise.all([
    redis.get<Record<string, number>>(CACHE_KEYS.stockPrices),
    redis.get<Record<string, number>>(CACHE_KEYS.cryptoPrices),
  ]);

  // Happy path — cache warmer has done its job, respond immediately
  if (cachedStocks && cachedCrypto) {
    return NextResponse.json({
      prices: { ...cachedStocks, ...cachedCrypto },
      timestamp: Date.now(),
      source: 'cache',
    });
  }

  // Cold-start fallback — only on first deployment or if cron fails
  console.warn('Cache miss on /api/market/quotes — cold-start fallback triggered');

  const [stockPrices, cryptoPrices] = await Promise.all([
    cachedStocks ?? fetchAllStockPrices(),
    cachedCrypto ?? fetchAllCryptoPrices(),
  ]);

  if (!cachedStocks) {
    await redis.set(CACHE_KEYS.stockPrices, stockPrices, { ex: CACHE_TTL.livePrices });
  }
  if (!cachedCrypto) {
    await redis.set(CACHE_KEYS.cryptoPrices, cryptoPrices, { ex: CACHE_TTL.livePrices });
  }

  return NextResponse.json({
    prices: { ...stockPrices, ...cryptoPrices },
    timestamp: Date.now(),
    source: 'fallback',
  });
}
