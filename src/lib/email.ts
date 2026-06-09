import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    console.log('-------------------------------------------');
    console.log(`📧 [MOCK] SENDING EMAIL TO: ${email}`);
    console.log(`🔗 RESET URL: ${resetUrl}`);
    console.log('-------------------------------------------');
    return { success: true, mock: true };
  }

  try {
    await resend.emails.send({
      from: 'Oloo <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { success: false, error };
  }
}

export async function sendOTPEmail(email: string, otp: string) {
  if (!resend) {
    console.log('-------------------------------------------');
    console.log(`📧 [MOCK] SENDING OTP EMAIL TO: ${email}`);
    console.log(`🔢 YOUR OTP CODE IS: ${otp}`);
    console.log('-------------------------------------------');
    return { success: true, mock: true };
  }

  try {
    await resend.emails.send({
      from: 'Oloo <onboarding@resend.dev>',
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px; margin: auto;">
          <h2 style="color: #333; text-align: center;">Verification Code</h2>
          <p style="color: #666; font-size: 16px; text-align: center;">Your 6-digit verification code is:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error };
  }
}
