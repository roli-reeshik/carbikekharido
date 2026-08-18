import "../buy/buy.css";
import "./compare.css";

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <div className="buy-flow min-h-screen bg-paper">{children}</div>;
}
