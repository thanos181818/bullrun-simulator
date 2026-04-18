const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  const db = mongoose.connection.db;
  const MARCH_15 = new Date('2026-03-15T00:00:00Z').getTime();
  
  const result = await db.collection('pricehistories').deleteMany({
    timestamp: { $gt: MARCH_15 }
  });
  
  console.log(`✅ Deleted ${result.deletedCount} records after March 15`);
  console.log('\nNow run: npm run seed:update');
  
  await mongoose.disconnect();
}
cleanup().catch(console.error);
