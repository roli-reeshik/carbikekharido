"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useVehicleImages } from "@/lib/hooks/useVehicleImages";
import { Vehicle, formatLakh } from "@/lib/vehicles";
import { VehicleIllustration } from "./VehicleIllustration";

const ROTATE_MS = 4200;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function detailHref(v: Vehicle): string {
  return v.catalogModelId
    ? `/model?id=${encodeURIComponent(v.catalogModelId)}`
    : `/search?q=${encodeURIComponent(v.name.en)}`;
}

export function HeroShowcase({ vehicles }: { vehicles: Vehicle[] }) {
  const { locale, t } = useLanguage();
  const reducedMotion = usePrefersReducedMotion();
  const { images, ready } = useVehicleImages(vehicles);

  /** Held together so advancing is one atomic, pure update. */
  const [slide, setSlide] = useState({ active: 0, previous: -1 });
  const { active, previous } = slide;
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setSlide((s) => (next === s.active ? s : { active: next, previous: s.active }));
  }, []);

  // Reset when the vehicle set changes (car/bike toggle).
  const setKey = vehicles.map((v) => v.id).join(",");
  useEffect(() => {
    setSlide({ active: 0, previous: -1 });
  }, [setKey]);

  const shouldRotate = ready && !paused && !reducedMotion && vehicles.length > 1;

  useEffect(() => {
    if (!shouldRotate) return;
    const id = window.setTimeout(
      () => go((active + 1) % vehicles.length),
      ROTATE_MS
    );
    return () => window.clearTimeout(id);
  }, [shouldRotate, active, vehicles.length, go]);

  if (vehicles.length === 0) return null;
  const current = vehicles[active];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(245,166,35,0.28), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-marigold px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-highway">
            {t("home.hero.featured")}
          </span>
          {current.rating ? (
            <span className="font-mono text-xs text-white/60">
              ★ {current.rating}
              {current.reviewCount ? ` (${current.reviewCount.toLocaleString()})` : ""}
            </span>
          ) : null}
        </div>

        {/* ---------------- Stage ---------------- */}
        <div
          className="relative mt-4 h-44 overflow-hidden rounded-2xl bg-gradient-to-b from-white to-paper"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Ground shadow travels with the vehicle */}
          <div
            key={`shadow-${active}`}
            className="showcase-shadow pointer-events-none absolute bottom-4 left-1/2 h-3 w-40 -translate-x-1/2 rounded-[50%] bg-ink/20 blur-md"
            aria-hidden
          />

          {vehicles.map((v, i) => {
            const url = images[v.id];
            const state =
              i === active ? "is-active" : i === previous ? "is-exiting" : "is-waiting";
            return (
              <div
                key={v.id}
                className={`showcase-slide ${state}`}
                aria-hidden={i !== active}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={v.name.en}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                ) : ready ? (
                  <VehicleIllustration
                    vehicleType={v.type}
                    bodyType={v.bodyType}
                    className="h-full w-full"
                  />
                ) : null}
              </div>
            );
          })}

          {!ready && (
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-line" aria-hidden />
          )}
        </div>

        {/* ---------------- Caption ---------------- */}
        <Link href={detailHref(current)} className="group mt-4 block">
          <div key={`caption-${active}`} className="showcase-caption">
            <p className="truncate font-display text-xl font-bold leading-tight text-white">
              {current.name[locale]}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/45">{current.spec[locale]}</p>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {t("home.hero.startingAt")}
              </p>
              <p key={`price-${active}`} className="showcase-caption font-mono text-lg font-bold text-marigold">
                {current.priceOnRoad > 0 ? formatLakh(current.priceOnRoad) : "—"}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition group-hover:bg-marigold group-hover:text-highway">
              {t("vehicle.viewDetails")} →
            </span>
          </div>
        </Link>

        {/* ---------------- Controls ---------------- */}
        <div className="mt-4 flex items-center gap-2">
          {vehicles.map((v, i) => (
            <button
              key={v.id}
              onClick={() => go(i)}
              aria-label={v.name.en}
              aria-current={i === active ? "true" : undefined}
              className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/15 transition hover:bg-white/25"
            >
              <span
                key={`bar-${active}-${paused}`}
                className={
                  i === active
                    ? shouldRotate
                      ? "showcase-progress absolute inset-y-0 left-0 bg-marigold"
                      : "absolute inset-0 bg-marigold"
                    : "absolute inset-0 w-0 bg-marigold"
                }
                style={shouldRotate && i === active ? { animationDuration: `${ROTATE_MS}ms` } : undefined}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
