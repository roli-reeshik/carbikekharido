"use client";

import { useEffect, useRef, useState } from "react";
import type { BikeSpecSummary } from "@/lib/ownership/service";

/**
 * Typeahead limited to models the cost engine can actually price, so a rider
 * never picks a bike only to be told it cannot be costed.
 */
export function BikePicker({
  onPick,
  disabled,
}: {
  onPick: (bike: BikeSpecSummary) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<BikeSpecSummary[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/bike-specs/search?q=${encodeURIComponent(query)}&costableOnly=true&limit=8`,
          { signal: controller.signal }
        );
        const body = await res.json();
        if (body.ok) setOptions(body.data.results as BikeSpecSummary[]);
      } catch {
        // An aborted keystroke is not an error worth showing.
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="search"
        value={query}
        disabled={disabled}
        placeholder={disabled ? "Remove one to add another" : "Add a bike to compare…"}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal disabled:opacity-50"
      />

      {open && options.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface shadow-lg">
          {options.map((option) => (
            <li key={option.modelId}>
              <button
                type="button"
                onClick={() => {
                  onPick(option);
                  setQuery("");
                  setOptions([]);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-line/40"
              >
                <span className="text-ink">{option.modelName}</span>
                <span className="whitespace-nowrap text-xs text-ink/45">
                  {option.displacementCc
                    ? `${option.displacementCc}cc`
                    : option.isElectric
                      ? "Electric"
                      : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
