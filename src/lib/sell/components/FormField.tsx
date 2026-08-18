"use client";

import { SellFieldErrors } from "../types";

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, name, required, error, hint, children }: FormFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-sell-primary">
        {label}
        {required ? <span className="text-sell-accent"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink/45">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <span aria-hidden>⚠</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-bold text-sell-primary">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink/55">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function inputClass(error?: string) {
  return [
    "w-full rounded-lg border px-3 py-2.5 text-sm text-ink transition",
    "focus:outline-none focus:ring-2 focus:ring-sell-primary/30 focus:border-sell-primary",
    error ? "border-red-400 bg-red-50/50" : "border-line bg-white hover:border-ink/20",
  ].join(" ");
}

export function FieldErrorsSummary({ errors }: { errors: SellFieldErrors }) {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p className="font-medium">Please fix the following:</p>
      <ul className="mt-1 list-inside list-disc">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
