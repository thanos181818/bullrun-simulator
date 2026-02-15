
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { AppDatabaseProvider, useAuth, useUser } from '@/database/provider';
import { KeyboardShortcutsProvider } from '@/components/shared/keyboard-shortcuts-provider';
import { KeyboardShortcutsModal } from '@/components/shared/keyboard-shortcuts-modal';
import { TradingTutorial } from '@/components/shared/trading-tutorial';
import { TranslationProvider } from '@/contexts/translation-context';
import { signOut } from 'next-auth/react';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CollapsibleSidebar } from '@/components/shared/collapsible-sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            <AppDatabaseProvider>
              <KeyboardShortcutsProvider>
                {isAuthPage ? (
                  children
                ) : (
                  <AppLayout>{children}</AppLayout>
                )}
                <KeyboardShortcutsModal />
                <TradingTutorial />
                <Toaster />
              </KeyboardShortcutsProvider>
            </AppDatabaseProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
