"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200 p-0.5 text-xs">
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 font-medium transition ${
          locale === "en" ? "bg-highway text-white" : "text-gray-500"
        }`}
      >
        {t("language.en")}
      </button>
      <button
        onClick={() => setLocale("hi")}
        aria-pressed={locale === "hi"}
        className={`rounded-full px-2.5 py-1 font-medium transition ${
          locale === "hi" ? "bg-highway text-white" : "text-gray-500"
        }`}
      >
        {t("language.hi")}
      </button>
    </div>
  );
}
