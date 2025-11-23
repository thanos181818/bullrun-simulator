'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
            description: 'Services not available. Please try again later.',
        });
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, { displayName: name });
        const userDocRef = doc(firestore, 'users', user.uid);
        const newUser = {
          id: user.uid,
          name,
          email: user.email,
          avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
          walletSimulated: 100000,
          walletReal: 0,
          badgeIds: [],
          modulesCompleted: [],
          quizzesCompleted: [],
          watchlist: [],
          createdAt: new Date().toISOString(),
          theme: 'light',
        };
        setDocumentNonBlocking(userDocRef, newUser, { merge: true });
        // The router.replace will be handled by the useEffect
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error.message,
      });
    }
  };

  if (isUserLoading || user) {
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
                    />
                </div>
                <Button type="submit" className="w-full">
                    Create Account
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
