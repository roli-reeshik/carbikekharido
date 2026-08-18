import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AuthGateProvider } from "@/components/auth/AuthGateProvider";
import { StartupLoginGate } from "@/components/auth/StartupLoginGate";
import { fontDisplay, fontBody, fontMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "CarBikeKharido — Find Your Perfect Car or Bike",
  description:
    "India's smartest vehicle marketplace. Browse cars and bikes, compare models, calculate EMI, read reviews — no login needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <body className="font-sans text-ink antialiased">
        <StartupLoginGate>
          <LanguageProvider>
            <AuthGateProvider>{children}</AuthGateProvider>
          </LanguageProvider>
        </StartupLoginGate>
      </body>
    </html>
  );
}
