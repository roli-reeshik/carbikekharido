import { Suspense } from "react";
import BuySearchResults from "../search";

export default function BuySearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink/50">
          Loading search…
        </div>
      }
    >
      <BuySearchResults />
    </Suspense>
  );
}
