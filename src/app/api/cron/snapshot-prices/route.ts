import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel, PortfolioModel, PortfolioSnapshotModel } from '@/lib/models/schemas';
import { redis, CACHE_KEYS } from '@/lib/redis';

export async function GET(req: NextRequest) {
  // Temporary: Disabled for local testing
  /*
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */

  try {
    await connectToDatabase();

    // Fetch current prices from Redis cache
    let prices: Record<string, number> =
      (await redis.get<Record<string, number>>(CACHE_KEYS.stockPrices)) ?? {};
    const cryptoPrices =
      (await redis.get<Record<string, number>>(CACHE_KEYS.cryptoPrices)) ?? {};
    prices = { ...prices, ...cryptoPrices };

    if (Object.keys(prices).length === 0) {
        return NextResponse.json({ success: false, message: 'No prices in cache' });
    }

    // Get all users who have been active recently (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await UserModel.find(
      { updatedAt: { $gte: thirtyDaysAgo } },
      { _id: 1, cashBalance: 1 }
    );

    const snapshots = [];

    for (const user of activeUsers) {
      // Get user's current holdings
      const portfolio = await PortfolioModel.findOne({ userId: user._id.toString() });
      if (!portfolio) continue;

      let holdingsValue = 0;
      for (const holding of portfolio.holdings) {
        const currentPrice = prices[holding.assetSymbol];
        if (currentPrice) {
          holdingsValue += holding.quantity * currentPrice;
        }
      }

      snapshots.push({
        userId: user._id.toString(),
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
  } catch (error: any) {
    console.error('Portfolio snapshot failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
