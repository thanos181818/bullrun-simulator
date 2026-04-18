import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function nukeData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all price history - this is the source of the "jittery" mock data
    const collections = await mongoose.connection.db.listCollections().toArray();
    const historyExists = collections.some(c => c.name === 'pricehistories');
    
    if (historyExists) {
      await mongoose.connection.db.collection('pricehistories').deleteMany({});
      console.log('✅ Deleted all old price history from "pricehistories" collection');
    }

    console.log('✨ Database cleaned. Next request will fetch fresh real data.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error nuking data:', error);
  }
}

nukeData();
