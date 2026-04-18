const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function completeWipe() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  const db = mongoose.connection.db;
  
  // Delete EVERYTHING in the collection
  const result = await db.collection('pricehistories').deleteMany({});
  
  console.log(`\n🗑️  COMPLETE WIPE:`);
  console.log(`✅ Deleted ALL ${result.deletedCount} price records from database`);
  
  // Verify it's actually empty
  const remaining = await db.collection('pricehistories').countDocuments({});
  console.log(`\n🔍 Verification: ${remaining} records remaining`);
  
  if (remaining === 0) {
    console.log(`✅ Database is COMPLETELY CLEAN\n`);
    console.log(`Next steps:`);
    console.log(`  1. Run: npm run seed:update`);
    console.log(`  2. Then: npm run dev`);
    console.log(`  3. Clear browser cache (Ctrl+Shift+Delete)`);
  }
  
  await mongoose.disconnect();
}

completeWipe().catch(console.error);
