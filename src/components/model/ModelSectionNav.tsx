"use client";

import { useEffect, useRef, useState } from "react";

export interface ModelSectionTab {
  id: string;
  label: string;
  hasDropdown?: boolean;
}

interface Props {
  tabs: ModelSectionTab[];
  /** Short model name shown as the first tab (CarDekho style). */
  modelLabel: string;
}

/**
 * Sticky horizontal section nav matching CarDekho's model page pattern:
 * uppercase labels, marigold underline on the active section, smooth scroll.
 */
export function ModelSectionNav({ tabs, modelLabel }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? "overview");
  const barRef = useRef<HTMLDivElement>(null);
  const clicking = useRef(false);

  useEffect(() => {
    const ids = tabs.map((t) => t.id);
    const observer = new IntersectionObserver(
      (entries) => {
        if (clicking.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      {
        // Account for sticky nav (~52px) + site header
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0, 0.25, 0.5],
      }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [tabs]);

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    clicking.current = true;
    setActive(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top, behavior: "smooth" });
    window.setTimeout(() => {
      clicking.current = false;
    }, 700);

    // Keep the clicked tab in view inside the horizontal scroller
    const btn = barRef.current?.querySelector(`[data-tab="${id}"]`) as HTMLElement | null;
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div className="sticky top-16 z-30 border-b border-line/80 bg-surface/95 shadow-sm backdrop-blur-md">
      <div
        ref={barRef}
        className="scrollbar-hide mx-auto flex max-w-7xl gap-0 overflow-x-auto px-2 sm:px-4"
        role="tablist"
        aria-label="Model sections"
      >
        {tabs.map((tab) => {
          const label = tab.id === "overview" ? modelLabel : tab.label;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab={tab.id}
              aria-selected={isActive}
              onClick={() => goTo(tab.id)}
              className={`relative shrink-0 px-3 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] transition sm:px-4 sm:text-xs ${
                isActive ? "text-marigold-dark" : "text-ink/55 hover:text-ink/80"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {label}
                {tab.hasDropdown && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 opacity-60" fill="currentColor" aria-hidden>
                    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </span>
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-marigold" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
