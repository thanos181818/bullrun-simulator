import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

async function detailed() {
  try {
    await client.connect();
    const db = client.db('oloo');
    const collection = db.collection('pricehistories');

    // Get ALL March 20 AAPL records sorted by timestamp
    const march20Start = new Date('2026-03-20T00:00:00Z').getTime();
    const march22Start = new Date('2026-03-22T00:00:00Z').getTime();

    const allData = await collection
      .find({
        symbol: 'AAPL',
        timestamp: { $gte: march20Start, $lt: march22Start }
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log(`Total March 20-21 records: ${allData.length}\n`);
    
    // Show a sample every 10 records
    const step = Math.max(1, Math.floor(allData.length / 20));
    for (let i = 0; i < allData.length; i += step) {
      const doc = allData[i] as any;
      const ts = new Date(doc.timestamp);
      const price = doc.price.toFixed(2);
      const warn = doc.price < 200 ? ' ❌ LOW!' : '';
      console.log(`  [${i}] ${ts.toISOString()} - $${price}${warn}`);
    }

    // Show last 5
    console.log('\nLast 5 records:');
    allData.slice(-5).forEach((doc: any, idx) => {
      const ts = new Date(doc.timestamp);
      const price = doc.price.toFixed(2);
      const warn = doc.price < 200 ? ' ❌ LOW!' : '';
      console.log(`  ${ts.toISOString()} - $${price}${warn}`);
    });

  } finally {
    await client.close();
  }
}

detailed().catch(console.error);
