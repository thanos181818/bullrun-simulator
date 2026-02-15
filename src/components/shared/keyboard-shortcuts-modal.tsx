'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKeyboardShortcuts, shortcuts } from '@/stores/keyboard-shortcuts';
import { Keyboard } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const { isHelpModalOpen, setIsHelpModalOpen } = useKeyboardShortcuts();

  return (
    <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-3 py-1.5 text-sm font-bold rounded-md bg-background border-2 border-border shadow-sm font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
