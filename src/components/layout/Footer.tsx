"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  const sections = [
    {
      title: t("footer.explore"),
      links: [
        { href: "/search?type=car", label: t("nav.cars") },
        { href: "/search?type=bike", label: t("nav.bikes") },
        { href: "/search?condition=used", label: t("footer.usedVehicles") },
        { href: "/search?fuel=electric", label: t("footer.electric") },
        { href: "/search?upcoming=true", label: t("footer.upcoming") },
      ],
    },
    {
      title: t("footer.tools"),
      links: [
        { href: "/rider-fit", label: t("nav.riderFit") },
        { href: "/ownership-cost", label: t("nav.ownershipCost") },
        { href: "/compare", label: t("nav.compare") },
        { href: "/emi-calculator", label: t("nav.emi") },
        { href: "/news", label: t("nav.news") },
        { href: "/wishlist", label: t("nav.wishlist") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/about", label: t("footer.about") || "About Us" },
        { href: "/careers", label: t("footer.careers") || "Careers" },
        { href: "/contact", label: t("footer.contact") || "Contact Support" },
        { href: "/privacy", label: t("footer.privacy") || "Privacy Policy" },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-highway text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marigold">
                <span className="font-mono text-sm font-bold text-highway">CK</span>
              </div>
              <span className="font-display text-xl font-bold tracking-wide">
                CarBike<span className="text-marigold">Kharido</span>.Com
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{t("footer.tagline")}</p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-marigold">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} prefetch={true} className="text-sm text-white/60 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CarBikeKharido.com. {t("footer.rights")}
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <Link href="/terms" prefetch={true} className="hover:text-white/70">
              {t("footer.terms") || "Terms of Service"}
            </Link>
            <Link href="/privacy" prefetch={true} className="hover:text-white/70">
              {t("footer.privacy") || "Privacy Policy"}
            </Link>
            <Link href="/contact" prefetch={true} className="hover:text-white/70">
              Help &amp; Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
