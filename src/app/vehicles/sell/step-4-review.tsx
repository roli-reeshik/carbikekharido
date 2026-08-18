"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSellListing } from "@/lib/sell/SellListingProvider";
import { clearDraftStorage } from "@/lib/sell/draftStorage";
import { FieldErrorsSummary, FormSection } from "@/lib/sell/components/FormField";
import { formatLakh } from "@/lib/vehicles";
import { getAuthToken } from "@/lib/session";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 py-2 text-sm last:border-0">
      <span className="text-ink/50">{label}</span>
      <span className="font-spec font-medium text-ink">{value}</span>
    </div>
  );
}

export default function Step4Review() {
  const router = useRouter();
  const { draft, errors, setField, setStep, goBack, setPublishing, publishing, resetDraft } = useSellListing();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [carousel, setCarousel] = useState(0);

  const photos = draft.media.filter((m) => m.type === "photo");
  const price = Number(draft.askingPrice.replace(/,/g, ""));

  async function submit(publish: boolean) {
    setSubmitError(null);
    if (publish && !draft.termsAccepted) {
      setSubmitError("Please accept the terms to publish");
      return;
    }
    setPublishing(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/vehicles/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          publish,
          draft,
          media: draft.media.map((m, order) => ({
            dataUrl: m.previewUrl,
            type: m.type,
            order,
            isThumb: m.isThumb,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Publish failed");

      clearDraftStorage();
      resetDraft();
      router.push(
        `/vehicles/sell/success?id=${encodeURIComponent(json.data.listingId)}&published=${publish ? "1" : "0"}`
      );
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-sell-primary">Review & publish</h1>
        <p className="mt-1 text-sm text-ink/55">Check everything looks correct before going live.</p>
      </div>

      <FieldErrorsSummary errors={errors} />
      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      )}

      {/* Listing preview card */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="relative aspect-video bg-paper">
          {photos[carousel] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[carousel].previewUrl} alt="" className="h-full w-full object-cover" />
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white"
                onClick={() => setCarousel((c) => (c - 1 + photos.length) % photos.length)}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white"
                onClick={() => setCarousel((c) => (c + 1) % photos.length)}
              >
                ›
              </button>
            </>
          )}
        </div>
        <div className="p-5">
          <h2 className="font-display text-xl font-bold text-sell-primary">
            {draft.brand} {draft.model}
          </h2>
          <p className="mt-1 font-mono text-2xl font-bold text-sell-accent">
            {price ? formatLakh(price) : "—"}
            {draft.priceNegotiable ? <span className="text-sm font-normal text-ink/45"> · Negotiable</span> : null}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            {draft.yearOfManufacture} · {draft.currentMileage} km · {draft.city}
          </p>
        </div>
      </div>

      <FormSection title="Vehicle details">
        <button type="button" className="float-right text-xs text-sell-accent" onClick={() => setStep(1)}>
          ✎ Edit
        </button>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <SpecRow label="Registration" value={draft.registrationNumber || "—"} />
          <SpecRow label="Body type" value={draft.bodyType || "—"} />
          <SpecRow label="Fuel" value={draft.fuelType} />
          <SpecRow label="Transmission" value={draft.transmission} />
          <SpecRow label="Engine" value={draft.engineCC ? `${draft.engineCC} cc` : "—"} />
          <SpecRow label="Owner" value={draft.ownerType} />
          <SpecRow label="Condition" value={draft.condition} />
          <SpecRow label="Insurance" value={draft.insuranceValid ? "Valid" : "Expired"} />
        </div>
      </FormSection>

      <FormSection title="Photos">
        <button type="button" className="float-right text-xs text-sell-accent" onClick={() => setStep(2)}>
          ✎ Edit
        </button>
        <p className="text-sm text-ink/60">{photos.length} photos · {draft.media.filter((m) => m.type === "video").length} videos</p>
      </FormSection>

      <FormSection title="Seller">
        <button type="button" className="float-right text-xs text-sell-accent" onClick={() => setStep(3)}>
          ✎ Edit
        </button>
        <div className="rounded-lg bg-paper p-4">
          <p className="font-semibold text-ink">{draft.sellerName}</p>
          <p className="text-sm text-ink/55">+91 {draft.phone} {draft.phoneVerified ? "✓" : ""}</p>
          {draft.email && <p className="text-sm text-ink/55">{draft.email}</p>}
          <p className="mt-2 text-xs uppercase tracking-wider text-ink/40">
            {draft.sellerType === "DEALER" ? `Dealer · ${draft.dealerName}` : "Individual seller"}
          </p>
        </div>
      </FormSection>

      <label className="flex items-start gap-3 rounded-lg border border-line p-4">
        <input
          type="checkbox"
          checked={draft.termsAccepted}
          onChange={(e) => setField("termsAccepted", e.target.checked)}
          className="mt-1 h-4 w-4 rounded"
        />
        <span className="text-sm text-ink/70">
          I confirm the information is accurate and agree to CarBikeKharido&apos;s listing terms and privacy policy.
        </span>
      </label>
      {errors.termsAccepted && <p className="text-xs text-red-600">{errors.termsAccepted}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={goBack} className="btn-sell-ghost">
          ← Back
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-sell-ghost"
            disabled={publishing}
            onClick={() => void submit(false)}
          >
            Save as draft
          </button>
          <button
            type="button"
            className="btn-sell-primary"
            disabled={publishing || !draft.termsAccepted}
            onClick={() => void submit(true)}
          >
            {publishing ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
