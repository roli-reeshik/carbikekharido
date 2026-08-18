"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vehicle } from "@/lib/vehicles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthGate } from "@/components/auth/AuthGateProvider";
import { INTENT_ACTIONS } from "@/lib/intent";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";
import { VehiclePhoto } from "@/components/home/VehiclePhoto";
import { formatLakh } from "@/lib/vehicles";
import { getVehicleIdentity } from "@/lib/liveMedia/identity";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { locale, t } = useLanguage();
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted(vehicle.id));
  }, [vehicle.id]);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(vehicle.id);
    setSaved(next.includes(vehicle.id));
  }

  function handleContactSeller(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(INTENT_ACTIONS.CONTACT_SELLER, () => setContactRevealed(true));
  }

  const identity = getVehicleIdentity(vehicle);
  const detailHref = vehicle.catalogModelId
    ? `/model?id=${encodeURIComponent(vehicle.catalogModelId)}`
    : vehicle.brand && vehicle.modelName
      ? `/model?brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(
          vehicle.modelName
        )}${vehicle.variantName ? `&variant=${encodeURIComponent(vehicle.variantName)}` : ""}`
      : `/model?id=${encodeURIComponent(vehicle.id)}`;

  const photo = (
    <VehiclePhoto
      searchTerm={vehicle.name.en}
      vehicleType={vehicle.type}
      bodyType={vehicle.bodyType}
      brand={vehicle.brand ?? identity?.brand}
      modelName={vehicle.modelName ?? identity?.model}
      officialImageUrl={vehicle.officialImageUrl}
      className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
    />
  );

  return (
    <div className="card group">
      <div className="relative">
        {detailHref ? <Link href={detailHref}>{photo}</Link> : photo}
        <button
          onClick={handleWishlist}
          aria-label={t("vehicle.addToWishlist")}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition ${
            saved ? "text-coral" : "text-ink/30 hover:text-coral"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>
        {vehicle.isElectric && (
          <span className="absolute left-3 top-3 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-white">
            EV
          </span>
        )}
        {vehicle.condition === "used" && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
            USED
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {detailHref ? (
              <Link href={detailHref}>
                <h3 className="truncate font-display text-base font-bold text-ink group-hover:text-highway">
                  {vehicle.name[locale]}
                </h3>
              </Link>
            ) : (
              <h3 className="truncate font-display text-base font-bold text-ink group-hover:text-highway">
                {vehicle.name[locale]}
              </h3>
            )}
            <p className="mt-0.5 text-xs text-ink/50">{vehicle.spec[locale]}</p>
          </div>
        </div>

        {vehicle.rating && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded bg-marigold/15 px-1.5 py-0.5 text-[10px] font-bold text-marigold-dark">
              ★ {vehicle.rating}
            </span>
            <span className="text-[10px] text-ink/40">
              ({vehicle.reviewCount?.toLocaleString()} {t("vehicle.reviews")})
            </span>
          </div>
        )}

        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-ink/40">
            {t("vehicle.onRoadPrice")} · {t("vehicle.inCity", { city: vehicle.city })}
          </p>
          {vehicle.priceOnRoad > 0 ? (
            <p className="font-mono text-lg font-bold text-highway">
              {formatLakh(vehicle.priceOnRoad)}
              {vehicle.priceRangeMax ? (
                <span className="text-sm font-normal text-ink/50"> - {formatLakh(vehicle.priceRangeMax)}</span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm font-semibold text-ink/50">Price on request</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {detailHref ? (
            <Link href={detailHref} className="btn-secondary flex-1 py-2 text-xs">
              {t("vehicle.viewDetails")}
            </Link>
          ) : (
            <button className="btn-secondary flex-1 py-2 text-xs">{t("vehicle.viewDetails")}</button>
          )}
          <button
            onClick={handleContactSeller}
            className="btn-primary flex-1 py-2 text-xs"
          >
            {contactRevealed ? "+91 98765 43210" : t("vehicle.contactSeller")}
          </button>
        </div>
      </div>
    </div>
  );
}
