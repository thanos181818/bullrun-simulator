import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/lib/models/schemas';
import crypto from 'crypto';

// POST /api/auth/request-reset - Request password reset
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
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store hashed token in database
    await UserModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetTokenExpiry,
    });

    // TODO: Send email with reset link
    // In a production app, you would send an email here with the reset link:
    // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // REMOVE IN PRODUCTION - only for development
      devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });

  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
