import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectToDatabase from '../lib/mongodb';
import { AssetModel, PriceHistoryModel } from '../lib/models/schemas';
import { mockAssets } from '../lib/data';

async function updateAssetPrices() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB\n');

    const march20Start = new Date('2026-03-20T00:00:00Z').getTime();
    const march21Start = new Date('2026-03-21T00:00:00Z').getTime();

    const assetsToUpdate = mockAssets.map(m => m.symbol);

    for (const symbol of assetsToUpdate) {
      // Get the latest price from March 20-21
      const latest = await PriceHistoryModel.findOne(
        {
          symbol,
          timestamp: { $gte: march20Start, $lt: march21Start }
        }
      ).sort({ timestamp: -1 });

      if (latest) {
        const latestPrice = latest.price;
        const initialPrice = (mockAssets.find(a => a.symbol === symbol) as any)?.initialPrice || latestPrice;
        const change = latestPrice - initialPrice;
        const changePercent = initialPrice > 0 ? (change / initialPrice) * 100 : 0;

        await AssetModel.updateOne(
          { symbol },
          {
            $set: {
              price: latestPrice,
              change,
              changePercent
            }
          }
        );

        console.log(`✅ ${symbol}: $${latestPrice.toFixed(2)} (change: ${change.toFixed(2)}, ${changePercent.toFixed(1)}%)`);
      } else {
        console.log(`⚠️  ${symbol}: No price found for March 20`);
      }
    }

    console.log('\n✨ All assets updated with latest prices!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

updateAssetPrices();
