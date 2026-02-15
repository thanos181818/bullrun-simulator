'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Failed to send reset email');
      }

      setEmailSent(true);
      toast({
        title: 'Reset Link Sent',
        description: data.message,
      });

      // In development, show the reset token and provide navigation
      if (data.devToken) {
        const resetUrl = `/reset-password?token=${data.devToken}`;
        toast({
          title: 'Development Mode',
          description: 'Check console for reset link or use the button below',
          duration: 10000,
        });
        // Auto-navigate after 2 seconds in dev mode
        setTimeout(() => {
          window.location.href = resetUrl;
        }, 2000);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset email',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <AuthVisualPanel />
      <div className="flex items-center justify-center py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto grid w-[350px] gap-6">
           <div className="grid gap-2 text-center">
             <h1 className="text-3xl font-bold">Reset Password</h1>
             <p className="text-balance text-muted-foreground">
                Enter your email to receive a reset link.
             </p>
           </div>
           <form onSubmit={handlePasswordReset}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || emailSent}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || emailSent}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : emailSent ? (
                  'Reset Link Sent'
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
           {emailSent && (
             <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
               Check your email for the password reset link. In development mode, the token is logged to the console.
             </div>
           )}
           <div className="mt-4 text-center text-sm">
             Remember your password?{' '}
             <Link href="/login" className="underline">
               Log in
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
