import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { AssetModel, PriceHistoryModel } from '@/lib/models/schemas';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { prices } = await request.json();
    
    if (!prices || typeof prices !== 'object') {
      return NextResponse.json({ error: 'Invalid prices data' }, { status: 400 });
    }

    const timestamp = Date.now();

    // Batch update assets using updateMany instead of individual updateOne calls
    const bulkOps = Object.entries(prices).map(([symbol, price]) => ({
      updateOne: {
        filter: { symbol },
        update: { $set: { price: price as number } }
      }
    }));

    // Save to price history collection
    const historyEntries = Object.entries(prices).map(([symbol, price]) => ({
      symbol,
      timestamp,
      price: price as number,
    }));

    // Execute bulk operations and history insert in parallel
    await Promise.all([
      bulkOps.length > 0 ? AssetModel.bulkWrite(bulkOps) : Promise.resolve(),
      PriceHistoryModel.insertMany(historyEntries, { ordered: false })
    ]);

    return NextResponse.json({ success: true, updated: Object.keys(prices).length });
  } catch (error) {
    console.error('Error updating asset prices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
