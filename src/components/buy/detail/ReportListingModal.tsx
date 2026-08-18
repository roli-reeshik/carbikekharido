"use client";

import { useState } from "react";

interface ReportListingModalProps {
  listingId: string;
  open: boolean;
  onClose: () => void;
}

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "fraud", label: "Suspected fraud" },
  { value: "wrong_info", label: "Wrong vehicle information" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "other", label: "Other" },
] as const;

export function ReportListingModal({ listingId, open, onClose }: ReportListingModalProps) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${encodeURIComponent(listingId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.slice(0, 1000) }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to submit report");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setDone(false);
    setDetails("");
    setReason("spam");
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-2xl sm:rounded-2xl">
        {done ? (
          <div className="text-center">
            <p className="text-3xl">✓</p>
            <h2 id="report-title" className="mt-2 font-display text-lg font-bold text-ink">
              Report submitted
            </h2>
            <p className="mt-2 text-sm text-ink/55">Thank you. Our team will review this listing.</p>
            <button type="button" onClick={handleClose} className="btn-buy-primary mt-6 w-full">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="report-title" className="font-display text-lg font-bold text-ink">
              Report listing
            </h2>
            <p className="mt-1 text-sm text-ink/55">Tell us what&apos;s wrong with this listing.</p>

            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Reason</legend>
              {REASONS.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="text-sell-accent"
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>

            <label className="mt-4 block text-sm font-medium text-ink/70" htmlFor="report-details">
              Additional details (optional)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
              rows={4}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sell-accent"
              placeholder="Describe the issue…"
            />
            <p className="mt-1 text-right text-xs text-ink/40">{details.length}/1000</p>

            {error && <p className="mt-2 text-sm text-coral">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleClose} className="btn-buy-ghost flex-1">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-buy-primary flex-1 disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
