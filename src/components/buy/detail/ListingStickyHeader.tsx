"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatInrFull } from "@/lib/buy/format";

interface ListingStickyHeaderProps {
  title: string;
  price: number;
  city: string;
  visible: boolean;
}

export function ListingStickyHeader({ title, price, city, visible }: ListingStickyHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-surface/95 shadow-nav backdrop-blur-md transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <Link href="/vehicles/buy/search" className="text-xs font-semibold text-sell-primary hover:underline">
            ← Back to search
          </Link>
          <p className="truncate font-semibold text-ink">{title}</p>
          <p className="text-xs text-ink/50">{city}</p>
        </div>
        <p className="shrink-0 font-mono text-lg font-bold text-sell-accent">{formatInrFull(price)}</p>
      </div>
    </header>
  );
}
