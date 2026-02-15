'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/stores/keyboard-shortcuts';

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setIsHelpModalOpen = useKeyboardShortcuts((state) => state.setIsHelpModalOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle shortcuts
      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault();
          router.push('/trade/BTC');
          break;
        case 'w':
          e.preventDefault();
          router.push('/watchlist');
          break;
        case 'p':
          e.preventDefault();
          router.push('/portfolio');
          break;
        case 'h':
          if (!e.ctrlKey && !e.metaKey) { // Avoid conflict with browser history
            e.preventDefault();
            router.push('/history');
          }
          break;
        case '/':
          e.preventDefault();
          // Focus search input if exists
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case '?':
          e.preventDefault();
          setIsHelpModalOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, setIsHelpModalOpen]);

  return <>{children}</>;
}
