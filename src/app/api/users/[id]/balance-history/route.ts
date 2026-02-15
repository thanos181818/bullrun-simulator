// GET /api/users/[id]/balance-history - Get user's balance transaction history
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Try to find user by email first, then by ObjectId
    let user = await UserModel.findOne({ email: id }).lean();
    if (!user) {
      user = await UserModel.findById(id).lean();
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return balance history transactions
    const balanceHistory = user.balanceHistory || [];

    return NextResponse.json({
      userId: user._id,
      currentBalance: user.cashBalance,
      totalEarned: user.cashEarned || 0,
      initialBalance: 10000,
      transactions: balanceHistory.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}
