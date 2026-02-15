import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/users/[id]/add-funds - Add virtual funds to user's cash balance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { amount } = body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Limit to $100,000 per deposit to prevent abuse
    if (amount > 100000) {
      return NextResponse.json(
        { error: 'Maximum deposit is $100,000 per transaction.' },
        { status: 400 }
      );
    }
    
    // Get user and update balance - handle both email and ObjectId
    const user = id.includes('@')
      ? await UserModel.findOne({ email: id })
      : await UserModel.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const currentBalance = user.cashBalance || 0;
    const newBalance = currentBalance + amount;
    
    // Use actual MongoDB _id for update
    await UserModel.findByIdAndUpdate(user._id, { cashBalance: newBalance });
    
    
    return NextResponse.json({
      success: true,
      previousBalance: currentBalance,
      amountAdded: amount,
      newBalance: newBalance,
    }, { status: 200 });
  } catch (error) {
    console.error('Error adding funds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
