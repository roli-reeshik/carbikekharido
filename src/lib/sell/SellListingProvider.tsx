"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAuthedPhone } from "@/lib/session";
import { clearDraftStorage, loadDraftFromStorage, saveDraftToStorage } from "./draftStorage";
import {
  EMPTY_SELL_DRAFT,
  SellFieldErrors,
  SellListingDraft,
  SellStep,
} from "./types";
import { hasErrors, validateStep } from "./validation";

interface SellListingContextValue {
  draft: SellListingDraft;
  step: SellStep;
  errors: SellFieldErrors;
  dirty: boolean;
  lastSaved: Date | null;
  publishing: boolean;
  setField: <K extends keyof SellListingDraft>(key: K, value: SellListingDraft[K]) => void;
  patchDraft: (patch: Partial<SellListingDraft>) => void;
  setStep: (step: SellStep) => void;
  validateCurrentStep: () => boolean;
  saveDraft: () => void;
  goNext: () => boolean;
  goBack: () => void;
  setPublishing: (v: boolean) => void;
  resetDraft: () => void;
}

const SellListingContext = createContext<SellListingContextValue | null>(null);

export function SellListingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SellListingDraft>(EMPTY_SELL_DRAFT);
  const [step, setStepState] = useState<SellStep>(1);
  const [errors, setErrors] = useState<SellFieldErrors>({});
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore draft from localStorage on mount
  useEffect(() => {
    const { draft: stored, step: storedStep } = loadDraftFromStorage();
    const phone = getAuthedPhone();
    if (stored) {
      setDraft({
        ...stored,
        phone: stored.phone || phone || "",
        phoneVerified: stored.phoneVerified || Boolean(phone),
      });
      if (storedStep && storedStep >= 1 && storedStep <= 4) setStepState(storedStep);
    } else if (phone) {
      setDraft((d) => ({ ...d, phone, phoneVerified: true }));
    }
    setHydrated(true);
  }, []);

  const saveDraft = useCallback(() => {
    saveDraftToStorage(draft, step);
    setLastSaved(new Date());
    setDirty(false);
  }, [draft, step]);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    if (!hydrated || !dirty) return;
    const timer = setInterval(saveDraft, 30_000);
    return () => clearInterval(timer);
  }, [hydrated, dirty, saveDraft]);

  const setField = useCallback(<K extends keyof SellListingDraft>(key: K, value: SellListingDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const patchDraft = useCallback((patch: Partial<SellListingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const validateCurrentStep = useCallback(() => {
    const nextErrors = validateStep(step, draft);
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  }, [step, draft]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return false;
    saveDraft();
    setStepState((s) => Math.min(4, s + 1) as SellStep);
    setErrors({});
    return true;
  }, [validateCurrentStep, saveDraft]);

  const goBack = useCallback(() => {
    saveDraft();
    setStepState((s) => Math.max(1, s - 1) as SellStep);
    setErrors({});
  }, [saveDraft]);

  const setStep = useCallback(
    (target: SellStep) => {
      if (target <= step) {
        setStepState(target);
        setErrors({});
        return;
      }
      for (let s = step; s < target; s++) {
        const stepErrors = validateStep(s as SellStep, draft);
        if (hasErrors(stepErrors)) {
          setErrors(stepErrors);
          setStepState(s as SellStep);
          return;
        }
      }
      saveDraft();
      setStepState(target);
      setErrors({});
    },
    [step, draft, saveDraft]
  );

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_SELL_DRAFT);
    setStepState(1);
    setErrors({});
    setDirty(false);
    clearDraftStorage();
  }, []);

  const value = useMemo(
    () => ({
      draft,
      step,
      errors,
      dirty,
      lastSaved,
      publishing,
      setField,
      patchDraft,
      setStep,
      validateCurrentStep,
      saveDraft,
      goNext,
      goBack,
      setPublishing,
      resetDraft,
    }),
    [
      draft,
      step,
      errors,
      dirty,
      lastSaved,
      publishing,
      setField,
      patchDraft,
      setStep,
      validateCurrentStep,
      saveDraft,
      goNext,
      goBack,
      resetDraft,
    ]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink/50">
        Loading your draft…
      </div>
    );
  }

  return <SellListingContext.Provider value={value}>{children}</SellListingContext.Provider>;
}

export function useSellListing() {
  const ctx = useContext(SellListingContext);
  if (!ctx) throw new Error("useSellListing must be used within SellListingProvider");
  return ctx;
}
