"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import en from "./dictionaries/en.json";
import hi from "./dictionaries/hi.json";

export type Locale = "en" | "hi";

const dictionaries: Record<Locale, typeof en> = { en, hi };

const STORAGE_KEY = "cbd_locale";

type Dict = typeof en;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : match;
  });
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Bilingual (EN/HI) support is implemented as static, locally-bundled
 * dictionaries rather than a runtime translation API. Vehicle/UI copy is
 * finite and known ahead of time, so there is no need for a translation
 * service call (and its latency/failure surface) on every page load.
 * This keeps the "no API hell" principle from the PRD: one fewer external
 * dependency to keep alive.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "hi") {
      setLocaleState(stored);
    } else {
      // Soft default: try the browser's language, fall back to English.
      const browserLang = navigator.language?.toLowerCase() ?? "";
      if (browserLang.startsWith("hi")) setLocaleState("hi");
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => {
    const dict: Dict = dictionaries[locale];
    return (key: string, vars?: Record<string, string | number>) => {
      const value = getByPath(dict, key) ?? getByPath(dictionaries.en, key) ?? key;
      return interpolate(value, vars);
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
