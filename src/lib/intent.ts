/**
 * PRD Module 1 — "Progressive Registration & Identity (Anonymous-First)"
 *
 * This is the single defined list of actions allowed to trigger a
 * registration prompt. Anything NOT in this list must remain fully
 * anonymous — browsing, filtering, comparing, reading content, and
 * saving to a local wishlist are never gated.
 *
 * Keeping this as one typed list (rather than scattering ad-hoc login
 * checks through the codebase) means:
 *  - a code reviewer can audit "what can gate a user" in one place
 *  - adding a new gated action is a one-line change here, not a hunt
 *    through every component for a missing check
 */
export const INTENT_ACTIONS = {
  CONTACT_SELLER: "contact_seller",
  BOOK_TEST_DRIVE: "book_test_drive",
  REQUEST_EMI_QUOTE: "request_emi_quote",
  SUBMIT_SELL_VALUATION: "submit_sell_valuation",
  SAVE_PRICE_ALERT: "save_price_alert",
  BOOK_EXPERT_CONSULTATION: "book_expert_consultation",
  POST_REVIEW_OR_QUESTION: "post_review_or_question",
} as const;

export type IntentAction = (typeof INTENT_ACTIONS)[keyof typeof INTENT_ACTIONS];

export const INTENT_LABELS: Record<IntentAction, { en: string; hi: string }> = {
  [INTENT_ACTIONS.CONTACT_SELLER]: {
    en: "reveal the seller's contact details",
    hi: "विक्रेता का संपर्क विवरण देखने",
  },
  [INTENT_ACTIONS.BOOK_TEST_DRIVE]: {
    en: "book this test drive",
    hi: "यह टेस्ट ड्राइव बुक करने",
  },
  [INTENT_ACTIONS.REQUEST_EMI_QUOTE]: {
    en: "send you this EMI quote",
    hi: "यह EMI कोटेशन भेजने",
  },
  [INTENT_ACTIONS.SUBMIT_SELL_VALUATION]: {
    en: "submit your vehicle for valuation",
    hi: "आपका वाहन मूल्यांकन हेतु सबमिट करने",
  },
  [INTENT_ACTIONS.SAVE_PRICE_ALERT]: {
    en: "set up this price alert",
    hi: "यह प्राइस अलर्ट सेट करने",
  },
  [INTENT_ACTIONS.BOOK_EXPERT_CONSULTATION]: {
    en: "book your expert consultation",
    hi: "आपका विशेषज्ञ परामर्श बुक करने",
  },
  [INTENT_ACTIONS.POST_REVIEW_OR_QUESTION]: {
    en: "post this under your name",
    hi: "इसे आपके नाम से पोस्ट करने",
  },
};

// Explicitly NOT gated — anonymous wishlist/comparison saves are local-only
// (see lib/wishlist.ts) and never trigger this flow.
