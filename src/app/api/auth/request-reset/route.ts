import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import crypto from 'crypto';
import { sendOTPEmail } from '@/lib/email';

// POST /api/auth/request-reset - Request password reset with OTP
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await UserModel.findOne({ email }).lean();
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiry = new Date(Date.now() + 600000); // 10 minutes from now

    // Store hashed OTP in database
    await UserModel.findByIdAndUpdate(user._id, {
      resetOTP: otpHash,
      resetOTPExpires: otpExpiry,
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.',
      // REMOVE IN PRODUCTION - only for development
      devOTP: process.env.NODE_ENV === 'development' ? otp : undefined,
    });


  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
