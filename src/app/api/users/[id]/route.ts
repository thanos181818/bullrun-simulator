import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Check if id is email or MongoDB ObjectId
    let user;
    if (id.includes('@')) {
      // It's an email
      user = await UserModel.findOne({ email: id }).select('-password').lean();
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      // It's a MongoDB ID
      user = await UserModel.findById(id).select('-password').lean();
    } else {
      return NextResponse.json({ error: 'Invalid user identifier' }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      cashBalance: user.cashBalance,
      portfolioValue: user.portfolioValue,
      totalReturn: user.totalReturn,
      totalReturnPercent: user.totalReturnPercent,
      badgeIds: user.badgeIds || [],
      watchlist: user.watchlist || [],
      themePreference: user.themePreference || 'system',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
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
    
    // Check if id is email or MongoDB ObjectId
    let user;
    if (id.includes('@')) {
      // It's an email
      user = await UserModel.findOneAndUpdate(
        { email: id },
        { $set: body },
        { new: true, select: '-password' }
      ).lean();
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      // It's a MongoDB ID
      user = await UserModel.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, select: '-password' }
      ).lean();
    } else {
      return NextResponse.json({ error: 'Invalid user identifier' }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      cashBalance: user.cashBalance,
      portfolioValue: user.portfolioValue,
      totalReturn: user.totalReturn,
      totalReturnPercent: user.totalReturnPercent,
      badgeIds: user.badgeIds || [],
      watchlist: user.watchlist || [],
      themePreference: user.themePreference || 'system',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
