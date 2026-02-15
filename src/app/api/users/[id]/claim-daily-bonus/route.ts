import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/users/[id]/claim-daily-bonus - Claim daily login bonus
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
    
    // Get user - handle both email and ObjectId
    const user = id.includes('@') 
      ? await UserModel.findOne({ email: id })
      : await UserModel.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const now = new Date();
    const lastBonusDate = user.lastDailyBonusDate;
    
    // Check if user already claimed bonus today
    if (lastBonusDate) {
      const lastBonusDay = new Date(lastBonusDate).setHours(0, 0, 0, 0);
      const todayStart = new Date(now).setHours(0, 0, 0, 0);
      
      if (lastBonusDay === todayStart) {
        const nextBonusTime = new Date(todayStart);
        nextBonusTime.setDate(nextBonusTime.getDate() + 1);
        
        return NextResponse.json({
          success: false,
          alreadyClaimed: true,
          message: 'You have already claimed your daily bonus today.',
          nextBonusAvailable: nextBonusTime,
        }, { status: 400 });
      }
    }
    
    // Award daily bonus
    const bonusAmount = 1000;
    const currentBalance = user.cashBalance || 0;
    const newBalance = currentBalance + bonusAmount;
    
    // Create balance history entry
    const balanceHistory = user.balanceHistory || [];
    balanceHistory.push({
      type: 'daily-bonus',
      amount: bonusAmount,
      description: 'Daily login bonus',
      reference: 'daily-bonus',
      balanceAfter: newBalance,
      createdAt: new Date(),
    });
    
    // Use actual MongoDB _id for update
    const userId = user._id.toString();
    
    await UserModel.findByIdAndUpdate(userId, {
      cashBalance: newBalance,
      balanceHistory,
      lastDailyBonusDate: now,
      lastLoginDate: now,
    });
    
    
    return NextResponse.json({
      success: true,
      bonusAmount,
      previousBalance: currentBalance,
      newBalance,
      message: `You've received your daily bonus of $${bonusAmount}!`,
    }, { status: 200 });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/claim-daily-bonus - Check if daily bonus is available
export async function GET(
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
    
    // Get user - handle both email and ObjectId
    const user = id.includes('@')
      ? await UserModel.findOne({ email: id })
      : await UserModel.findById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const now = new Date();
    const lastBonusDate = user.lastDailyBonusDate;
    
    let canClaim = true;
    let nextBonusAvailable = null;
    
    if (lastBonusDate) {
      const lastBonusDay = new Date(lastBonusDate).setHours(0, 0, 0, 0);
      const todayStart = new Date(now).setHours(0, 0, 0, 0);
      
      if (lastBonusDay === todayStart) {
        canClaim = false;
        nextBonusAvailable = new Date(todayStart);
        nextBonusAvailable.setDate(nextBonusAvailable.getDate() + 1);
      }
    }
    
    return NextResponse.json({
      canClaim,
      bonusAmount: 1000,
      lastClaimedDate: lastBonusDate,
      nextBonusAvailable,
    });
  } catch (error) {
    console.error('Error checking daily bonus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
