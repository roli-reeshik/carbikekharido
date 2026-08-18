import { Suspense } from "react";
import SearchPage from "./SearchContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink/50">Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
