'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { get } from 'lodash';

import { Locale } from '@/lib/types';
import en from '@/locales/en.json';
import ptBR from '@/locales/pt-br.json';

interface LanguageContextType {
  locale: Locale;
  setLanguage: (_language: Locale) => void;
  t: (_key: string) => string;
  formatCurrency: (_amount: number) => string;
  formatDate: (_dateString: string) => string;
  getMonthName: (_monthIndex: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en,
  'pt-BR': ptBR,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('pt-BR'); // Default to pt-BR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Locale;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pt-BR')) {
      setLocaleState(savedLanguage);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('language', newLocale);
  };

  const t = useCallback(
    (key: string): string => {
      const translation = get(translations[locale], key);
      return translation || key;
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      const currency = locale === 'en' ? 'USD' : 'BRL';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    },
    [locale],
  );

  const formatDate = useCallback(
    (dateString: string) => {
      // The date string from the data is 'YYYY-MM-DD'.
      // To avoid timezone issues where this might be interpreted as the previous day,
      // we explicitly tell JavaScript to treat it as UTC by adding time and Z.
      const date = new Date(`${dateString}T00:00:00Z`);
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    },
    [locale],
  );

  const getMonthName = useCallback(
    (monthIndex: number) => {
      const date = new Date();
      date.setMonth(monthIndex);
      return date.toLocaleString(locale, { month: 'long' });
    },
    [locale],
  );

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider
      value={{ locale, setLanguage, t, formatCurrency, formatDate, getMonthName }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
