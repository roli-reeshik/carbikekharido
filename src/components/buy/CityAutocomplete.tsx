"use client";

import { useEffect, useRef, useState } from "react";
import { INDIAN_CITIES } from "@/lib/buy/constants";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  id?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Select city",
  id = "city-autocomplete",
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = INDIAN_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-sell-accent focus:ring-2 focus:ring-sell-accent/20"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-card">
          {filtered.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-sell-primary/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(city);
                  setQuery(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
