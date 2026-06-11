'use client';

import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export function LanguageSelector() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-10 w-10 hover:bg-accent/50"
      title="Rule Book"
    >
      <BookOpen className="h-5 w-5" />
      <span className="sr-only">Rule Book</span>
    </Button>
  );
}
