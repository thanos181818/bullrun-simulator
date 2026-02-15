
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeList } from '@/components/profile/badge-list';
import { ThemeSelector } from '@/components/profile/theme-selector';
import { ViewBalanceDialog } from '@/components/profile/view-balance-dialog';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { checkAndAwardBadges } from '@/lib/badge-service';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const router = useRouter();

  const { data: userData, isLoading: isUserDataLoading, mutate } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [badgeCheckComplete, setBadgeCheckComplete] = useState(false);
  
  useEffect(() => {
      if(userData) {
          setName(userData.fullName || '');
          setEmail(userData.email || '');
          setImagePreview(userData.avatar || '');
      }
      if (userData?.themePreference) {
          setTheme(userData.themePreference);
      }
  }, [userData, setTheme]);

  // Check and award badges retroactively when profile loads (only once)
  useEffect(() => {
    if (session?.user?.email && userData && !badgeCheckComplete) {
      console.log('[PROFILE] Running retroactive badge check...');
      setBadgeCheckComplete(true);
      
      // Run badge check and refresh data if any badges were awarded
      checkAndAwardBadges(session.user.email, toast)
        .then((newBadges) => {
          console.log('[PROFILE] Badge check complete, new badges:', newBadges);
          if (newBadges.length > 0) {
            // Refresh user data to show new badges
            setTimeout(() => {
              mutate();
            }, 500);
          }
        })
        .catch(error => {
          console.error('[PROFILE] Error checking badges:', error);
        });
    }
  }, [session?.user?.email, userData?.email, badgeCheckComplete]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Image must be less than 5MB',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handlePasswordReset = async () => {
    if (!session?.user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send password reset email.',
      });
      return;
    }
    router.push('/forgot-password');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    setIsSaving(true);
    try {
      let avatarUrl = userData?.avatar;

      // Upload image if one was selected
      if (imageFile) {
        setIsUploadingImage(true);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        avatarUrl = await base64Promise;
      }

      const response = await fetch(`/api/users/${session.user.email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: name,
          ...(avatarUrl && { avatar: avatarUrl })
        }),
      });

      if (!response.ok) throw new Error('Update failed');

      await mutate(); // Revalidate user data
      setImageFile(null);

      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been successfully updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };


  const isLoading = status === 'loading' || isUserDataLoading;

  if (isLoading || !session?.user) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <ViewBalanceDialog userEmail={session?.user?.email || ''} />
      </div>
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
                <AvatarImage src={imagePreview || userData?.avatar || session?.user?.image || ''} />
                <AvatarFallback>
                  {userData?.fullName?.charAt(0) || session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Change Avatar</span>
                  </Button>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isSaving || isUploadingImage}
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {imageFile.name}
                  </p>
                )}
              </div>
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
                disabled
                readOnly
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
          <ThemeSelector currentTheme={userData?.themePreference} />
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
