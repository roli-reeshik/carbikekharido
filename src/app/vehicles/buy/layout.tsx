import "./buy.css";
import "./detail.css";

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <div className="buy-flow min-h-screen bg-paper">{children}</div>;
}
