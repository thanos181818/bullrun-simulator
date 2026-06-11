import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { fetchAllStockPrices, fetchAllCryptoPrices } from '@/lib/market-fetchers';

const REFRESH_LOCK_KEY = 'prices:refreshLock';
const REFRESH_LOCK_TTL = 12; // 12 seconds lock to prevent multiple refreshes at once

export async function GET(req: NextRequest) {
  // Always try to get from cache first
  const [cachedStocks, cachedCrypto] = await Promise.all([
    redis.get<Record<string, number>>(CACHE_KEYS.stockPrices),
    redis.get<Record<string, number>>(CACHE_KEYS.cryptoPrices),
  ]);

  // If we have cache, serve it immediately.
  // Only trigger a background refresh if no other request is already doing one
  // (lock TTL = 30s → at most 1 background refresh per 30s regardless of user count).
  if (cachedStocks && cachedCrypto) {
    // Try to acquire the refresh lock atomically (SET NX EX)
    const lockAcquired = await redis.set(
      CACHE_KEYS.refreshLock,
      '1',
      { nx: true, ex: 30 } // nx = only set if key doesn't exist
    );

    if (lockAcquired) {
      // Only this request won the lock — do the background refresh
      (async () => {
        try {
          const [stockPrices, cryptoPrices] = await Promise.all([
            fetchAllStockPrices(),
            fetchAllCryptoPrices(),
          ]);
          await Promise.all([
            redis.set(CACHE_KEYS.stockPrices, stockPrices, { ex: CACHE_TTL.livePrices }),
            redis.set(CACHE_KEYS.cryptoPrices, cryptoPrices, { ex: CACHE_TTL.livePrices }),
          ]);
        } catch (error) {
          // Release lock early on failure so next request can retry sooner
          await redis.del(CACHE_KEYS.refreshLock);
          console.error('Background cache refresh failed:', error);
        }
      })();
    }

    return NextResponse.json({
      prices: { ...cachedStocks, ...cachedCrypto },
      timestamp: Date.now(),
      source: 'cache',
    });
  }

  // No cache at all — fetch fresh data and wait for it
  console.log('No cache found, fetching fresh market data...');
  const [stockPrices, cryptoPrices] = await Promise.all([
    fetchAllStockPrices(),
    fetchAllCryptoPrices(),
  ]);

  // Update cache with fresh data
  await Promise.all([
    redis.set(CACHE_KEYS.stockPrices, stockPrices, { ex: CACHE_TTL.livePrices }),
    redis.set(CACHE_KEYS.cryptoPrices, cryptoPrices, { ex: CACHE_TTL.livePrices }),
  ]);

  return NextResponse.json({
    prices: { ...stockPrices, ...cryptoPrices },
    timestamp: Date.now(),
    source: 'fresh',
  });
}
