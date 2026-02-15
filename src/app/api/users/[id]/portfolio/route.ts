import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PortfolioModel, UserModel } from '@/lib/models/schemas';

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
    
    // Get mode from query params (default to simulated)
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'simulated';
    
    // Find portfolio for this user and mode
    const portfolio = await PortfolioModel.findOne({ 
      userId: user._id,
      mode: mode 
    }).lean();
    
    if (!portfolio) {
      // Return empty portfolio structure instead of 404
      return NextResponse.json({
        userId: id,
        mode: mode,
        holdings: [],
      });
    }
    
    return NextResponse.json({
      id: portfolio._id.toString(),
      userId: portfolio.userId,
      mode: portfolio.mode,
      holdings: portfolio.holdings,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    
    // Handle both email and ObjectId
    const user = id.includes('@')
      ? await UserModel.findOne({ email: id })
      : await UserModel.findById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get mode from body or default to simulated
    const mode = body.mode || 'simulated';
    
    const portfolio = await PortfolioModel.findOneAndUpdate(
      { userId: user._id, mode: mode },
      { $set: body },
      { new: true, upsert: true }
    ).lean();
    
    return NextResponse.json({
      id: portfolio._id.toString(),
      userId: portfolio.userId,
      mode: portfolio.mode,
      holdings: portfolio.holdings,
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
