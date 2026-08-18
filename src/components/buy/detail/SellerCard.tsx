"use client";

import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/auth/AuthGateProvider";
import { memberSinceLabel, MarketplaceListingDetail } from "@/lib/buy/listingDetail";
import { isMpWishlisted, toggleMpWishlist } from "@/lib/buy/wishlist";
import { INTENT_ACTIONS } from "@/lib/intent";

interface SellerCardProps {
  listing: MarketplaceListingDetail;
  onReport: () => void;
}

export function SellerCard({ listing, onReport }: SellerCardProps) {
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const seller = listing.seller;
  const name = seller.dealerName || seller.contact.name || "Seller";

  useEffect(() => {
    setSaved(isMpWishlisted(listing.listingId));
  }, [listing.listingId]);

  function revealContact(cb: () => void) {
    requireAuth(INTENT_ACTIONS.CONTACT_SELLER, () => {
      setPhoneRevealed(true);
      cb();
    });
  }

  function handleCall() {
    revealContact(() => {
      if (seller.contact.phoneMasked) {
        window.location.href = `tel:${seller.contact.phoneMasked.replace(/\*/g, "")}`;
      }
    });
  }

  function handleWhatsApp() {
    revealContact(() => {
      const text = encodeURIComponent(
        `Hi, I'm interested in your ${listing.brand} ${listing.model} listing on CarBikeKharido.`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    });
  }

  function handleEmail() {
    revealContact(() => {
      window.location.href = `mailto:?subject=${encodeURIComponent(`Inquiry: ${listing.brand} ${listing.model}`)}`;
    });
  }

  function handleWishlist() {
    const next = toggleMpWishlist(listing.listingId);
    setSaved(next.includes(listing.listingId));
  }

  return (
    <aside className="listing-seller-card rounded-xl border border-line bg-surface p-5 shadow-card" aria-label="Seller information">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sell-primary/10 text-lg font-bold text-sell-primary">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{name}</h3>
          <p className="text-xs capitalize text-ink/50">{seller.sellerType.toLowerCase()} seller</p>
          {seller.contact.phoneVerified && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sell-emerald">
              ✓ Verified seller
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono text-lg font-bold text-ink">{seller.ratings.toFixed(1)}</span>
        <span className="text-sm text-ink/50">/ 5</span>
        <span className="text-xs text-ink/45">({seller.totalReviews} reviews)</span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-ink/70" aria-label="Verification status">
        <li className="flex items-center gap-2">
          <span className={seller.contact.phoneVerified ? "text-sell-emerald" : "text-ink/30"}>
            {seller.contact.phoneVerified ? "✓" : "○"}
          </span>
          Phone {seller.contact.phoneVerified ? "verified" : "unverified"}
        </li>
        <li className="flex items-center gap-2">
          <span className={seller.contact.emailVerified ? "text-sell-emerald" : "text-ink/30"}>
            {seller.contact.emailVerified ? "✓" : "○"}
          </span>
          Email {seller.contact.emailVerified ? "verified" : "not provided"}
        </li>
        <li className="flex items-center gap-2">
          <span className={seller.contact.phoneVerified ? "text-sell-emerald" : "text-ink/30"}>
            {seller.contact.phoneVerified ? "✓" : "○"}
          </span>
          ID verified
        </li>
      </ul>

      <p className="mt-3 text-xs text-ink/50">{memberSinceLabel(seller.memberSince)}</p>
      <p className="text-xs text-ink/50">Avg response time: {seller.avgResponseMinutes} minutes</p>

      {phoneRevealed && seller.contact.phoneMasked && (
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 font-mono text-sm text-ink">{seller.contact.phoneMasked}</p>
      )}

      <div className="mt-5 space-y-2">
        {listing.contactChannels.call && (
          <button type="button" onClick={handleCall} className="btn-buy-primary w-full">
            📞 Call seller
          </button>
        )}
        {listing.contactChannels.whatsapp && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            WhatsApp
          </button>
        )}
        {listing.contactChannels.email && (
          <button type="button" onClick={handleEmail} className="btn-buy-ghost w-full">
            ✉ Email
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={handleWishlist}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            saved ? "border-coral/40 bg-coral/5 text-coral" : "border-line text-ink/70 hover:bg-paper"
          }`}
          aria-pressed={saved}
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        <button
          type="button"
          onClick={onReport}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink/60 hover:bg-paper"
        >
          🚩 Report
        </button>
      </div>
    </aside>
  );
}
