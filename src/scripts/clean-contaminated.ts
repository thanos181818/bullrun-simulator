import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectToDatabase from '../lib/mongodb';
import { PriceHistoryModel } from '../lib/models/schemas';

async function clean() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB\n');

    // For each asset, delete any records on March 20 that are NOT at the top of the hour
    // (i.e., delete all the contaminated simulated minute-level records)
    
    const march20Start = new Date('2026-03-20T00:00:00Z').getTime();
    const march22Start = new Date('2026-03-22T00:00:00Z').getTime();

    // Find all records where minute/second is NOT :00:00
    // MongoDB doesn't have easy date parts, so we'll fetch and filter in code
    const allMarch20 = await PriceHistoryModel.find({
      timestamp: { $gte: march20Start, $lt: march22Start }
    }).sort({ timestamp: 1 });

    console.log(`Found ${allMarch20.length} records on March 20-21`);

    // Mark for deletion: any record that's not on a clean hour boundary
    const toDelete = [];
    allMarch20.forEach((doc: any) => {
      const ts = doc.timestamp;
      const d = new Date(ts);
      const minutes = d.getUTCMinutes();
      const seconds = d.getUTCSeconds();
      
      // Delete if not at :00:00
      if (minutes !== 0 || seconds !== 0) {
        toDelete.push(doc._id);
      }
    });

    if (toDelete.length > 0) {
      const result = await PriceHistoryModel.deleteMany({
        _id: { $in: toDelete }
      });
      console.log(`✅ Deleted ${result.deletedCount} contaminated non-hourly records\n`);
    } else {
      console.log('✅ No contaminated records found (all are clean hourly records)\n');
    }

    // Verify - show what remains
    const remaining = await PriceHistoryModel.find({
      timestamp: { $gte: march20Start, $lt: march22Start }
    }).sort({ timestamp: 1 }).select('symbol timestamp price -_id');

    console.log(`Remaining records (should be exactly 25 hourly per asset):`);
    const bySymbol: Record<string, any[]> = {};
    remaining.forEach((doc: any) => {
      if (!bySymbol[doc.symbol]) bySymbol[doc.symbol] = [];
      bySymbol[doc.symbol].push(doc);
    });

    Object.entries(bySymbol).forEach(([symbol, records]) => {
      const priceRange = records.map(r => r.price).sort((a, b) => a - b);
      console.log(`  ${symbol}: ${records.length} records [${priceRange[0].toFixed(2)}-${priceRange[priceRange.length-1].toFixed(2)}]`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

clean();
