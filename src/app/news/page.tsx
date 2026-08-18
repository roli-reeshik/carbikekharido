"use client";

import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NEWS_ARTICLES } from "@/lib/homeContent";

export default function NewsPage() {
  const { locale, t } = useLanguage();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">{t("newsPage.title")}</h1>
        <p className="mt-1 text-sm text-ink/50">{t("newsPage.subtitle")}</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS_ARTICLES.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="card group p-6"
            >
              <div className="flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-highway/5 to-teal/10 text-5xl">
                📰
              </div>
              <span className="mt-4 inline-block rounded-full bg-marigold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-marigold-dark">
                {article.tag[locale]}
              </span>
              <h2 className="mt-2 font-display text-lg font-bold leading-snug text-ink group-hover:text-highway">
                {article.title[locale]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">{article.excerpt[locale]}</p>
              <p className="mt-3 text-xs text-ink/40">
                {article.readTime} {t("home.news.minRead")} ·{" "}
                {new Date(article.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
