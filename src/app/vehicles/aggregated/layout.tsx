import "../buy/buy.css";

export default function AggregatedLayout({ children }: { children: React.ReactNode }) {
  return <div className="buy-flow min-h-screen bg-paper">{children}</div>;
}
