'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Preload all translations
const translationsCache: Record<Language, any> = {
  en: {},
  es: {},
  fr: {},
  de: {},
  zh: {},
};

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Load all translations on mount
  useEffect(() => {
    const loadAllTranslations = async () => {
      try {
        // Preload all language files
        const en = await import('@/locales/en.json');
        const es = await import('@/locales/es.json');
        const fr = await import('@/locales/fr.json');
        const de = await import('@/locales/de.json');
        const zh = await import('@/locales/zh.json');

        translationsCache['en'] = en.default;
        translationsCache['es'] = es.default;
        translationsCache['fr'] = fr.default;
        translationsCache['de'] = de.default;
        translationsCache['zh'] = zh.default;

        // Load saved language preference
        const savedLang = localStorage.getItem('preferred_language') as Language | null;
        if (savedLang && ['en', 'es', 'fr', 'de', 'zh'].includes(savedLang)) {
          setLanguageState(savedLang);
        }

        setHydrated(true);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setHydrated(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllTranslations();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    if (['en', 'es', 'fr', 'de', 'zh'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('preferred_language', lang);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translationsCache[language];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    return value || key;
  }, [language]);

  // Prevent rendering until hydrated
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}
