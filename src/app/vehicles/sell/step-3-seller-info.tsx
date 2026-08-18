"use client";

import { useEffect, useState } from "react";
import { setAuthSession } from "@/lib/session";
import { useSellListing } from "@/lib/sell/SellListingProvider";
import { FieldErrorsSummary, FormField, FormSection, inputClass } from "@/lib/sell/components/FormField";
import { SellerTypeChoice } from "@/lib/sell/types";

const OTP_COOLDOWN = 60;

export default function Step3SellerInfo() {
  const { draft, errors, setField, patchDraft, goNext, goBack } = useSellListing();
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendOtp() {
    const digits = draft.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) return;
    setOtpError(null);
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "send_otp", phone: digits }),
      });
      const data = await res.json();
      if (!data.success) {
        setOtpError("Could not send OTP. Try again.");
        return;
      }
      setField("phone", digits);
      setOtpOpen(true);
      setCooldown(OTP_COOLDOWN);
    } catch {
      setOtpError("Network error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    setOtpError(null);
    if (otp.length !== 6) {
      setOtpError("Enter 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify_otp", phone: draft.phone, code: otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setOtpError("Invalid OTP");
        return;
      }
      setAuthSession(data.token, draft.phone);
      patchDraft({ phoneVerified: true });
      setOtpOpen(false);
    } catch {
      setOtpError("Network error");
    } finally {
      setOtpLoading(false);
    }
  }

  function handlePhoneBlur() {
    if (draft.phoneVerified) return;
    const digits = draft.phone.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits)) void sendOtp();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-sell-primary">Seller information</h1>
        <p className="mt-1 text-sm text-ink/55">Buyers will contact you using these details.</p>
      </div>

      <FieldErrorsSummary errors={errors} />

      <FormSection title="Contact details">
        <FormField label="Your name" name="sellerName" required error={errors.sellerName}>
          <input
            id="sellerName"
            value={draft.sellerName}
            onChange={(e) => setField("sellerName", e.target.value)}
            className={inputClass(errors.sellerName)}
            autoComplete="name"
          />
        </FormField>

        <FormField label="Phone number" name="phone" required error={errors.phone}>
          <div className="flex items-center rounded-lg border border-line focus-within:border-sell-primary focus-within:ring-2 focus-within:ring-sell-primary/20">
            <span className="px-3 text-sm text-ink/50">+91</span>
            <input
              id="phone"
              inputMode="numeric"
              maxLength={10}
              value={draft.phone}
              onChange={(e) => {
                setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
                if (draft.phoneVerified) patchDraft({ phoneVerified: false });
              }}
              onBlur={handlePhoneBlur}
              className="flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm focus:outline-none focus:ring-0"
              aria-describedby="phone-status"
            />
            {draft.phoneVerified && (
              <span id="phone-status" className="pr-3 text-sell-emerald" title="Verified">
                ✓
              </span>
            )}
          </div>
        </FormField>

        <FormField label="Email" name="email" error={errors.email} hint="Optional but recommended">
          <input
            id="email"
            type="email"
            value={draft.email}
            onChange={(e) => setField("email", e.target.value)}
            className={inputClass(errors.email)}
            autoComplete="email"
          />
        </FormField>
      </FormSection>

      <FormSection title="Seller type">
        <div className="flex gap-4">
          {(["INDIVIDUAL", "DEALER"] as SellerTypeChoice[]).map((type) => (
            <label key={type} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-line p-4">
              <input
                type="radio"
                name="sellerType"
                checked={draft.sellerType === type}
                onChange={() => setField("sellerType", type)}
              />
              <span className="text-sm font-medium">{type === "INDIVIDUAL" ? "Individual" : "Dealer"}</span>
            </label>
          ))}
        </div>

        {draft.sellerType === "DEALER" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Dealer name" name="dealerName" required error={errors.dealerName}>
              <input
                id="dealerName"
                value={draft.dealerName}
                onChange={(e) => setField("dealerName", e.target.value)}
                className={inputClass(errors.dealerName)}
              />
            </FormField>
            <FormField label="Registration number" name="dealerRegNumber" required error={errors.dealerRegNumber}>
              <input
                id="dealerRegNumber"
                value={draft.dealerRegNumber}
                onChange={(e) => setField("dealerRegNumber", e.target.value)}
                className={inputClass(errors.dealerRegNumber)}
              />
            </FormField>
            <FormField label="Website" name="dealerWebsite">
              <input
                id="dealerWebsite"
                type="url"
                value={draft.dealerWebsite}
                onChange={(e) => setField("dealerWebsite", e.target.value)}
                className={inputClass()}
                placeholder="https://"
              />
            </FormField>
          </div>
        )}
      </FormSection>

      <FormSection title="Preferred contact method">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.contactCall} onChange={(e) => setField("contactCall", e.target.checked)} />
            Phone call
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.contactWhatsApp} onChange={(e) => setField("contactWhatsApp", e.target.checked)} />
            WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.contactEmail} onChange={(e) => setField("contactEmail", e.target.checked)} />
            Email
          </label>
        </div>
        {errors.contactCall && <p className="text-xs text-red-600">{errors.contactCall}</p>}
      </FormSection>

      <div className="flex justify-between gap-3">
        <button type="button" onClick={goBack} className="btn-sell-ghost">
          ← Back
        </button>
        <button type="button" onClick={goNext} className="btn-sell-secondary">
          Continue →
        </button>
      </div>

      {/* OTP modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-sell-primary">Verify phone</h2>
            <p className="mt-1 text-sm text-ink/55">OTP sent to +91 {draft.phone}</p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass(otpError ?? undefined)} mt-4 text-center font-spec text-lg tracking-widest`}
              placeholder="••••••"
              autoFocus
            />
            {otpError && <p className="mt-2 text-xs text-red-600">{otpError}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-sell-secondary flex-1" disabled={otpLoading} onClick={() => void verifyOtp()}>
                Verify
              </button>
              <button type="button" className="btn-sell-ghost" onClick={() => setOtpOpen(false)}>
                Cancel
              </button>
            </div>
            <button
              type="button"
              className="mt-3 w-full text-center text-xs text-sell-primary disabled:opacity-40"
              disabled={cooldown > 0 || otpLoading}
              onClick={() => void sendOtp()}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
