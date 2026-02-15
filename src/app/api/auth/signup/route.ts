import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import { UserModel, PortfolioModel } from '@/lib/models/schemas';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with initial balance history
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      fullName,
      cashBalance: 10000,
      portfolioValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      badgeIds: [],
      watchlist: [],
      themePreference: 'system',
      balanceHistory: [{
        type: 'initial',
        amount: 10000,
        description: 'Starting balance',
        reference: 'signup',
        balanceAfter: 10000,
        createdAt: new Date(),
      }],
    });

    // Create initial portfolio
    await PortfolioModel.create({
      userId: user._id.toString(),
      mode: 'simulated',
      holdings: [],
    });

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
