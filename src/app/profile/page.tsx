
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail, updateProfile, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeList } from '@/components/profile/badge-list';
import { ThemeSelector } from '@/components/profile/theme-selector';
import { useTheme } from 'next-themes';
import { checkAndAwardBadges } from '@/lib/badge-service';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const userDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
      if(user) {
          setName(user.displayName || '');
          setEmail(user.email || '');
      }
      if (userData?.theme) {
          setTheme(userData.theme);
      }
  }, [user, userData, setTheme]);

  // Effect for retroactive badge check
  useEffect(() => {
    if (firestore && user && !isUserDataLoading) {
      // Run the check once the user data is available.
      checkAndAwardBadges(firestore, user.uid, toast);
    }
  }, [firestore, user, isUserDataLoading, toast]);


  const handlePasswordReset = async () => {
    if (!auth || !user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send password reset email.',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for a link to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !firestore) return;

    setIsSaving(true);
    try {
      // Update Auth profile
      await updateProfile(auth.currentUser, { displayName: name });
      
      // If email is different, update it
      if(email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      // Update Firestore document
      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { name, email });

      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (isUserLoading || !user || isUserDataLoading) {
    return (
       <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <Card>
                <CardHeader>
                   <Skeleton className="h-8 w-32" />
                   <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                    </div>
                     <div className="space-y-2">
                       <Skeleton className="h-4 w-16" />
                       <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="mt-4 h-10 w-48" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
          <CardDescription>
            View and update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <BadgeList userBadges={userData?.badgeIds || []} />

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your app experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector currentTheme={userData?.theme} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you wish to change your password, click the button below to receive a password reset link to your email.
          </p>
          <Button variant="outline" onClick={handlePasswordReset}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
