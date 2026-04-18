import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

async function check() {
  try {
    await client.connect();
    const db = client.db('oloo');
    const assetsCollection = db.collection('assets');
    const pricesCollection = db.collection('pricehistories');

    // Check AAPL asset
    const aapl = await assetsCollection.findOne({ symbol: 'AAPL' });
    
    if (aapl) {
      console.log('\n📊 AAPL Asset in DB:');
      console.log(`  Current price field: $${aapl.price?.toFixed(2) || 'NOT SET'}`);
      console.log(`  Initial price: $${aapl.initialPrice?.toFixed(2) || 'NOT SET'}`);
      console.log(`  Change: ${aapl.change?.toFixed(2) || 'NOT SET'}`);
    } else {
      console.log('❌ AAPL asset not found!');
    }

    // Get latest price from database for March 20
    const march20Start = new Date('2026-03-20T00:00:00Z').getTime();
    const march21Start = new Date('2026-03-21T00:00:00Z').getTime();

    const latest = await pricesCollection
      .find({
        symbol: 'AAPL',
        timestamp: { $gte: march20Start, $lt: march21Start }
      })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length > 0) {
      const ts = new Date(latest[0].timestamp as number);
      console.log(`\n📈 Latest March 20 Price: $${latest[0].price.toFixed(2)} at ${ts.toISOString()}`);
    }

    console.log('\n⚠️  Issue: Asset.price should be updated to the latest price!');

  } finally {
    await client.close();
  }
}

check().catch(console.error);
