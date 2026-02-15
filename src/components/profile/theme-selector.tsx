'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';

interface ThemeSelectorProps {
    currentTheme?: string;
}

export function ThemeSelector({ currentTheme = 'system' }: ThemeSelectorProps) {
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = async (newTheme: string) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    if (session?.user?.email) {
      try {
        const response = await fetch(`/api/users/${session.user.email}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themePreference: newTheme }),
        });
        
        if (!response.ok) throw new Error('Failed to save theme');
        
        // Revalidate user data to update UI
        mutate(`/api/users/${session.user.email}`);
        
        toast({
            title: "Theme saved",
            description: `Your theme preference has been updated to ${newTheme}.`
        })
      } catch (error) {
        console.error("Failed to save theme preference:", error);
        toast({
            variant: "destructive",
            title: "Save failed",
            description: "Could not save your theme preference."
        })
      }
    }
  };

  return (
    <div className='space-y-2'>
      <Label>Theme</Label>
      <RadioGroup
        value={selectedTheme}
        onValueChange={handleThemeChange}
        className="flex gap-4"
      >
        <Label htmlFor="light" className="flex flex-col items-center gap-2 cursor-pointer rounded-md border-2 border-transparent p-4 [&:has([data-state=checked])]:border-primary">
          <Sun className="h-6 w-6" />
          <RadioGroupItem value="light" id="light" className="sr-only" />
          Light
        </Label>
        <Label htmlFor="dark" className="flex flex-col items-center gap-2 cursor-pointer rounded-md border-2 border-transparent p-4 [&:has([data-state=checked])]:border-primary">
          <Moon className="h-6 w-6" />
          <RadioGroupItem value="dark" id="dark" className="sr-only" />
          Dark
        </Label>
        <Label htmlFor="system" className="flex flex-col items-center gap-2 cursor-pointer rounded-md border-2 border-transparent p-4 [&:has([data-state=checked])]:border-primary">
          <Laptop className="h-6 w-6" />
          <RadioGroupItem value="system" id="system" className="sr-only" />
          System
        </Label>
      </RadioGroup>
    </div>
  );
}

    