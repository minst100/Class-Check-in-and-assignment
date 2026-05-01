import { createContext, useContext, useMemo, useState } from 'react';
import en from '../i18n/en.json';
import th from '../i18n/th.json';

const I18nContext = createContext(null);
const dictionaries = { en, th };

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const t = (key) => key.split('.').reduce((acc, next) => acc?.[next], dictionaries[locale]) || key;
  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
