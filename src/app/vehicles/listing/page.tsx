"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectView() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");

  useEffect(() => {
    if (id) router.replace(`/vehicles/buy/${encodeURIComponent(id)}`);
    else router.replace("/vehicles/buy/search");
  }, [id, router]);

  return <div className="py-20 text-center text-sm text-ink/50">Redirecting…</div>;
}

/** Legacy route — redirects to /vehicles/buy/[id] */
export default function LegacyListingRedirect() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink/50">Loading…</div>}>
      <RedirectView />
    </Suspense>
  );
}
