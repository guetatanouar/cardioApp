"use client";

import * as React from "react";

import type { Locale } from "./i18n/messages";
import { locales, messages, getDir } from "./i18n/messages";

const STORAGE_KEY = "cm_locale";

type I18nContextValue = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("fr");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && locales.includes(stored as Locale)) {
      setLocaleState(stored as Locale);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.dir = getDir(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.dir = getDir(l);
    document.documentElement.lang = l;
  };

  const t = (key: string) => {
    return (messages[locale] as Record<string, string>)[key] ?? (messages.fr as Record<string, string>)[key] ?? key;
  };

  return React.createElement(I18nContext.Provider, { value: { locale, t, setLocale } }, children);
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
