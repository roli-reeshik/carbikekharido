"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { IntentAction, INTENT_LABELS } from "@/lib/intent";

type Step = "phone" | "otp" | "success";

interface Props {
  intent: IntentAction;
  onVerified: (token: string, phone: string) => void;
  onDismiss: () => void;
}

const RESEND_COOLDOWN_S = 30;

export function RegistrationModal({ intent, onVerified, onDismiss }: Props) {
  const { t, locale } = useLanguage();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const intentLabel = INTENT_LABELS[intent][locale];

  async function sendOtp() {
    setError(null);
    const digitsOnly = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setError(t("auth.errorInvalidPhone"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "send_otp", phone: digitsOnly }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(t("auth.errorGeneric"));
        return;
      }
      setPhone(digitsOnly);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_S);
    } catch {
      setError(t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    if (code.length !== 6) {
      setError(t("auth.errorInvalidOtp"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify_otp", phone, code }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(t("auth.errorInvalidOtp"));
        return;
      }
      setStep("success");
      setTimeout(() => onVerified(data.token, phone), 700);
    } catch {
      setError(t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl">
        {step !== "success" && (
          <>
            <p className="text-sm font-medium text-marigold">{t("auth.modalTitleIntro")}</p>
            <h2 className="mt-1 text-lg font-semibold text-highway">
              {locale === "hi" ? `हम आपकी मदद ${intentLabel} में करेंगे` : `Let's ${intentLabel}`}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t("auth.modalSubtitle")}</p>
          </>
        )}

        {step === "phone" && (
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t("auth.phoneLabel")}
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-highway">
              <span className="px-3 text-gray-500 text-sm">+91</span>
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t("auth.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                className="w-full rounded-r-lg py-2.5 pr-3 text-sm outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full rounded-lg bg-highway py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {t("auth.sendOtp")}
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {t("auth.continueAsGuest")}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t("auth.otpLabel")}
            </label>
            <p className="text-xs text-gray-500">{t("auth.otpSentTo", { phone })}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-center text-lg tracking-[0.5em] outline-none focus:border-highway"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={verify}
              disabled={loading}
              className="w-full rounded-lg bg-highway py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {t("auth.verifyOtp")}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => setStep("phone")} className="text-gray-500 hover:text-gray-700">
                {t("auth.changeNumber")}
              </button>
              <button
                onClick={sendOtp}
                disabled={cooldown > 0}
                className="text-highway disabled:text-gray-400"
              >
                {cooldown > 0 ? t("auth.resendIn", { seconds: cooldown }) : t("auth.resendOtp")}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              ✓
            </div>
            <h2 className="text-lg font-semibold text-highway">{t("auth.successTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("auth.successSubtitle")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
