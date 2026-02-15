'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/contexts/translation-context';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const;

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  const currentLanguage = languages.find((lang) => lang.code === language);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'en' | 'es' | 'fr' | 'de' | 'zh');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-accent/50"
          title={`Current language: ${currentLanguage?.name}`}
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Select Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="cursor-pointer flex items-center gap-2"
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1 font-medium">{lang.name}</span>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
