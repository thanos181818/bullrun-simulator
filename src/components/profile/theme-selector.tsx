'use client';

import { useTheme } from 'next-themes';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThemeSelectorProps {
    currentTheme?: string;
}

export function ThemeSelector({ currentTheme = 'system' }: ThemeSelectorProps) {
  const { setTheme } = useTheme();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user && firestore) {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { theme: newTheme });
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
        defaultValue={currentTheme}
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

    