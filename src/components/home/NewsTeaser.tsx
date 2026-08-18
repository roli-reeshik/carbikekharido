"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NEWS_ARTICLES } from "@/lib/homeContent";

export function NewsTeaser() {
  const { locale, t } = useLanguage();
  const articles = NEWS_ARTICLES.slice(0, 3);

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="section-title">{t("home.news.title")}</h2>
          <p className="section-subtitle">{t("home.news.subtitle")}</p>
        </div>
        <Link href="/news" className="text-sm font-semibold text-highway hover:text-marigold">
          {t("home.news.viewAll")} →
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="card group p-5"
          >
            <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-highway/5 to-teal/5 text-4xl">
              📰
            </div>
            <span className="mt-4 inline-block rounded-full bg-marigold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-marigold-dark">
              {article.tag[locale]}
            </span>
            <h3 className="mt-2 font-display text-sm font-bold leading-snug text-ink group-hover:text-highway sm:text-base">
              {article.title[locale]}
            </h3>
            <p className="mt-2 text-xs text-ink/50">
              {article.readTime} {t("home.news.minRead")} · {new Date(article.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
