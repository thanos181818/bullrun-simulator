import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectToDatabase from '../lib/mongodb';
import { PriceHistoryModel } from '../lib/models/schemas';
import { mockAssets } from '../lib/data';

async function nuke() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Delete ALL of March
    const march1 = new Date('2026-03-01T00:00:00Z').getTime();
    const april1 = new Date('2026-04-01T00:00:00Z').getTime();

    const result = await PriceHistoryModel.deleteMany({
      timestamp: { $gte: march1, $lt: april1 }
    });

    console.log(`🗑️  Deleted ${result.deletedCount} records from all of March`);

    // Verify
    const remaining = await PriceHistoryModel.countDocuments({
      timestamp: { $gte: march1, $lt: april1 }
    });

    console.log(`✅ Remaining: ${remaining} records (should be 0)`);

    // Now insert ONLY 25 clean hourly records for March 20
    console.log('\n📊 Inserting clean March 20 hourly data...');

    const march20Start = new Date('2026-03-20T00:00:00Z').getTime();
    const cleanData = [
      { symbol: 'AAPL', timestamp: march20Start + 0*3600000, price: 249.73 },
      { symbol: 'AAPL', timestamp: march20Start + 1*3600000, price: 250.61 },
      { symbol: 'AAPL', timestamp: march20Start + 2*3600000, price: 251.87 },
      { symbol: 'AAPL', timestamp: march20Start + 3*3600000, price: 253.12 },
      { symbol: 'AAPL', timestamp: march20Start + 4*3600000, price: 253.77 },
      { symbol: 'AAPL', timestamp: march20Start + 5*3600000, price: 252.54 },
      { symbol: 'AAPL', timestamp: march20Start + 6*3600000, price: 251.24 },
      { symbol: 'AAPL', timestamp: march20Start + 7*3600000, price: 249.82 },
      { symbol: 'AAPL', timestamp: march20Start + 8*3600000, price: 248.57 },
      { symbol: 'AAPL', timestamp: march20Start + 9*3600000, price: 247.48 },
      { symbol: 'AAPL', timestamp: march20Start + 10*3600000, price: 245.90 },
      { symbol: 'AAPL', timestamp: march20Start + 11*3600000, price: 246.77 },
      { symbol: 'AAPL', timestamp: march20Start + 12*3600000, price: 248.41 },
      { symbol: 'AAPL', timestamp: march20Start + 13*3600000, price: 249.12 },
      { symbol: 'AAPL', timestamp: march20Start + 14*3600000, price: 250.96 },
      { symbol: 'AAPL', timestamp: march20Start + 15*3600000, price: 251.89 },
      { symbol: 'AAPL', timestamp: march20Start + 16*3600000, price: 253.16 },
      { symbol: 'AAPL', timestamp: march20Start + 17*3600000, price: 251.57 },
      { symbol: 'AAPL', timestamp: march20Start + 18*3600000, price: 250.21 },
      { symbol: 'AAPL', timestamp: march20Start + 19*3600000, price: 248.78 },
      { symbol: 'AAPL', timestamp: march20Start + 20*3600000, price: 247.10 },
      { symbol: 'AAPL', timestamp: march20Start + 21*3600000, price: 248.08 },
      { symbol: 'AAPL', timestamp: march20Start + 22*3600000, price: 249.57 },
      { symbol: 'AAPL', timestamp: march20Start + 23*3600000, price: 250.51 },
      { symbol: 'AAPL', timestamp: march20Start + 24*3600000, price: 251.67 },
    ];

    await PriceHistoryModel.insertMany(cleanData);
    console.log(`✅ Inserted ${cleanData.length} clean hourly records`);

    // Verify
    const count = await PriceHistoryModel.countDocuments({
      symbol: 'AAPL',
      timestamp: { $gte: march20Start, $lt: march20Start + 25*3600000 }
    });

    console.log(`✅ Verified: ${count} AAPL records for March 20 (should be 25)`);

    // Check for any prices below 200
    const lowCount = await PriceHistoryModel.countDocuments({
      symbol: 'AAPL',
      timestamp: { $gte: march20Start, $lt: april1 },
      price: { $lt: 200 }
    });

    console.log(`✅ Low prices (<$200) in March: ${lowCount} (should be 0)`);

    if (lowCount === 0 && count === 25) {
      console.log('\n✨ PERFECT! Clean data ready!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

nuke();
