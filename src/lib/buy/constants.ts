import { CITIES } from "@/lib/homeContent";

export const INDIAN_CITIES = CITIES;

export const PRICE_MIN = 0;
export const PRICE_MAX = 5_000_000;
export const YEAR_MIN = 1990;
export const YEAR_MAX = new Date().getFullYear() + 1;
export const MILEAGE_MIN = 0;
export const MILEAGE_MAX = 200_000;

export const FUEL_OPTIONS = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

export const TRANSMISSION_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "amt", label: "AMT" },
  { value: "cvt", label: "CVT" },
  { value: "dct", label: "DCT" },
];

export const BODY_TYPE_CAR = ["Hatchback", "Sedan", "SUV", "MUV", "Luxury"];
export const BODY_TYPE_BIKE = ["Commuter", "Sports", "Scooter", "Cruiser", "Adventure"];

export const OWNER_TYPE_OPTIONS = [
  { value: "first", label: "1st owner" },
  { value: "second", label: "2nd owner" },
  { value: "third", label: "3rd owner" },
  { value: "fourth_plus", label: "4th+ owner" },
];

export const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs_work", label: "Needs work" },
];

export const SELLER_TYPE_OPTIONS = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "DEALER", label: "Dealer" },
];

export const SORT_OPTIONS: { value: import("./types").SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price (Low to High)" },
  { value: "price_desc", label: "Price (High to Low)" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "mileage", label: "Mileage" },
];

export const QUICK_FILTERS = [
  {
    id: "cars-under-5l",
    label: "Cars under ₹5L",
    params: { type: "CAR", priceMax: "500000" },
  },
  {
    id: "bikes-under-2l",
    label: "Bikes under ₹2L",
    params: { type: "BIKE", priceMax: "200000" },
  },
  {
    id: "recent",
    label: "Recently Listed",
    params: { recent: "true", sort: "newest" },
  },
  {
    id: "verified-dealers",
    label: "From Dealers",
    params: { sellerType: "DEALER" },
  },
  {
    id: "electric",
    label: "Electric",
    params: { fuel: "electric" },
  },
  {
    id: "low-mileage",
    label: "Under 20K km",
    params: { mileageMax: "20000" },
  },
] as const;
