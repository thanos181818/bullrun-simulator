import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { AssetModel } from '@/lib/models/schemas';

export async function GET() {
  try {
    await connectToDatabase();
    
    const assets = await AssetModel.find({}).sort({ symbol: 1 }).lean();
    
    return NextResponse.json(
      assets.map(asset => ({
        id: asset._id.toString(),
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        change: asset.change,
        changePercent: asset.changePercent,
        marketCap: asset.marketCap,
        type: asset.type,
        initialPrice: asset.initialPrice,
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
