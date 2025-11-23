
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { FirebaseClientProvider, useAuth, useUser } from '@/firebase';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { BullRunLogo } from '@/components/icons';
import { NAV_ITEMS } from '@/lib/constants';
import { MainHeader } from '@/components/shared/main-header';
import { signOut } from 'firebase/auth';
import { DatabaseSeeder } from '@/components/shared/database-seeder';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    localStorage.removeItem('loginTimestamp');
    router.push('/login');
  };

  React.useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const loginTimestamp = localStorage.getItem('loginTimestamp');
    if (loginTimestamp && Date.now() - parseInt(loginTimestamp, 10) > SESSION_TIMEOUT) {
        handleLogout();
    } else if (!loginTimestamp) {
        localStorage.setItem('loginTimestamp', Date.now().toString());
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DatabaseSeeder />
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-12 items-center gap-2">
            <BullRunLogo className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold tracking-tighter">
              BullRun
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Separator className="my-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Log Out">
                <LogOut />
                <span>Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <MainHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {isAuthPage ? (
              children
            ) : (
              <AppLayout>{children}</AppLayout>
            )}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
