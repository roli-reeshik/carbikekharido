import { Suspense } from "react";
import ModelDetailContent from "./ModelDetailContent";

export default function ModelPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-ink/50">Loading…</div>}>
      <ModelDetailContent />
    </Suspense>
  );
}
