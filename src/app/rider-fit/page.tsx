"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FitCard } from "@/components/riderFit/FitCard";
import type { FitResult, RidingExperience, RidingIntent } from "@/lib/riderFit/types";

interface FitResponse {
  results: FitResult[];
  assumptions: { notes: string[]; inseamEstimated: boolean };
  candidatesConsidered: number;
  unscorable: number;
  excludedUnreviewed: number;
  excludedNoPrice: number;
}

const EXPERIENCE: { value: RidingExperience; label: string }[] = [
  { value: "beginner", label: "First bike" },
  { value: "returning", label: "Coming back to it" },
  { value: "experienced", label: "Experienced" },
];

const INTENT: { value: RidingIntent; label: string }[] = [
  { value: "commute", label: "Daily commute" },
  { value: "touring", label: "Long rides" },
  { value: "sport", label: "Spirited riding" },
  { value: "adventure", label: "Rough roads" },
  { value: "leisure", label: "Weekend cruising" },
];

/** Feet-and-inches label for a height in cm, since most riders think that way. */
function heightLabel(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return inches === 12 ? `${feet + 1}'0"` : `${feet}'${inches}"`;
}

export default function RiderFitPage() {
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [inseamCm, setInseamCm] = useState<number | "">("");
  const [experience, setExperience] = useState<RidingExperience>("returning");
  const [intent, setIntent] = useState<RidingIntent>("commute");
  const [maxPriceInr, setMaxPriceInr] = useState(300000);

  const [data, setData] = useState<FitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFit = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      heightCm: String(heightCm),
      weightKg: String(weightKg),
      experience,
      intent,
      maxPriceInr: String(maxPriceInr),
      limit: "12",
    });
    if (inseamCm !== "") params.set("inseamCm", String(inseamCm));

    try {
      const res = await fetch(`/api/rider-fit?${params}`);
      const body = await res.json();
      if (!body.ok) throw new Error(body.error?.message ?? "Could not work out your fit");
      setData(body.data as FitResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [heightCm, weightKg, inseamCm, experience, intent, maxPriceInr]);

  // Debounced so dragging a slider does not fire a request per pixel.
  useEffect(() => {
    const timer = setTimeout(fetchFit, 350);
    return () => clearTimeout(timer);
  }, [fetchFit]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Will this bike actually fit you?
          </h1>
          <p className="mt-2 text-ink/60">
            Seat height in millimetres means nothing until you compare it to your own legs. Tell us
            your height and we will work out which bikes you can get both feet down on — and which
            ones will leave you on tiptoe at every traffic light.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit space-y-6 rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-6">
            <Slider
              label="Your height"
              value={heightCm}
              min={140}
              max={200}
              step={1}
              onChange={setHeightCm}
              display={`${heightCm} cm · ${heightLabel(heightCm)}`}
            />

            <Slider
              label="Your weight"
              value={weightKg}
              min={40}
              max={140}
              step={1}
              onChange={setWeightKg}
              display={`${weightKg} kg`}
            />

            <div>
              <label className="block text-sm font-medium text-ink/70" htmlFor="inseam">
                Inseam <span className="text-ink/40">(optional, most accurate)</span>
              </label>
              <input
                id="inseam"
                type="number"
                min={50}
                max={120}
                placeholder={`Estimated ${Math.round(heightCm * 0.46)} cm`}
                value={inseamCm}
                onChange={(e) => setInseamCm(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-teal"
              />
              <p className="mt-1 text-xs text-ink/40">
                Measure from your crotch to the floor, barefoot.
              </p>
            </div>

            <Choice
              label="Riding experience"
              options={EXPERIENCE}
              value={experience}
              onChange={setExperience}
            />

            <Choice label="Mostly for" options={INTENT} value={intent} onChange={setIntent} />

            <Slider
              label="Budget"
              value={maxPriceInr}
              min={50000}
              max={2000000}
              step={10000}
              onChange={setMaxPriceInr}
              display={`Up to ₹${(maxPriceInr / 100000).toFixed(1)} lakh`}
            />
          </aside>

          <section>
            {error ? (
              <div className="rounded-3xl border border-coral/30 bg-coral/5 p-6 text-coral">
                {error}
              </div>
            ) : null}

            {data ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-ink/60">
                    {data.results.length} of {data.candidatesConsidered} bikes that fit you
                  </p>
                  {loading ? <span className="text-xs text-ink/40">Updating…</span> : null}
                </div>

                {data.results.length === 0 ? (
                  <div className="mt-4 rounded-3xl border border-line bg-surface p-8 text-center">
                    <p className="font-medium text-ink">Nothing fits inside that budget.</p>
                    <p className="mt-1 text-sm text-ink/60">
                      Try raising the budget, or widen what you plan to use the bike for.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {data.results.map((result) => (
                      <FitCard key={result.bike.modelId} result={result} />
                    ))}
                  </div>
                )}

                <footer className="mt-6 rounded-3xl border border-line bg-line/20 p-5 text-xs text-ink/50">
                  <p className="font-semibold text-ink/70">How we work this out</p>
                  <ul className="mt-2 space-y-1">
                    {data.assumptions.notes.map((note) => (
                      <li key={note}>· {note}</li>
                    ))}
                    <li>
                      · {data.unscorable} models are left out because the manufacturer does not
                      publish a seat height or kerb weight.
                    </li>
                    {data.excludedNoPrice > 0 ? (
                      <li>
                        · {data.excludedNoPrice} more have no published price, so we cannot say
                        whether they clear your budget.
                      </li>
                    ) : null}
                  </ul>
                  <p className="mt-3">
                    These are estimates. Nothing replaces sitting on the bike, and a showroom will
                    let you do that for free.
                  </p>
                </footer>
              </>
            ) : (
              <div className="rounded-3xl border border-line bg-surface p-8 text-ink/50">
                Working out your fit…
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-ink/70">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-teal"
        aria-label={label}
      />
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-ink/70">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              value === option.value
                ? "bg-highway text-white"
                : "border border-line text-ink/60 hover:border-highway/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
