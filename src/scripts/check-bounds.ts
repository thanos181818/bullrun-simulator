import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

async function check() {
  try {
    await client.connect();
    const db = client.db('oloo');
    const collection = db.collection('pricehistories');

    // Check AAPL data for the next few days
    const march20 = new Date('2026-03-20T00:00:00Z').getTime();
    const march25 = new Date('2026-03-25T00:00:00Z').getTime();

    const aaplCount = await collection.countDocuments({
      symbol: 'AAPL',
      timestamp: { $gte: march20, $lt: march25 }
    });

    console.log(`\nAAPL records March 20-24: ${aaplCount}`);

    // Get the latest AAPL record
    const latest = await collection
      .find({ symbol: 'AAPL' })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length > 0) {
      const doc = latest[0] as any;
      const ts = new Date(doc.timestamp);
      console.log(`Latest AAPL in DB: ${ts.toISOString()} - $${doc.price.toFixed(2)}`);
    }

    // Check for any <$200 prices
    const lowCount = await collection.countDocuments({
      symbol: 'AAPL',
      price: { $lt: 200 }
    });

    console.log(`AAPL records below $200: ${lowCount}`);

  } finally {
    await client.close();
  }
}

check().catch(console.error);
