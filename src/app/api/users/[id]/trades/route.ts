import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TradeModel, UserModel } from '@/lib/models/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Handle both email and ObjectId
    const user = id.includes('@')
      ? await UserModel.findOne({ email: id })
      : await UserModel.findById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const trades = await TradeModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    
    return NextResponse.json(
      trades.map(trade => ({
        id: trade._id.toString(),
        userId: trade.userId,
        mode: trade.mode,
        assetSymbol: trade.assetSymbol,
        assetType: trade.assetType,
        quantity: trade.quantity,
        orderType: trade.orderType,
        price: trade.price,
        totalAmount: trade.totalAmount,
        timestamp: trade.timestamp,
      }))
    );
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    
    const trade = await TradeModel.create({
      userId: id,
      ...body,
      timestamp: new Date(),
    });
    
    return NextResponse.json({
      id: trade._id.toString(),
      userId: trade.userId,
      mode: trade.mode,
      assetSymbol: trade.assetSymbol,
      assetType: trade.assetType,
      quantity: trade.quantity,
      orderType: trade.orderType,
      price: trade.price,
      totalAmount: trade.totalAmount,
      timestamp: trade.timestamp,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
