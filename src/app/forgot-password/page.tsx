'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Loader2, ArrowLeft, MailCheck, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const { toast } = useToast();
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep(2);
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the 6-digit code.',
      });

      // In development, log the OTP if mock is used
      if (data.devOTP) {
        console.log('--- DEVELOPMENT OTP ---');
        console.log(`Email: ${email}`);
        console.log(`OTP: ${data.devOTP}`);
        console.log('------------------------');
        toast({
          title: 'Development Mode',
          description: `OTP is ${data.devOTP} (also logged to console)`,
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setStep(3);
      toast({
        title: 'Identity Verified',
        description: 'Code verified successfully. Please set your new password.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are identical.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'Success!',
        description: 'Your password has been reset successfully. Redirecting to login...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Failed to reset password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex lg:grid lg:grid-cols-2 bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      <div className="hidden lg:block relative h-full">
         <AuthVisualPanel />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 relative z-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-40 animate-float-2 pointer-events-none -z-10 mix-blend-screen" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] opacity-40 animate-float-1 pointer-events-none -z-10 mix-blend-screen" />

        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-[420px] shadow-glass-lg border-white/10 bg-background/50 backdrop-blur-2xl overflow-hidden">
          <CardHeader className="space-y-3 pb-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              {step === 1 && <MailCheck className="h-6 w-6 text-primary" />}
              {step === 2 && <ShieldCheck className="h-6 w-6 text-primary" />}
              {step === 3 && <KeyRound className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-3xl font-extrabold font-headline tracking-tighter bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
               {step === 1 && 'Forgot Password?'}
               {step === 2 && 'Verify Identity'}
               {step === 3 && 'New Password'}
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              {step === 1 && "Enter your email to receive a 6-digit verification code."}
              {step === 2 && `We've sent a code to ${email}. Enter it below.`}
              {step === 3 && "Create a new strong password for your account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRequestOTP}
                >
                  <div className="grid gap-5">
                    <div className="grid gap-2 group">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-focus-within:text-primary">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-black/5 dark:bg-white/5 border-white/10"
                      />
                    </div>
                    <Button 
                       type="submit" 
                       className="w-full mt-2 h-11 font-bold text-base transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] relative overflow-hidden group" 
                       disabled={isLoading}
                    >
                      <span className="relative z-10">{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-shine transition-all"></div>
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOTP}
                >
                  <div className="grid gap-5">
                    <div className="grid gap-2 group">
                      <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-focus-within:text-primary">6-Digit Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isLoading}
                        className="h-11 text-center text-xl font-bold tracking-[0.5em] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-black/5 dark:bg-white/5 border-white/10"
                      />
                    </div>
                    <Button 
                       type="submit" 
                       className="w-full mt-2 h-11 font-bold text-base transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] relative overflow-hidden group" 
                       disabled={isLoading || otp.length < 6}
                    >
                      <span className="relative z-10">{isLoading ? 'Verifying...' : 'Verify Code'}</span>
                      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-shine transition-all"></div>
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      Wrong email? <span className="text-primary underline">Go back</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetPassword}
                >
                  <div className="grid gap-5">
                    <div className="grid gap-2 group">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-black/5 dark:bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="grid gap-2 group">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-black/5 dark:bg-white/5 border-white/10"
                      />
                    </div>

                    <Button 
                       type="submit" 
                       className="w-full mt-2 h-11 font-bold text-base transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] relative overflow-hidden group" 
                       disabled={isLoading}
                    >
                      <span className="relative z-10">{isLoading ? 'Resetting...' : 'Update Password'}</span>
                      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-shine transition-all"></div>
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="pb-6">
            <div className="flex flex-col w-full gap-3">
              {step === 2 && (
                <button 
                  onClick={handleRequestOTP}
                  disabled={isLoading}
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  Didn&apos;t receive a code? <span className="text-primary underline">Resend code</span>
                </button>
              )}
              <Link 
                href="/login" 
                className="flex items-center justify-center w-full text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
