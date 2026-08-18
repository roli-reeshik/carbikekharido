import { Inter, Roboto_Mono } from "next/font/google";
import "./sell.css";
import { SellListingProvider } from "@/lib/sell/SellListingProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sell-body" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-sell-mono" });

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${robotoMono.variable} sell-flow min-h-screen bg-paper font-[family-name:var(--font-sell-body)] text-ink antialiased`}
    >
      <SellListingProvider>{children}</SellListingProvider>
    </div>
  );
}
