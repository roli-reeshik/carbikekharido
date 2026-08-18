export interface ListingImage {
  id: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  order: number;
  isThumb: boolean;
}

export interface MarketplaceListingDetail {
  listingId: string;
  vehicleType: "CAR" | "BIKE";
  brand: string;
  model: string;
  yearOfManufacture: number;
  registrationNumber: string | null;
  color: string | null;
  bodyType: string | null;
  condition: string;
  fuelType: string | null;
  transmission: string | null;
  engineCC: number | null;
  power: string | null;
  torque: string | null;
  currentMileage: number | null;
  ownerType: string | null;
  insuranceValid: boolean;
  insuranceValidTill: string | null;
  pollutionCertValid: boolean;
  pollutionCertValidTill: string | null;
  serviceHistoryAvail: boolean;
  accidentHistory: boolean;
  accidentDescription: string | null;
  modifications: string | null;
  askingPrice: string;
  priceNegotiable: boolean;
  description: string | null;
  status: string;
  city: string;
  state: string;
  address: string | null;
  viewCount: number;
  inquiryCount: number;
  amenities: string[];
  contactChannels: { call: boolean; whatsapp: boolean; email: boolean };
  publishedAt: string | null;
  images: ListingImage[];
  seller: {
    id: string;
    sellerType: "INDIVIDUAL" | "DEALER";
    dealerName: string | null;
    ratings: number;
    totalReviews: number;
    memberSince: string;
    avgResponseMinutes: number;
    contact: {
      name: string | null;
      phoneVerified: boolean;
      emailVerified: boolean;
      phoneMasked: string | null;
    };
  };
}

export interface SpecRow {
  label: string;
  value: string;
}

const OWNER_LABELS: Record<string, string> = {
  first: "1st owner",
  second: "2nd owner",
  third: "3rd owner",
  fourth_plus: "4th+ owner",
};

const CONDITION_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  needs_work: "Needs work",
};

export function maskRegistration(reg: string | null): string {
  if (!reg) return "—";
  const parts = reg.trim().split(/\s+/);
  if (parts.length <= 2) return reg;
  return `${parts[0]} ${parts[1]} **** ${parts[parts.length - 1]}`;
}

export function formatOwnerType(owner: string | null): string {
  if (!owner) return "—";
  return OWNER_LABELS[owner] ?? owner;
}

export function formatCondition(c: string): string {
  return CONDITION_LABELS[c] ?? c;
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function buildSpecRows(listing: MarketplaceListingDetail): SpecRow[] {
  return [
    { label: "Registration", value: maskRegistration(listing.registrationNumber) },
    { label: "Year", value: String(listing.yearOfManufacture) },
    {
      label: "Mileage",
      value: listing.currentMileage != null ? `${listing.currentMileage.toLocaleString("en-IN")} km` : "—",
    },
    { label: "Fuel", value: listing.fuelType ? capitalize(listing.fuelType) : "—" },
    { label: "Transmission", value: listing.transmission ? capitalize(listing.transmission) : "—" },
    { label: "Body", value: listing.bodyType ?? "—" },
    { label: "Engine", value: listing.engineCC ? `${listing.engineCC} cc` : "—" },
    { label: "Power", value: listing.power ?? "—" },
    { label: "Torque", value: listing.torque ?? "—" },
    { label: "Owner", value: formatOwnerType(listing.ownerType) },
    { label: "Condition", value: formatCondition(listing.condition) },
    { label: "Color", value: listing.color?.trim() || "—" },
    {
      label: "Insurance",
      value: listing.insuranceValid
        ? `Valid${listing.insuranceValidTill ? ` till ${formatDateShort(listing.insuranceValidTill)}` : ""}`
        : "Not valid",
    },
    {
      label: "Pollution",
      value: listing.pollutionCertValid
        ? `Valid${listing.pollutionCertValidTill ? ` till ${formatDateShort(listing.pollutionCertValidTill)}` : ""}`
        : "Not valid",
    },
    { label: "Service history", value: listing.serviceHistoryAvail ? "Available" : "Not available" },
    {
      label: "Accident",
      value: listing.accidentHistory
        ? listing.accidentDescription?.trim() || "Yes — see description"
        : "No accident reported",
    },
    { label: "Modifications", value: listing.modifications?.trim() || "None reported" },
  ];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CAR_AMENITIES = ["AC", "Power Steering", "ABS", "Airbags", "Music System", "Central Locking"];
const BIKE_AMENITIES = ["Electric Start", "Disc Brakes", "LED Headlamp", "Digital Console"];

export function deriveFeaturePills(listing: MarketplaceListingDetail): { label: string; present: boolean }[] {
  const stored = listing.amenities.map((a) => ({ label: a, present: true }));
  if (stored.length > 0) return stored;

  const base = listing.vehicleType === "BIKE" ? BIKE_AMENITIES : CAR_AMENITIES;
  const year = listing.yearOfManufacture;

  return base.map((label) => {
    let present = true;
    if (label === "ABS" || label === "Airbags") present = year >= 2017;
    if (label === "LED Headlamp") present = year >= 2018;
    return { label, present };
  });
}

export function listingPageTitle(listing: MarketplaceListingDetail): string {
  return `${listing.yearOfManufacture} ${listing.brand} ${listing.model}`;
}

export function memberSinceLabel(iso: string): string {
  const year = new Date(iso).getFullYear();
  return `Member since ${year}`;
}
