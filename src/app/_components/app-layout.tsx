'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/database/provider';
import { CollapsibleSidebar } from '@/components/shared/collapsible-sidebar';
import { signOut } from 'next-auth/react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isUserLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
  }, [user, isUserLoading, isAuthenticated, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <CollapsibleSidebar />
      <div className="flex flex-col flex-1 ml-20">
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-gradient-to-br from-background via-background/95 to-background/90">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
