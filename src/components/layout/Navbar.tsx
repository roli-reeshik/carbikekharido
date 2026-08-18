"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useStartupAuth } from "@/components/auth/StartupLoginGate";
import { CITIES } from "@/lib/homeContent";

export function Navbar() {
  const { t } = useLanguage();
  const { isAuthenticated, logout } = useStartupAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [city, setCity] = useState(CITIES[0]);

  const navLinks = [
    { href: "/search?type=car", label: t("nav.cars") },
    { href: "/search?type=bike", label: t("nav.bikes") },
    { href: "/rider-fit", label: t("nav.riderFit") },
    { href: "/ownership-cost", label: t("nav.ownershipCost") },
    { href: "/compare", label: t("nav.compare") },
    { href: "/news", label: t("nav.news") },
    { href: "/emi-calculator", label: t("nav.emi") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-line/60 bg-surface/95 shadow-nav backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" prefetch={true} className="flex shrink-0 items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-highway border border-highway/20 shadow-sm group-hover:border-marigold group-hover:bg-highway-dark transition duration-300">
            <span className="font-mono text-xs font-black text-white tracking-tighter">CK</span>
          </div>
          <span className="cinematic-logo-enter inline-block whitespace-nowrap font-display text-base font-black uppercase tracking-[0.25em] text-highway dark:text-white select-none drop-shadow-sm">
            CARBIKE<span className="text-marigold font-black">KHARIDO</span><span className="text-marigold font-mono text-xs ml-0.5">.COM</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-paper hover:text-highway active:scale-95"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="hidden rounded-lg border border-line bg-paper px-2 py-1.5 text-xs font-medium text-ink sm:block cursor-pointer"
            aria-label={t("nav.selectCity")}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <LanguageToggle />

          <Link
            href="/wishlist"
            prefetch={true}
            className="rounded-lg p-2 text-ink/60 transition hover:bg-paper hover:text-coral active:scale-95"
            aria-label={t("nav.wishlist")}
            title="View Wishlist"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </Link>

          {/* Floating Search Overlay Trigger */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-immersive-search"));
              }
            }}
            className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/80 transition hover:border-highway hover:text-highway hover:shadow-sm active:scale-95"
            aria-label="Open Search"
          >
            <svg className="h-4 w-4 text-marigold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline rounded bg-surface px-1.5 py-0.5 text-[9px] font-mono text-ink/50 border border-line">⌘K</kbd>
          </button>

          <Link href="/vehicles/sell" prefetch={true} className="btn-secondary hidden text-xs sm:inline-flex active:scale-95">
            {t("nav.sell")}
          </Link>

          {/* Admin User Badge */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] font-bold uppercase text-ink/70">Admin Mode</span>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-ink/70 hover:bg-paper lg:hidden active:scale-95"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-paper active:scale-98"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-paper active:scale-98"
            >
              {t("nav.wishlist")}
            </Link>
            <Link
              href="/vehicles/sell"
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-highway font-bold hover:bg-paper active:scale-98"
            >
              {t("nav.sell")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
