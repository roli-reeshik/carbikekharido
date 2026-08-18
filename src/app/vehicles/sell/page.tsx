"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSellListing } from "@/lib/sell/SellListingProvider";
import { SellStep } from "@/lib/sell/types";
import Step1Details from "./step-1-details";
import Step2Media from "./step-2-media";
import Step3SellerInfo from "./step-3-seller-info";
import Step4Review from "./step-4-review";

const STEPS: { n: SellStep; label: string }[] = [
  { n: 1, label: "Details" },
  { n: 2, label: "Photos" },
  { n: 3, label: "Seller" },
  { n: 4, label: "Review" },
];

export default function SellListingPage() {
  const router = useRouter();
  const { step, setStep, saveDraft, dirty, lastSaved } = useSellListing();
  const [exitOpen, setExitOpen] = useState(false);

  const handleExit = useCallback(() => {
    if (dirty) setExitOpen(true);
    else router.push("/");
  }, [dirty, router]);

  return (
    <>
      {/* Top bar with progress */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-sell-primary">
            ← CarBikeKharido
          </Link>
          <p className="hidden text-xs text-ink/45 sm:block">
            {lastSaved ? `Draft saved ${lastSaved.toLocaleTimeString()}` : "Sell your vehicle"}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={saveDraft} className="btn-sell-ghost hidden sm:inline-flex">
              Save draft
            </button>
            <button type="button" onClick={handleExit} className="btn-sell-ghost">
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <nav aria-label="Listing steps" className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
          <ol className="flex gap-1">
            {STEPS.map(({ n, label }) => {
              const active = step === n;
              const done = step > n;
              return (
                <li key={n} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setStep(n)}
                    className={`w-full rounded-lg px-2 py-2 text-center text-xs font-medium transition sm:text-sm ${
                      active
                        ? "bg-sell-primary text-white shadow-sm"
                        : done
                          ? "bg-sell-emerald/15 text-sell-emerald"
                          : "bg-paper text-ink/45 hover:bg-line/50"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className="hidden sm:inline">{n}. </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-sell-accent transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={4}
            />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {step === 1 && <Step1Details />}
        {step === 2 && <Step2Media />}
        {step === 3 && <Step3SellerInfo />}
        {step === 4 && <Step4Review />}
      </main>

      {/* Exit confirmation */}
      {exitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-sell-primary">Leave without saving?</h2>
            <p className="mt-2 text-sm text-ink/60">
              You have unsaved changes. Save a draft or discard and exit.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-sell-secondary flex-1"
                onClick={() => {
                  saveDraft();
                  setExitOpen(false);
                  router.push("/");
                }}
              >
                Save & exit
              </button>
              <button
                type="button"
                className="btn-sell-ghost flex-1"
                onClick={() => {
                  setExitOpen(false);
                  router.push("/");
                }}
              >
                Discard
              </button>
              <button type="button" className="btn-sell-ghost w-full" onClick={() => setExitOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
