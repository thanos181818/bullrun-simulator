import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

async function nuke() {
  try {
    await client.connect();
    const db = client.db('oloo');
    const collection = db.collection('pricehistories');

    // Delete EVERYTHING from Feb 1 to end of March
    const feb1 = new Date('2026-02-01T00:00:00Z').getTime();
    const apr1 = new Date('2026-04-01T00:00:00Z').getTime();

    const result = await collection.deleteMany({
      timestamp: { $gte: feb1, $lt: apr1 }
    });

    console.log(`🗑️  Deleted ${result.deletedCount} records from Feb 1 - March 31`);

    // Verify it's gone
    const remaining = await collection.countDocuments({
      timestamp: { $gte: feb1, $lt: apr1 }
    });

    console.log(`✅ Verification: ${remaining} records still in that range (should be 0)`);

    if (remaining === 0) {
      console.log('\n✨ Clean slate ready for new seed!');
    }

  } finally {
    await client.close();
  }
}

nuke().catch(console.error);
