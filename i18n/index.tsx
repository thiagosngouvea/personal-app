import React, { createContext, useContext } from 'react';
import { pt, Translations } from './translations/pt';
import { en } from './translations/en';

export type Language = 'pt' | 'en';
export type { Translations };

const translations: Record<Language, Translations> = { pt, en };

const I18nContext = createContext<Translations>(pt);

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const t = translations[language] || pt;
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useTranslation(): Translations {
  return useContext(I18nContext);
}
