import { SellListingDraft, SELL_DRAFT_KEY, SELL_STEP_KEY, SellStep } from "./types";

/** Persist draft + step to localStorage (media stores preview URLs only). */
export function saveDraftToStorage(draft: SellListingDraft, step: SellStep) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELL_DRAFT_KEY, JSON.stringify(draft));
    localStorage.setItem(SELL_STEP_KEY, String(step));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadDraftFromStorage(): { draft: SellListingDraft | null; step: SellStep | null } {
  if (typeof window === "undefined") return { draft: null, step: null };
  try {
    const raw = localStorage.getItem(SELL_DRAFT_KEY);
    const stepRaw = localStorage.getItem(SELL_STEP_KEY);
    if (!raw) return { draft: null, step: null };
    const draft = JSON.parse(raw) as SellListingDraft;
    const step = stepRaw ? (Number(stepRaw) as SellStep) : null;
    return { draft, step };
  } catch {
    return { draft: null, step: null };
  }
}

export function clearDraftStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SELL_DRAFT_KEY);
  localStorage.removeItem(SELL_STEP_KEY);
}
