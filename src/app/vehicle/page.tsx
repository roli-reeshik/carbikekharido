import { Suspense } from "react";
import ModelDetailContent from "../model/ModelDetailContent";

export default function VehiclePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-ink/50">Loading vehicle details…</div>}>
      <ModelDetailContent />
    </Suspense>
  );
}
