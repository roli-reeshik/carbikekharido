"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { IntentAction } from "@/lib/intent";
import { isAuthenticated, setAuthSession } from "@/lib/session";
import { mergeWishlistIntoAccount } from "@/lib/wishlist";
import { getMpWishlist, clearMpWishlistLocal } from "@/lib/buy/wishlist";
import { apiMergeWishlist } from "@/lib/wishlist/apiClient";
import { RegistrationModal } from "./RegistrationModal";

type PendingAction = {
  intent: IntentAction;
  resolve: () => void;
} | null;

interface AuthGateContextValue {
  /**
   * Call this from ANY component right before performing an
   * intent-gated action. If the visitor is already verified, the
   * callback runs immediately with zero friction. If not, the
   * registration modal opens inline; the callback runs automatically
   * the instant OTP verification succeeds — the component calling this
   * does not need to know or care whether a modal was shown.
   */
  requireAuth: (intent: IntentAction, onVerified: () => void) => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingAction>(null);

  const requireAuth = useCallback((intent: IntentAction, onVerified: () => void) => {
    if (isAuthenticated()) {
      onVerified();
      return;
    }
    setPending({ intent, resolve: onVerified });
  }, []);

  const handleVerified = useCallback(
    async (token: string, phone: string) => {
      setAuthSession(token, phone);
      await mergeWishlistIntoAccount(phone);
      const mpIds = getMpWishlist();
      if (mpIds.length > 0) {
        try {
          await apiMergeWishlist(mpIds);
          clearMpWishlistLocal();
        } catch {
          /* keep local ids for retry */
        }
      }
      const resolve = pending?.resolve;
      setPending(null);
      resolve?.();
    },
    [pending]
  );

  const handleDismiss = useCallback(() => setPending(null), []);

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      {pending && (
        <RegistrationModal
          intent={pending.intent}
          onVerified={handleVerified}
          onDismiss={handleDismiss}
        />
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within an AuthGateProvider");
  return ctx;
}
