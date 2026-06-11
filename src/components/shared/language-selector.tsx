'use client';

import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

const GUIDE_URL = 'https://app.tango.us/app/embed/0269f00c-956b-461a-a1da-b2ffd890cc3b';

export function LanguageSelector() {
  const handleClick = () => {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-10 w-10 hover:bg-accent/50"
      title="Rule Book"
      onClick={handleClick}
    >
      <BookOpen className="h-5 w-5" />
      <span className="sr-only">Rule Book</span>
    </Button>
  );
}
