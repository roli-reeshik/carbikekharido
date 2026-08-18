"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ListingFeaturePills } from "@/components/buy/detail/ListingFeaturePills";
import { ListingGallery } from "@/components/buy/detail/ListingGallery";
import { ListingSpecs } from "@/components/buy/detail/ListingSpecs";
import { ListingStickyHeader } from "@/components/buy/detail/ListingStickyHeader";
import { ReportListingModal } from "@/components/buy/detail/ReportListingModal";
import { SellerCard } from "@/components/buy/detail/SellerCard";
import { ShareButtons } from "@/components/buy/detail/ShareButtons";
import { SimilarListings } from "@/components/buy/detail/SimilarListings";
import { formatInrFull, formatFuel, formatMileage, formatTransmission } from "@/lib/buy/format";
import { listingPageTitle, MarketplaceListingDetail } from "@/lib/buy/listingDetail";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [listing, setListing] = useState<MarketplaceListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/vehicles/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: { listing: MarketplaceListingDetail } }) => {
        if (json.ok && json.data?.listing) setListing(json.data.listing);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [listing]);

  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
          <div className="aspect-[3/2] max-h-[400px] rounded-xl bg-line/70" />
          <div className="mt-6 h-8 w-2/3 rounded bg-line/70" />
          <div className="mt-3 h-6 w-1/4 rounded bg-line/60" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !listing) {
    return (
      <SiteLayout>
        <div className="py-20 text-center">
          <p className="text-ink/50">Listing not found or no longer available.</p>
          <Link href="/vehicles/buy/search" className="btn-buy-primary mt-4 inline-block">
            Browse listings
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const title = listingPageTitle(listing);
  const price = Number(listing.askingPrice);
  const description = (listing.description ?? "").slice(0, 1000);

  return (
    <SiteLayout>
      <ListingStickyHeader title={title} price={price} city={listing.city} visible={stickyVisible} />

      <article className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <nav className="mb-4 text-sm text-ink/50" aria-label="Breadcrumb">
          <Link href="/vehicles/buy" className="hover:text-sell-primary">
            Buy
          </Link>
          <span className="mx-2">/</span>
          <Link href="/vehicles/buy/search" className="hover:text-sell-primary">
            Search
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink/70">{listing.brand} {listing.model}</span>
        </nav>

        <div ref={heroRef} className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
          <div className="min-w-0 space-y-8">
            <ListingGallery images={listing.images} title={title} />

            <header>
              <div className="flex flex-wrap items-center gap-2">
                {listing.seller.contact.phoneVerified && (
                  <span className="rounded-full bg-sell-emerald/15 px-2 py-0.5 text-xs font-bold uppercase text-sell-emerald">
                    Verified
                  </span>
                )}
                {listing.priceNegotiable && (
                  <span className="rounded-full bg-marigold/15 px-2 py-0.5 text-xs font-semibold text-marigold-dark">
                    Negotiable
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
              <p className="mt-2 font-mono text-2xl font-bold text-sell-accent sm:text-3xl">{formatInrFull(price)}</p>
              <p className="mt-1 text-sm text-ink/55">
                {listing.city}, {listing.state} ·{" "}
                {[listing.yearOfManufacture, formatMileage(listing.currentMileage), formatFuel(listing.fuelType), formatTransmission(listing.transmission)].join(" • ")}
              </p>
              <div className="mt-4">
                <ShareButtons url={shareUrl || `https://carbikekharido.com/vehicles/buy/${id}`} title={title} />
              </div>
            </header>

            <ListingSpecs listing={listing} />
            <ListingFeaturePills listing={listing} />

            {description && (
              <section aria-labelledby="description-heading">
                <h2 id="description-heading" className="font-display text-xl font-bold text-ink">
                  Seller&apos;s comments
                </h2>
                <p className="listing-detail-desc mt-3 text-sm leading-relaxed text-ink/75">{description}</p>
              </section>
            )}

            <SimilarListings listingId={listing.listingId} />
          </div>

          <div className="lg:order-none">
            <SellerCard listing={listing} onReport={() => setReportOpen(true)} />
          </div>
        </div>
      </article>

      <ReportListingModal listingId={listing.listingId} open={reportOpen} onClose={() => setReportOpen(false)} />
    </SiteLayout>
  );
}
