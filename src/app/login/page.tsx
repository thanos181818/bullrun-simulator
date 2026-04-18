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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error,
        });
      } else {
        router.push('/');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
             <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
             <p className="text-foreground text-sm tracking-widest font-medium uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex lg:grid lg:grid-cols-2 bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      <div className="hidden lg:block relative h-full">
         <AuthVisualPanel />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 relative z-20">
        {/* Subtle animated background blooms behind the card */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-50 animate-pulse -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] opacity-50 animate-pulse -z-10 mix-blend-screen" style={{ animationDelay: '2s' }}></div>

        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-[400px] shadow-2xl border-primary/10 bg-background/60 backdrop-blur-2xl">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your trading dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-5">
                <div className="grid gap-2 group">
                  <Label htmlFor="email" className="text-sm font-medium transition-colors group-focus-within:text-primary">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-background/50"
                  />
                </div>
                <div className="grid gap-2 group">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium transition-colors group-focus-within:text-primary">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary bg-background/50"
                  />
                </div>
                <Button 
                   type="submit" 
                   className="w-full mt-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 relative overflow-hidden group" 
                   disabled={isLoading}
                >
                  <span className="relative z-10 font-semibold">{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                  {/* Button shine effect */}
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-shine transition-all"></div>
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
             <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t border-muted"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-background/60 px-2 text-muted-foreground backdrop-blur-sm">Or</span>
                </div>
             </div>
             <div className="text-center text-sm text-muted-foreground w-full">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4">
                  Create one now
                </Link>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
