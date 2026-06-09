import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import crypto from 'crypto';

// POST /api/auth/verify-otp - Verify the OTP code
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { email, otp } = await request.json();
    
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Hash the provided OTP to compare with stored hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with valid OTP and matching email
    const user = await UserModel.findOne({
      email,
      resetOTP: otpHash,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Return success. In a real app, you might return a temporary token 
    // to secure the password reset step, but for simplicity here 
    // we'll just confirm it's valid.
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
