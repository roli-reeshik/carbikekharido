/** Types for the 4-step seller listing creation flow. */

export type SellStep = 1 | 2 | 3 | 4;

export type VehicleTypeChoice = "CAR" | "BIKE";

export type AccidentHistory = "none" | "yes" | "minor";

export type SellerTypeChoice = "INDIVIDUAL" | "DEALER";

export interface SellMediaItem {
  id: string;
  type: "photo" | "video";
  previewUrl: string;
  /** Present while drafting; omitted after reload from localStorage. */
  fileName?: string;
  order: number;
  isThumb: boolean;
}

export interface SellListingDraft {
  vehicleType: VehicleTypeChoice;
  brand: string;
  model: string;
  registrationNumber: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineCC: string;
  power: string;
  torque: string;
  yearOfManufacture: string;
  currentMileage: string;
  ownerType: string;
  condition: string;
  color: string;
  insuranceValid: boolean;
  insuranceValidTill: string;
  pollutionCertValid: boolean;
  pollutionCertValidTill: string;
  serviceHistoryAvail: boolean;
  accidentHistory: AccidentHistory;
  accidentDescription: string;
  hasModifications: boolean;
  modifications: string;
  askingPrice: string;
  priceNegotiable: boolean;
  city: string;
  state: string;
  address: string;
  description: string;
  media: SellMediaItem[];
  sellerName: string;
  phone: string;
  email: string;
  phoneVerified: boolean;
  sellerType: SellerTypeChoice;
  contactCall: boolean;
  contactWhatsApp: boolean;
  contactEmail: boolean;
  dealerName: string;
  dealerRegNumber: string;
  dealerWebsite: string;
  termsAccepted: boolean;
}

export type SellFieldErrors = Partial<Record<keyof SellListingDraft | "media", string>>;

export const EMPTY_SELL_DRAFT: SellListingDraft = {
  vehicleType: "CAR",
  brand: "",
  model: "",
  registrationNumber: "",
  bodyType: "",
  fuelType: "petrol",
  transmission: "manual",
  engineCC: "",
  power: "",
  torque: "",
  yearOfManufacture: "",
  currentMileage: "",
  ownerType: "first",
  condition: "good",
  color: "",
  insuranceValid: true,
  insuranceValidTill: "",
  pollutionCertValid: true,
  pollutionCertValidTill: "",
  serviceHistoryAvail: false,
  accidentHistory: "none",
  accidentDescription: "",
  hasModifications: false,
  modifications: "",
  askingPrice: "",
  priceNegotiable: true,
  city: "Lucknow",
  state: "Uttar Pradesh",
  address: "",
  description: "",
  media: [],
  sellerName: "",
  phone: "",
  email: "",
  phoneVerified: false,
  sellerType: "INDIVIDUAL",
  contactCall: true,
  contactWhatsApp: true,
  contactEmail: false,
  dealerName: "",
  dealerRegNumber: "",
  dealerWebsite: "",
  termsAccepted: false,
};

export const SELL_DRAFT_KEY = "cbd_sell_listing_draft";
export const SELL_STEP_KEY = "cbd_sell_listing_step";

export const MAX_PHOTOS = 20;
export const MAX_VIDEOS = 3;
export const MIN_PHOTOS = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
