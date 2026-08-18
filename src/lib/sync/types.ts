/**
 * Standard JSON shape returned by automotive data aggregators
 * (ChromeData / Edmunds / JATO — normalized to one internal contract).
 */
export interface AggregatorOffer {
  id: string;
  title: string;
  description?: string;
  discount_amount?: number;
  valid_from?: string;
  valid_till: string;
}

export interface AggregatorVehiclePayload {
  external_id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  vehicle_type: "car" | "bike";
  fuel_type: "petrol" | "diesel" | "electric" | "cng" | "hybrid";
  price: number;
  active_offers: AggregatorOffer[];
  image_urls: string[];
  /** Optional Commons search terms when direct image_urls are missing or stale. */
  image_search_terms?: string[];
  specs?: Record<string, string>;
}

export interface SyncVehicleResult {
  externalId: string;
  brand: string;
  model: string;
  variant: string;
  vehicleId?: number;
  imagesUploaded: number;
  offersUpserted: number;
  error?: string;
}

export interface SyncRunSummary {
  runId: number;
  status: "success" | "partial" | "failed";
  vehiclesProcessed: number;
  imagesProcessed: number;
  offersProcessed: number;
  errorsCount: number;
  vehicleResults: SyncVehicleResult[];
  durationMs: number;
}
