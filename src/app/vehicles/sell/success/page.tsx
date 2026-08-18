"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const published = params.get("published") === "1";
  const listingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/vehicles/listing?id=${encodeURIComponent(id)}`
      : `/vehicles/listing?id=${encodeURIComponent(id)}`;

  const shareText = encodeURIComponent("Check out my vehicle listing on CarBikeKharido!");
  const waUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(listingUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(listingUrl)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sell-emerald/15 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-sell-primary">
        {published ? "Listing published!" : "Draft saved"}
      </h1>
      <p className="mt-2 text-sm text-ink/55">
        {published
          ? "Your vehicle is now live. Share it with buyers."
          : "You can finish and publish anytime from your drafts."}
      </p>

      {id && (
        <p className="mt-4 break-all rounded-lg bg-paper px-4 py-2 font-spec text-xs text-ink/60">{listingUrl}</p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {id && (
          <Link href={`/vehicles/listing?id=${encodeURIComponent(id)}`} className="btn-sell-secondary">
            View listing
          </Link>
        )}
        <Link href="/search?condition=used" className="btn-sell-ghost">
          Browse listings
        </Link>
      </div>

      {published && id && (
        <div className="mt-8 flex justify-center gap-3">
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-sell-ghost text-sm">
            Share WhatsApp
          </a>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="btn-sell-ghost text-sm">
            Share Twitter
          </a>
        </div>
      )}
    </div>
  );
}

export default function SellSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-ink/50">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
