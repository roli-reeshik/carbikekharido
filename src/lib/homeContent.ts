import type { BodyType } from "@/lib/vehicles";

export interface BudgetBucket {
  id: string;
  vehicleType: "car" | "bike";
  label: { en: string; hi: string };
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
}

export const BUDGET_BUCKETS: BudgetBucket[] = [
  { id: "car-under-5", vehicleType: "car", label: { en: "Under ₹5 Lakh", hi: "₹5 लाख से कम" }, maxPrice: 500000 },
  { id: "car-5-10", vehicleType: "car", label: { en: "₹5 – 10 Lakh", hi: "₹5 – 10 लाख" }, minPrice: 500000, maxPrice: 1000000 },
  { id: "car-10-15", vehicleType: "car", label: { en: "₹10 – 15 Lakh", hi: "₹10 – 15 लाख" }, minPrice: 1000000, maxPrice: 1500000 },
  { id: "car-15-25", vehicleType: "car", label: { en: "₹15 – 25 Lakh", hi: "₹15 – 25 लाख" }, minPrice: 1500000, maxPrice: 2500000 },
  { id: "car-above-25", vehicleType: "car", label: { en: "Above ₹25 Lakh", hi: "₹25 लाख से ऊपर" }, minPrice: 2500000 },
  { id: "car-ev", vehicleType: "car", label: { en: "Electric Cars", hi: "इलेक्ट्रिक कारें" }, fuelType: "electric" },
  { id: "bike-under-1", vehicleType: "bike", label: { en: "Under ₹1 Lakh", hi: "₹1 लाख से कम" }, maxPrice: 100000 },
  { id: "bike-1-2", vehicleType: "bike", label: { en: "₹1 – 2 Lakh", hi: "₹1 – 2 लाख" }, minPrice: 100000, maxPrice: 200000 },
  { id: "bike-scooter", vehicleType: "bike", label: { en: "Scooters", hi: "स्कूटर" } },
  { id: "bike-sports", vehicleType: "bike", label: { en: "Sports Bikes", hi: "स्पोर्ट्स बाइक" } },
];

export const HOME_BRANDS: { name: string; type: "car" | "bike" | "both"; slug: string }[] = [
  { name: "Maruti Suzuki", type: "car", slug: "maruti-suzuki" },
  { name: "Hyundai", type: "car", slug: "hyundai" },
  { name: "Tata Motors", type: "both", slug: "tata-motors" },
  { name: "Mahindra", type: "car", slug: "mahindra" },
  { name: "Kia", type: "car", slug: "kia" },
  { name: "Toyota", type: "car", slug: "toyota" },
  { name: "Honda", type: "both", slug: "honda" },
  { name: "Hero MotoCorp", type: "bike", slug: "hero-motocorp" },
  { name: "Bajaj", type: "bike", slug: "bajaj" },
  { name: "TVS", type: "bike", slug: "tvs" },
  { name: "Royal Enfield", type: "bike", slug: "royal-enfield" },
  { name: "Yamaha", type: "bike", slug: "yamaha" },
];

export interface NewsArticle {
  id: string;
  slug: string;
  tag: { en: string; hi: string };
  title: { en: string; hi: string };
  excerpt: { en: string; hi: string };
  date: string;
  readTime: number;
  image?: string;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "news-1",
    slug: "petrol-diesel-electric-guide-2026",
    tag: { en: "Buying Guide", hi: "खरीद गाइड" },
    title: {
      en: "Petrol, diesel, or electric — how to decide in 2026",
      hi: "पेट्रोल, डीज़ल या इलेक्ट्रिक — 2026 में सही फैसला कैसे लें",
    },
    excerpt: {
      en: "Running costs, charging infrastructure, and resale value compared across fuel types for Indian buyers.",
      hi: "भारतीय खरीदारों के लिए ईंधन प्रकारों में चलाने की लागत, चार्जिंग इन्फ्रास्ट्रक्चर और पुनर्विक्रय मूल्य की तुलना।",
    },
    date: "2026-07-08",
    readTime: 8,
  },
  {
    id: "news-2",
    slug: "scooter-vs-commuter-mileage",
    tag: { en: "Two-Wheelers", hi: "दोपहिया" },
    title: {
      en: "Scooter vs commuter bike: real mileage numbers compared",
      hi: "स्कूटर बनाम कम्यूटर बाइक: असली माइलेज की तुलना",
    },
    excerpt: {
      en: "We tested 12 popular models in city traffic to find out which actually delivers on paper claims.",
      hi: "हमने शहर के ट्रैफ़िक में 12 लोकप्रिय मॉडलों का परीक्षण किया कि कौन सा वास्तव में दावों पर खरा उतरता है।",
    },
    date: "2026-07-05",
    readTime: 6,
  },
  {
    id: "news-3",
    slug: "vehicle-history-report-guide",
    tag: { en: "Used Vehicles", hi: "पुराने वाहन" },
    title: {
      en: "What a vehicle history report actually protects you from",
      hi: "वाहन हिस्ट्री रिपोर्ट असल में आपको किससे बचाती है",
    },
    excerpt: {
      en: "RTO records, insurance claims, and odometer fraud — what to check before buying used.",
      hi: "RTO रिकॉर्ड, बीमा क्लेम और ओडोमीटर धोखाधड़ी — पुरानी खरीद से पहले क्या जांचें।",
    },
    date: "2026-07-02",
    readTime: 5,
  },
  {
    id: "news-4",
    slug: "best-suvs-under-15-lakh",
    tag: { en: "Reviews", hi: "समीक्षा" },
    title: {
      en: "Top 5 SUVs under ₹15 lakh: space, safety, and value ranked",
      hi: "₹15 लाख से कम की शीर्ष 5 SUV: जगह, सुरक्षा और मूल्य की रैंकिंग",
    },
    excerpt: {
      en: "From Creta to Seltos — we rank the best compact SUVs for Indian families on a budget.",
      hi: "क्रेटा से सेल्टॉस तक — बजट में भारतीय परिवारों के लिए सर्वश्रेष्ठ कॉम्पैक्ट SUV की रैंकिंग।",
    },
    date: "2026-06-28",
    readTime: 10,
  },
  {
    id: "news-5",
    slug: "ev-charging-home-setup",
    tag: { en: "Electric", hi: "इलेक्ट्रिक" },
    title: {
      en: "Home EV charging setup: costs, permits, and what you actually need",
      hi: "घर पर EV चार्जिंग सेटअप: लागत, परमिट और आपको वास्तव में क्या चाहिए",
    },
    excerpt: {
      en: "A practical guide to installing a home charger — from 3-pin to dedicated wallbox.",
      hi: "होम चार्जर इंस्टॉल करने की व्यावहारिक गाइड — 3-पिन से डेडिकेटेड वॉलबॉक्स तक।",
    },
    date: "2026-06-25",
    readTime: 7,
  },
  {
    id: "news-6",
    slug: "monsoon-car-care-tips",
    tag: { en: "Maintenance", hi: "रखरखाव" },
    title: {
      en: "Monsoon car care: 10 things to check before the rains hit",
      hi: "मानसून कार केयर: बारिश से पहले जांचने योग्य 10 बातें",
    },
    excerpt: {
      en: "Wipers, tyres, underbody rust protection, and AC health — your pre-monsoon checklist.",
      hi: "वाइपर, टायर, अंडरबॉडी रस्ट प्रोटेक्शन और AC स्वास्थ्य — आपकी प्री-मानसून चेकलिस्ट।",
    },
    date: "2026-06-20",
    readTime: 4,
  },
];

export const NEWS_TEASERS = NEWS_ARTICLES.slice(0, 3);

export interface UpcomingVehicle {
  id: string;
  name: { en: string; hi: string };
  brand: string;
  /** Used to fetch live photo from CarDekho / BikeDekho */
  modelName: string;
  type: "car" | "bike";
  bodyType: BodyType;
  expectedLaunch: string;
  expectedPrice: { en: string; hi: string };
  officialImageUrl?: string;
}

export const UPCOMING_VEHICLES: UpcomingVehicle[] = [
  {
    id: "upcoming-1",
    name: { en: "Maruti Suzuki e Vitara", hi: "मारुति सुज़ुकी e विटारा" },
    brand: "Maruti Suzuki",
    modelName: "e Vitara",
    type: "car",
    bodyType: "suv",
    expectedLaunch: "Aug 2026",
    expectedPrice: { en: "₹17 – 25 Lakh", hi: "₹17 – 25 लाख" },
  },
  {
    id: "upcoming-2",
    name: { en: "Hyundai Creta Electric", hi: "हुंडई क्रेटा इलेक्ट्रिक" },
    brand: "Hyundai",
    modelName: "Creta Electric",
    type: "car",
    bodyType: "suv",
    expectedLaunch: "Sep 2026",
    expectedPrice: { en: "₹20 – 28 Lakh", hi: "₹20 – 28 लाख" },
  },
  {
    id: "upcoming-3",
    name: { en: "Tata Harrier EV", hi: "टाटा हैरियर EV" },
    brand: "Tata Motors",
    modelName: "Harrier EV",
    type: "car",
    bodyType: "suv",
    expectedLaunch: "Oct 2026",
    expectedPrice: { en: "₹22 – 30 Lakh", hi: "₹22 – 30 लाख" },
  },
  {
    id: "upcoming-4",
    name: { en: "Royal Enfield Himalayan 450", hi: "रॉयल एनफील्ड हिमालयन 450" },
    brand: "Royal Enfield",
    modelName: "Himalayan 450",
    type: "bike",
    bodyType: "sports",
    expectedLaunch: "Jul 2026",
    expectedPrice: { en: "₹2.5 – 3 Lakh", hi: "₹2.5 – 3 लाख" },
  },
];

export interface OfferDeal {
  id: string;
  vehicleName: { en: string; hi: string };
  brand: string;
  discount: { en: string; hi: string };
  validTill: string;
  type: "car" | "bike";
}

export const OFFERS: OfferDeal[] = [
  {
    id: "offer-1",
    vehicleName: { en: "Maruti Suzuki Swift", hi: "मारुति सुज़ुकी स्विफ्ट" },
    brand: "Maruti Suzuki",
    discount: { en: "Up to ₹45,000 cash benefit", hi: "₹45,000 तक कैश बेनिफिट" },
    validTill: "2026-07-31",
    type: "car",
  },
  {
    id: "offer-2",
    vehicleName: { en: "Hyundai Creta", hi: "हुंडई क्रेटा" },
    brand: "Hyundai",
    discount: { en: "₹60,000 exchange bonus", hi: "₹60,000 एक्सचेंज बोनस" },
    validTill: "2026-07-31",
    type: "car",
  },
  {
    id: "offer-3",
    vehicleName: { en: "Tata Nexon EV", hi: "टाटा नेक्सॉन EV" },
    brand: "Tata Motors",
    discount: { en: "Zero down payment + 8.99% ROI", hi: "ज़ीरो डाउन पेमेंट + 8.99% ROI" },
    validTill: "2026-08-15",
    type: "car",
  },
  {
    id: "offer-4",
    vehicleName: { en: "Hero Splendor+", hi: "हीरो स्प्लेंडर+" },
    brand: "Hero MotoCorp",
    discount: { en: "₹3,000 festive discount", hi: "₹3,000 त्योहारी छूट" },
    validTill: "2026-07-31",
    type: "bike",
  },
];

export interface Dealer {
  id: string;
  name: { en: string; hi: string };
  brand: string;
  city: string;
  address: { en: string; hi: string };
  phone: string;
  rating: number;
  type: "car" | "bike" | "both";
}

export const DEMO_DEALERS: Dealer[] = [
  {
    id: "dealer-1",
    name: { en: "Maruti Arena — Gomti Nagar", hi: "मारुति अरेना — गोमती नगर" },
    brand: "Maruti Suzuki",
    city: "Lucknow",
    address: { en: "Plot 42, Vibhuti Khand, Gomti Nagar", hi: "प्लॉट 42, विभूति खंड, गोमती नगर" },
    phone: "+91 98765 43210",
    rating: 4.6,
    type: "car",
  },
  {
    id: "dealer-2",
    name: { en: "Hyundai Motor Plaza", hi: "हुंडई मोटर प्लाज़ा" },
    brand: "Hyundai",
    city: "Lucknow",
    address: { en: "Faizabad Road, Indira Nagar", hi: "फैजाबाद रोड, इंदिरा नगर" },
    phone: "+91 98765 43211",
    rating: 4.4,
    type: "car",
  },
  {
    id: "dealer-3",
    name: { en: "Hero MotoCorp — Hazratganj", hi: "हीरो मोटोकॉर्प — हज़रतगंज" },
    brand: "Hero MotoCorp",
    city: "Lucknow",
    address: { en: "12 MG Marg, Hazratganj", hi: "12 एमजी मार्ग, हज़रतगंज" },
    phone: "+91 98765 43212",
    rating: 4.5,
    type: "bike",
  },
  {
    id: "dealer-4",
    name: { en: "Tata Motors — Alambagh", hi: "टाटा मोटर्स — आलमबाग" },
    brand: "Tata Motors",
    city: "Lucknow",
    address: { en: "Kanpur Road, Alambagh", hi: "कानपुर रोड, आलमबाग" },
    phone: "+91 98765 43213",
    rating: 4.3,
    type: "both",
  },
];

export const CITIES = [
  "Lucknow",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
];
