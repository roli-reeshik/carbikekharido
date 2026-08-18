"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NEWS_ARTICLES } from "@/lib/homeContent";

export default function NewsArticlePage() {
  const { locale, t } = useLanguage();
  const params = useParams();
  const slug = params.slug as string;
  const article = NEWS_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-4xl">📰</p>
          <p className="mt-3 text-ink/50">{t("newsPage.notFound")}</p>
          <Link href="/news" className="btn-primary mt-6 inline-flex">
            {t("newsPage.backToNews")}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/news" className="text-sm font-medium text-highway hover:text-marigold">
          ← {t("newsPage.backToNews")}
        </Link>

        <span className="mt-6 inline-block rounded-full bg-marigold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marigold-dark">
          {article.tag[locale]}
        </span>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {article.title[locale]}
        </h1>

        <p className="mt-3 text-sm text-ink/50">
          {article.readTime} {t("home.news.minRead")} ·{" "}
          {new Date(article.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="mt-8 flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-highway/5 to-teal/10 text-6xl">
          📰
        </div>

        <div className="prose mt-8 space-y-4 text-base leading-relaxed text-ink/80">
          <p>{article.excerpt[locale]}</p>
          <p>
            {locale === "en"
              ? "This is a demo article. In production, full editorial content with images, expert reviews, and embedded comparison widgets would appear here — powered by the blog module (PRD Module 16)."
              : "यह एक डेमो लेख है। प्रोडक्शन में, छवियों, विशेषज्ञ समीक्षाओं और एम्बेडेड तुलना विजेट के साथ पूर्ण संपादकीय सामग्री यहाँ दिखाई देगी।"}
          </p>
          <p>
            {locale === "en"
              ? "CarBikeKharido's editorial team covers new launches, buying guides, maintenance tips, and in-depth reviews — all designed to help you make informed decisions without the hard sell."
              : "CarBikeKharido की संपादकीय टीम नए लॉन्च, खरीद गाइड, रखरखाव टिप्स और गहन समीक्षाएँ कवर करती है — सभी आपको बिना ज़बरदस्ती बिक्री के सूचित निर्णय लेने में मदद करने के लिए डिज़ाइन किए गए हैं।"}
          </p>
        </div>
      </article>
    </SiteLayout>
  );
}
