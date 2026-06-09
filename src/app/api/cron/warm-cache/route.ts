import { NextRequest, NextResponse } from 'next/server';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { fetchAllStockPrices, fetchAllCryptoPrices } from '@/lib/market-fetchers';

export async function GET(req: NextRequest) {
  // Temporary: Disabled for local testing
  /*
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */

  try {
    const [stockPrices, cryptoPrices] = await Promise.all([
      fetchAllStockPrices(),
      fetchAllCryptoPrices(),
    ]);

    await Promise.all([
      redis.set(CACHE_KEYS.stockPrices, stockPrices, { ex: CACHE_TTL.livePrices }),
      redis.set(CACHE_KEYS.cryptoPrices, cryptoPrices, { ex: CACHE_TTL.livePrices }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      stocksCount: Object.keys(stockPrices).length,
      cryptoCount: Object.keys(cryptoPrices).length,
    });
  } catch (error: any) {
    console.error('Cache warmer failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
