import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

async function verify() {
  try {
    await client.connect();
    const db = client.db('oloo');
    const collection = db.collection('pricehistories');

    // Check AAPL for ANY data from March 20-21
    const march20Start = new Date('2026-03-20T00:00:00Z');
    const march22Start = new Date('2026-03-22T00:00:00Z');

    const aaplData = await collection
      .find({
        symbol: 'AAPL',
        timestamp: { $gte: march20Start.getTime(), $lt: march22Start.getTime() }
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`\n🔍 AAPL on March 20-21:\n`);
    console.log(`Total Records: ${aaplData.length}`);
    
    if (aaplData.length > 0) {
      console.log('\nAll records:');
      aaplData.forEach((doc: any) => {
        const ts = new Date(doc.timestamp);
        console.log(`  ${ts.toISOString()} - $${doc.price.toFixed(2)}`);
      });
    } else {
      console.log('✅ None found');
    }

    // Check for any 161-162 prices
    const lowPrices = await collection
      .find({
        symbol: 'AAPL',
        price: { $gte: 160, $lte: 163 }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    console.log(`\n⚠️  AAPL prices between $160-163 (most recent first):\n`);
    if (lowPrices.length === 0) {
      console.log('✅ NONE FOUND - Database is clean!');
    } else {
      lowPrices.forEach((doc: any) => {
        console.log(`  $${doc.price.toFixed(2)} at ${doc.timestamp.toISOString()}`);
      });
    }

    // All AAPL data summary
    const allAAPL = await collection
      .countDocuments({ symbol: 'AAPL' });
    
    console.log(`\n📊 AAPL Total in DB: ${allAAPL} records`);

    // Check price range for March 20
    const minMaxDoc = await collection
      .aggregate([
        { $match: { symbol: 'AAPL', timestamp: { $gte: march20Start, $lt: march21Start } } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ])
      .toArray();
    
    if (minMaxDoc.length > 0) {
      const doc = minMaxDoc[0] as any;
      console.log(`\n📈 March 20 Price Range: $${doc.min.toFixed(2)} - $${doc.max.toFixed(2)}`);
    }

  } finally {
    await client.close();
  }
}

verify().catch(console.error);
