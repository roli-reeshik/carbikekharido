export type VehicleType = "car" | "bike";
export type BodyType = "suv" | "hatchback" | "sedan" | "muv" | "luxury" | "commuter" | "scooter" | "sports";
export type VehicleCondition = "new" | "used";
export type FuelType = "petrol" | "diesel" | "electric" | "cng";

export interface Vehicle {
  id: string;
  type: VehicleType;
  bodyType: BodyType;
  condition: VehicleCondition;
  fuelType?: FuelType;
  name: { en: string; hi: string };
  priceOnRoad: number;
  priceRangeMax?: number;
  city: string;
  spec: { en: string; hi: string };
  rating?: number;
  reviewCount?: number;
  mileage?: string;
  officialImageUrl?: string;
  brand?: string;
  modelName?: string;
  variantName?: string;
  isElectric?: boolean;
  isUpcoming?: boolean;
  /** Set for vehicles sourced from the India catalog — links to /model?id=... */
  catalogModelId?: string;
}

export const BODY_TYPES: {
  id: BodyType;
  vehicleType: VehicleType;
  label: { en: string; hi: string };
  icon: string;
}[] = [
  { id: "suv", vehicleType: "car", label: { en: "SUV", hi: "SUV" }, icon: "🚙" },
  { id: "hatchback", vehicleType: "car", label: { en: "Hatchback", hi: "हैचबैक" }, icon: "🚗" },
  { id: "sedan", vehicleType: "car", label: { en: "Sedan", hi: "सेडान" }, icon: "🚘" },
  { id: "muv", vehicleType: "car", label: { en: "MUV", hi: "MUV" }, icon: "🚐" },
  { id: "luxury", vehicleType: "car", label: { en: "Luxury", hi: "लक्ज़री" }, icon: "✨" },
  { id: "commuter", vehicleType: "bike", label: { en: "Commuter", hi: "कम्यूटर" }, icon: "🏍️" },
  { id: "scooter", vehicleType: "bike", label: { en: "Scooter", hi: "स्कूटर" }, icon: "🛵" },
  { id: "sports", vehicleType: "bike", label: { en: "Sports", hi: "स्पोर्ट्स" }, icon: "🏁" },
];

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "car-swift-vxi",
    type: "car",
    bodyType: "hatchback",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Maruti Suzuki Swift VXi", hi: "मारुति सुज़ुकी स्विफ्ट VXi" },
    priceOnRoad: 749000,
    priceRangeMax: 949000,
    city: "Lucknow",
    spec: { en: "Petrol · Manual · 5 seats", hi: "पेट्रोल · मैनुअल · 5 सीटें" },
    rating: 4.5,
    reviewCount: 2847,
    mileage: "24.8 kmpl",
    brand: "Maruti Suzuki",
    modelName: "Swift",
    variantName: "VXi",
  },
  {
    id: "car-nexon-ev",
    type: "car",
    bodyType: "suv",
    condition: "new",
    fuelType: "electric",
    isElectric: true,
    name: { en: "Tata Nexon EV", hi: "टाटा नेक्सॉन EV" },
    priceOnRoad: 1649000,
    priceRangeMax: 1949000,
    city: "Lucknow",
    spec: { en: "Electric · 465 km range · 5 seats", hi: "इलेक्ट्रिक · 465 km रेंज · 5 सीटें" },
    rating: 4.6,
    reviewCount: 1523,
    mileage: "465 km/charge",
    brand: "Tata Motors",
    modelName: "Nexon EV",
    variantName: "Long Range",
  },
  {
    id: "car-creta",
    type: "car",
    bodyType: "suv",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Hyundai Creta", hi: "हुंडई क्रेटा" },
    priceOnRoad: 1199000,
    priceRangeMax: 1899000,
    city: "Lucknow",
    spec: { en: "Petrol/Diesel · Manual/AT · 5 seats", hi: "पेट्रोल/डीज़ल · मैनुअल/AT · 5 सीटें" },
    rating: 4.7,
    reviewCount: 4521,
    mileage: "17.4 kmpl",
    brand: "Hyundai",
    modelName: "Creta",
    variantName: "SX",
  },
  {
    id: "car-thar",
    type: "car",
    bodyType: "suv",
    condition: "new",
    fuelType: "diesel",
    name: { en: "Mahindra Thar", hi: "महिंद्रा थार" },
    priceOnRoad: 999000,
    priceRangeMax: 1762000,
    city: "Lucknow",
    spec: { en: "Diesel · 4x4 · 4 seats", hi: "डीज़ल · 4x4 · 4 सीटें" },
    rating: 4.4,
    reviewCount: 3102,
    mileage: "15.2 kmpl",
    brand: "Mahindra",
    modelName: "Thar",
    variantName: "LX",
  },
  {
    id: "car-fronx",
    type: "car",
    bodyType: "suv",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Maruti Suzuki Fronx", hi: "मारुति सुज़ुकी फ्रॉन्क्स" },
    priceOnRoad: 685000,
    priceRangeMax: 1198000,
    city: "Lucknow",
    spec: { en: "Petrol · Manual/AMT · 5 seats", hi: "पेट्रोल · मैनुअल/AMT · 5 सीटें" },
    rating: 4.3,
    reviewCount: 1876,
    mileage: "21.5 kmpl",
    brand: "Maruti Suzuki",
    modelName: "Fronx",
    variantName: "Sigma",
  },
  {
    id: "car-punch-ev",
    type: "car",
    bodyType: "suv",
    condition: "new",
    fuelType: "electric",
    isElectric: true,
    name: { en: "Tata Punch EV", hi: "टाटा पंच EV" },
    priceOnRoad: 999000,
    priceRangeMax: 1499000,
    city: "Lucknow",
    spec: { en: "Electric · 421 km range · 5 seats", hi: "इलेक्ट्रिक · 421 km रेंज · 5 सीटें" },
    rating: 4.5,
    reviewCount: 892,
    mileage: "421 km/charge",
    brand: "Tata Motors",
    modelName: "Punch EV",
    variantName: "Empowered",
  },
  {
    id: "car-city",
    type: "car",
    bodyType: "sedan",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Honda City", hi: "होंडा सिटी" },
    priceOnRoad: 1249000,
    priceRangeMax: 1699000,
    city: "Lucknow",
    spec: { en: "Petrol · CVT · 5 seats", hi: "पेट्रोल · CVT · 5 सीटें" },
    rating: 4.6,
    reviewCount: 2341,
    mileage: "17.8 kmpl",
    brand: "Honda",
    modelName: "City",
    variantName: "VX",
  },
  {
    id: "car-ertiga",
    type: "car",
    bodyType: "muv",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Maruti Suzuki Ertiga", hi: "मारुति सुज़ुकी एर्टिगा" },
    priceOnRoad: 949000,
    priceRangeMax: 1349000,
    city: "Lucknow",
    spec: { en: "Petrol/CNG · Manual/AT · 7 seats", hi: "पेट्रोल/CNG · मैनुअल/AT · 7 सीटें" },
    rating: 4.4,
    reviewCount: 1654,
    mileage: "20.5 kmpl",
    brand: "Maruti Suzuki",
    modelName: "Ertiga",
    variantName: "VXi",
  },
  {
    id: "bike-splendor-plus",
    type: "bike",
    bodyType: "commuter",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Hero Splendor+", hi: "हीरो स्प्लेंडर+" },
    priceOnRoad: 89500,
    city: "Lucknow",
    spec: { en: "100cc · 65 kmpl · Commuter", hi: "100cc · 65 kmpl · कम्यूटर" },
    rating: 4.5,
    reviewCount: 5621,
    mileage: "65 kmpl",
    brand: "Hero MotoCorp",
    modelName: "Splendor+",
    variantName: "Standard",
  },
  {
    id: "bike-activa-6g",
    type: "bike",
    bodyType: "scooter",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Honda Activa 6G", hi: "होंडा एक्टिवा 6G" },
    priceOnRoad: 84000,
    city: "Lucknow",
    spec: { en: "110cc · Scooter · 60 kmpl", hi: "110cc · स्कूटर · 60 kmpl" },
    rating: 4.6,
    reviewCount: 8934,
    mileage: "60 kmpl",
    brand: "Honda",
    modelName: "Activa 6G",
    variantName: "Standard",
  },
  {
    id: "bike-pulsar-ns200",
    type: "bike",
    bodyType: "sports",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Bajaj Pulsar NS200", hi: "बजाज पल्सर NS200" },
    priceOnRoad: 149000,
    city: "Lucknow",
    spec: { en: "200cc · Sports · 40 kmpl", hi: "200cc · स्पोर्ट्स · 40 kmpl" },
    rating: 4.4,
    reviewCount: 3210,
    mileage: "40 kmpl",
    brand: "Bajaj",
    modelName: "Pulsar NS200",
    variantName: "Standard",
  },
  {
    id: "bike-jupiter",
    type: "bike",
    bodyType: "scooter",
    condition: "new",
    fuelType: "petrol",
    name: { en: "TVS Jupiter", hi: "TVS ज्यूपिटर" },
    priceOnRoad: 79000,
    city: "Lucknow",
    spec: { en: "110cc · Scooter · 62 kmpl", hi: "110cc · स्कूटर · 62 kmpl" },
    rating: 4.5,
    reviewCount: 4567,
    mileage: "62 kmpl",
    brand: "TVS",
    modelName: "Jupiter",
    variantName: "Standard",
  },
  {
    id: "bike-classic-350",
    type: "bike",
    bodyType: "commuter",
    condition: "new",
    fuelType: "petrol",
    name: { en: "Royal Enfield Classic 350", hi: "रॉयल एनफील्ड क्लासिक 350" },
    priceOnRoad: 199000,
    priceRangeMax: 249000,
    city: "Lucknow",
    spec: { en: "350cc · Cruiser · 35 kmpl", hi: "350cc · क्रूज़र · 35 kmpl" },
    rating: 4.3,
    reviewCount: 2876,
    mileage: "35 kmpl",
    brand: "Royal Enfield",
    modelName: "Classic 350",
    variantName: "Standard",
  },
  {
    id: "used-car-baleno",
    type: "car",
    bodyType: "hatchback",
    condition: "used",
    fuelType: "petrol",
    name: { en: "Maruti Suzuki Baleno (2021)", hi: "मारुति सुज़ुकी बलेनो (2021)" },
    priceOnRoad: 545000,
    city: "Lucknow",
    spec: { en: "38,200 km · 1st owner · Petrol", hi: "38,200 km · पहला मालिक · पेट्रोल" },
    rating: 4.2,
    reviewCount: 45,
  },
  {
    id: "used-car-creta",
    type: "car",
    bodyType: "suv",
    condition: "used",
    fuelType: "diesel",
    name: { en: "Hyundai Creta (2020)", hi: "हुंडई क्रेटा (2020)" },
    priceOnRoad: 1125000,
    city: "Lucknow",
    spec: { en: "51,600 km · 2nd owner · Diesel", hi: "51,600 km · दूसरा मालिक · डीज़ल" },
    rating: 4.1,
    reviewCount: 32,
  },
  {
    id: "used-bike-pulsar",
    type: "bike",
    bodyType: "sports",
    condition: "used",
    fuelType: "petrol",
    name: { en: "Bajaj Pulsar 150 (2019)", hi: "बजाज पल्सर 150 (2019)" },
    priceOnRoad: 62000,
    city: "Lucknow",
    spec: { en: "22,400 km · 1st owner · Petrol", hi: "22,400 km · पहला मालिक · पेट्रोल" },
    rating: 4.0,
    reviewCount: 18,
  },
  {
    id: "used-car-i20",
    type: "car",
    bodyType: "hatchback",
    condition: "used",
    fuelType: "petrol",
    name: { en: "Hyundai i20 (2022)", hi: "हुंडई i20 (2022)" },
    priceOnRoad: 725000,
    city: "Lucknow",
    spec: { en: "18,500 km · 1st owner · Petrol", hi: "18,500 km · पहला मालिक · पेट्रोल" },
    rating: 4.3,
    reviewCount: 28,
  },
];

export function filterVehicles(
  vehicles: Vehicle[],
  filters: {
    type?: VehicleType;
    condition?: VehicleCondition;
    bodyType?: BodyType;
    fuelType?: FuelType;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    query?: string;
    electricOnly?: boolean;
  }
): Vehicle[] {
  return vehicles.filter((v) => {
    if (filters.type && v.type !== filters.type) return false;
    if (filters.condition && v.condition !== filters.condition) return false;
    if (filters.bodyType && v.bodyType !== filters.bodyType) return false;
    if (filters.fuelType && v.fuelType !== filters.fuelType) return false;
    if (filters.electricOnly && !v.isElectric) return false;
    if (filters.minPrice && v.priceOnRoad < filters.minPrice) return false;
    if (filters.maxPrice && v.priceOnRoad > filters.maxPrice) return false;
    if (filters.brand && v.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const match =
        v.name.en.toLowerCase().includes(q) ||
        v.name.hi.includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.modelName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export function formatLakh(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  return `₹${(amount / 100000).toFixed(2)} L`;
}
