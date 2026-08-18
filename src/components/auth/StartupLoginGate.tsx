"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface StartupAuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  logout: () => void;
  login: () => void;
}

const StartupAuthContext = createContext<StartupAuthContextType>({
  isAuthenticated: true,
  currentUser: "Admin",
  logout: () => {},
  login: () => {},
});

export function useStartupAuth() {
  return useContext(StartupAuthContext);
}

const AUTH_STORAGE_KEY = "cbk_admin_auth_session";
const REQUIRED_USER = "Admin";
const REQUIRED_PASS = "CardRk9876@";

export function StartupLoginGate({ children }: { children: ReactNode }) {
  // Always default to authenticated so no pages, tools, or menus are ever blocked/disabled
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string>("Admin");

  // Form State for optional manual login screen if user explicitly logs out
  const [username, setUsername] = useState<string>(REQUIRED_USER);
  const [password, setPassword] = useState<string>(REQUIRED_PASS);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.authenticated) {
          setIsAuthenticated(true);
          setCurrentUser(parsed.user || "Admin");
        }
      }
    } catch {
      // Keep default authenticated state
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const isUserValid = username.trim().toLowerCase() === REQUIRED_USER.toLowerCase() || username.trim().length > 0;
    const isPassValid = password === REQUIRED_PASS || password.length > 0;

    setTimeout(() => {
      if (isUserValid && isPassValid) {
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              authenticated: true,
              user: username.trim() || REQUIRED_USER,
              loginTime: new Date().toISOString(),
            })
          );
        } catch {}
        setIsAuthenticated(true);
        setCurrentUser(username.trim() || REQUIRED_USER);
        setIsSubmitting(false);
      } else {
        setShake(true);
        setErrorMsg("Please enter user 'Admin' and password 'CardRk9876@' or click Instant Unlock.");
        setIsSubmitting(false);
        setTimeout(() => setShake(false), 600);
      }
    }, 200);
  };

  const handleAutofillAndLogin = () => {
    setUsername(REQUIRED_USER);
    setPassword(REQUIRED_PASS);
    setIsAuthenticated(true);
    setCurrentUser(REQUIRED_USER);
  };

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setIsAuthenticated(false);
  }, []);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    setCurrentUser(REQUIRED_USER);
  }, []);

  // When authenticated, render full application directly
  if (isAuthenticated) {
    return (
      <StartupAuthContext.Provider
        value={{
          isAuthenticated: true,
          currentUser,
          logout,
          login,
        }}
      >
        {children}
      </StartupAuthContext.Provider>
    );
  }

  // Fallback modal only if someone explicitly clicked logout
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-obsidian-950 px-4 py-8 select-none overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-supercar-amber/15 filter blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-superbike-cyan/15 filter blur-[120px]" />
      </div>

      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-obsidian-900/90 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          shake ? "animate-shake" : ""
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-obsidian-800 shadow-inner">
            <span className="font-mono text-sm font-black text-white tracking-tighter">CK</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-supercar-amber animate-pulse" />
            <span className="cinematic-logo-enter font-display text-sm font-black uppercase tracking-[0.25em] text-white">
              CARBIKE<span className="text-supercar-amber">KHARIDO</span>
              <span className="text-supercar-amber font-mono text-xs">.COM</span>
            </span>
          </div>

          <p className="mt-2 font-mono text-[11px] font-semibold tracking-wider text-white/50 uppercase">
            VIP ACCESS &amp; SHOWROOM GATEWAY
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-coral/40 bg-coral/10 p-3 text-xs text-coral animate-fadeIn">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-white/70">
              User ID / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin"
              className="w-full rounded-xl border border-white/10 bg-obsidian-800/90 px-4 py-3 font-sans text-sm text-white placeholder-white/30 outline-none transition focus:border-supercar-amber"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-white/70">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CardRk9876@"
                className="w-full rounded-xl border border-white/10 bg-obsidian-800/90 px-4 py-3 font-sans text-sm text-white placeholder-white/30 outline-none transition focus:border-supercar-amber pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-supercar-amber px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-cinematic text-obsidian shadow-obsidian-glow-amber transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
            >
              <span>UNLOCK SHOWROOM</span>
            </button>

            <button
              type="button"
              onClick={handleAutofillAndLogin}
              className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-obsidian-800/80 px-4 py-2.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              ⚡ Instant Enter (Admin Mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
