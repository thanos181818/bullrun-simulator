'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';
import { useSession, signIn } from 'next-auth/react';
import { ThemeToggle } from '@/components/shared/theme-toggle';


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      toast({
        title: 'Account Created',
        description: 'Successfully created your account. Logging you in...',
      });

      // Auto-login after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error instanceof Error ? error.message : 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <AuthVisualPanel />
      <div className="flex items-center justify-center py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Create an Account</h1>
              <p className="text-balance text-muted-foreground">
                Join BullRun and start your simulated trading journey.
              </p>
            </div>
            <form onSubmit={handleSignup}>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                    id="name"
                    placeholder="Max Robinson"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                </div>
            </form>
            <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                Login
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
