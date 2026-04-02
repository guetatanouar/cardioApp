"use client";

import * as React from "react";

import type { Locale } from "./messages";
import { locales, messages } from "./messages";

const STORAGE_KEY = "cm_locale";

type I18nContextValue = {
  locale: Locale;
  t: (key: keyof (typeof messages)["fr"]) => string;
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

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: keyof (typeof messages)["fr"]) => {
    return messages[locale][key] ?? messages.fr[key];
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
