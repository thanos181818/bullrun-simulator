'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { TranslationProvider } from '@/contexts/translation-context';
import { AppDatabaseProvider } from '@/database/provider';
import { KeyboardShortcutsProvider } from '@/components/shared/keyboard-shortcuts-provider';
import { KeyboardShortcutsModal } from '@/components/shared/keyboard-shortcuts-modal';
import { TradingTutorial } from '@/components/shared/trading-tutorial';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { AppLayout } from './app-layout';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  return (
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
  );
}
