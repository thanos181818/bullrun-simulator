import { create } from 'zustand';

interface KeyboardShortcutsStore {
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (isOpen: boolean) => void;
}

export const useKeyboardShortcuts = create<KeyboardShortcutsStore>((set) => ({
  isHelpModalOpen: false,
  setIsHelpModalOpen: (isOpen) => set({ isHelpModalOpen: isOpen }),
}));

export const shortcuts = [
  { key: 'T', description: 'Quick Trade', action: 'trade' },
  { key: 'W', description: 'Go to Watchlist', action: 'watchlist' },
  { key: 'P', description: 'Go to Portfolio', action: 'portfolio' },
  { key: 'L', description: 'Go to Learning', action: 'learning' },
  { key: 'H', description: 'Go to History', action: 'history' },
  { key: '/', description: 'Search Assets', action: 'search' },
  { key: '?', description: 'Show Shortcuts', action: 'help' },
  { key: 'Esc', description: 'Close Modal', action: 'escape' },
] as const;
