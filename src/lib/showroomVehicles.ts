export interface ShowroomVehicle {
  id: string;
  type: "car" | "bike";
  category: "supercar" | "hypercar" | "superbike" | "grand-tourer" | "track-monster" | "electric-gt";
  categoryLabel: { en: string; hi: string };
  brand: string;
  model: string;
  tagline: { en: string; hi: string };
  watermark: string;
  price: number; // in INR
  priceDisplay: string;
  acceleration0to100: string;
  topSpeed: string;
  power: string;
  engine: string;
  transmission: string;
  weight: string;
  badge: string;
  accentColor: "amber" | "cyan" | "flame" | "gold";
  image: string;
  heroSnippet: { en: string; hi: string };
  highlights: string[];
}

export const SHOWROOM_VEHICLES: ShowroomVehicle[] = [
  {
    id: "ferrari-sf90-stradale",
    type: "car",
    category: "hypercar",
    categoryLabel: { en: "Plug-in Hybrid Hypercar", hi: "प्लग-इन हाइब्रिड हाइपरकार" },
    brand: "Ferrari",
    model: "SF90 Stradale",
    tagline: { en: "1,000 CV of Pure Maranello Electrification", hi: "1,000 CV का शुद्ध मारानेलो इलेक्ट्रिफ़िकेशन" },
    watermark: "FERRARI",
    price: 75000000,
    priceDisplay: "₹7.50 Cr",
    acceleration0to100: "2.5s",
    topSpeed: "340 km/h",
    power: "1,000 CV / 986 bhp",
    engine: "4.0L Twin-Turbo V8 + 3 Electric Motors",
    transmission: "8-Speed F1 Dual-Clutch",
    weight: "1,570 kg",
    badge: "HYPER HYBRID",
    accentColor: "flame",
    image: "/assets/vehicles/ferrari-sf90.jpg",
    heroSnippet: {
      en: "The fastest road-legal Ferrari ever built, blending twin-turbocharged V8 fury with triple e-motor torque vectoring.",
      hi: "अब तक की सबसे तेज़ रोड-लीगल फेरारी, जो ट्विन-टर्बो V8 और ट्रिपल ई-मोटर को जोड़ती है।"
    },
    highlights: ["eManettino 4 Drive Modes", "RAC-e Front Torque Vectoring", "Forged Titanium Exhaust"]
  },
  {
    id: "ducati-panigale-v4-r",
    type: "bike",
    category: "track-monster",
    categoryLabel: { en: "WSBK Homologation Special", hi: "WSBK होमोलोगेशन स्पेशल" },
    brand: "Ducati",
    model: "Panigale V4 R",
    tagline: { en: "The Closest Thing to a Pure MotoGP Prototype", hi: "प्योर मोटोGP प्रोटोटाइप के सबसे करीब" },
    watermark: "DUCATI",
    price: 6999000,
    priceDisplay: "₹69.99 L",
    acceleration0to100: "2.7s",
    topSpeed: "330+ km/h",
    power: "240.5 bhp @ 16,500 rpm",
    engine: "998cc Desmosedici Stradale R V4",
    transmission: "6-Speed with Ducati Quick Shift EVO 2",
    weight: "167 kg (Dry)",
    badge: "16,500 RPM",
    accentColor: "cyan",
    image: "/assets/vehicles/ducati-v4r.jpg",
    heroSnippet: {
      en: "Desmodromic valve timing screaming to a staggering 16,500 RPM with carbon winglets producing 30kg downforce.",
      hi: "डेस्मोड्रोमिक वाल्व टाइमिंग 16,500 RPM तक और कार्बन विंगलेट्स 30kg डाउनफोर्स के साथ।"
    },
    highlights: ["Carbon Biplane Wings", "Öhlins NPX 25/30 Pressurized Fork", "Dry Slipper Clutch"]
  },
  {
    id: "porsche-911-gt3-rs",
    type: "car",
    category: "track-monster",
    categoryLabel: { en: "Naturally Aspirated Track Weapon", hi: "नेचुरली एस्पिरेटेड ट्रैक वेपन" },
    brand: "Porsche",
    model: "911 GT3 RS (992)",
    tagline: { en: "Active Aerodynamics & 9,000 RPM Flat-Six Symphony", hi: "एक्टिव एयरोडायनामिक्स और 9,000 RPM फ्लैट-सिक्स सिम्फनी" },
    watermark: "PORSCHE",
    price: 35100000,
    priceDisplay: "₹3.51 Cr",
    acceleration0to100: "3.2s",
    topSpeed: "296 km/h",
    power: "525 PS / 518 bhp",
    engine: "4.0L Naturally Aspirated Boxer-6",
    transmission: "7-Speed Porsche Doppelkupplung (PDK)",
    weight: "1,450 kg",
    badge: "DRS ACTIVE AERO",
    accentColor: "amber",
    image: "/assets/vehicles/porsche-gt3rs.png",
    heroSnippet: {
      en: "860 kg of downforce at 285 km/h, F1-style active DRS rear wing, and steering-wheel rotary damper adjustments.",
      hi: "285 km/h पर 860 kg डाउनफोर्स, F1-स्टाइल एक्टिव DRS विंग और ऑन-स्टीयरिंग रोटरी डैम्पर कंट्रोल।"
    },
    highlights: ["Carbon-Fiber Weissach Pack", "Formula-1 Drag Reduction System (DRS)", "Individual Damper Dials"]
  },
  {
    id: "bmw-m1000rr",
    type: "bike",
    category: "superbike",
    categoryLabel: { en: "M-Division Superbike", hi: "M-डिवीजन सुपरबाइक" },
    brand: "BMW Motorrad",
    model: "M 1000 RR",
    tagline: { en: "Motorsport DNA Engineered for Uncompromising Velocity", hi: "मोटरस्पोर्ट DNA जो समझौता न करने वाली गति के लिए बना है" },
    watermark: "BMW M",
    price: 4900000,
    priceDisplay: "₹49.00 L",
    acceleration0to100: "2.9s",
    topSpeed: "314 km/h",
    power: "212 bhp @ 14,500 rpm",
    engine: "999cc Water-Cooled Inline-4 with ShiftCam",
    transmission: "6-Speed with M Competition Shifter",
    weight: "170 kg",
    badge: "M COMPETITION",
    accentColor: "cyan",
    image: "/assets/vehicles/bmw-m1000rr.png",
    heroSnippet: {
      en: "Full carbon fiber aerodynamic fairing with integrated M winglets creating 22.6 kg front-wheel contact pressure.",
      hi: "फुल कार्बन फाइबर फेयरिंग और इंटीग्रेटेड M विंगलेट्स जो 22.6 kg फ्रंट व्हील प्रेशर बनाते हैं।"
    },
    highlights: ["M Carbon Wheels", "ShiftCam Variable Valve Timing", "Pit-Lane Speed Limiter"]
  },
  {
    id: "lamborghini-revuelto",
    type: "car",
    category: "hypercar",
    categoryLabel: { en: "V12 High Performance Electrified Vehicle", hi: "V12 हाई परफॉरमेंस इलेक्ट्रिफाइड व्हीकल" },
    brand: "Lamborghini",
    model: "Revuelto V12",
    tagline: { en: "Sant'Agata's First 1,015 CV V12 Superquadro Hybrid", hi: "सांत'अगाता का पहला 1,015 CV V12 सुपरक्वाड्रो हाइब्रिड" },
    watermark: "LAMBORGHINI",
    price: 88900000,
    priceDisplay: "₹8.89 Cr",
    acceleration0to100: "2.5s",
    topSpeed: "350+ km/h",
    power: "1,015 CV / 1,001 bhp",
    engine: "6.5L Naturally Aspirated V12 + 3 Axial Flux Motors",
    transmission: "8-Speed Transverse Dual-Clutch",
    weight: "1,772 kg",
    badge: "V12 HYBRID",
    accentColor: "flame",
    image: "/assets/vehicles/lamborghini-revuelto.png",
    heroSnippet: {
      en: "An unbridled naturally aspirated 6.5-liter V12 revving to 9,500 RPM backed by instant torque from dual front e-axles.",
      hi: "9,500 RPM तक दहाड़ने वाला 6.5-लीटर V12 इंजन और दोनों फ्रंट व्हील्स पर इंस्टेंट इलेक्ट्रिक टॉर्क।"
    },
    highlights: ["Carbon Monofuselage Chassis", "9,500 RPM Redline", "Electric Torque Vectoring AWD"]
  },
  {
    id: "kawasaki-ninja-h2r",
    type: "bike",
    category: "track-monster",
    categoryLabel: { en: "Supercharged Track Apex", hi: "सुपरचार्ज्ड ट्रैक एपेक्स" },
    brand: "Kawasaki",
    model: "Ninja H2R",
    tagline: { en: "310 Horsepower of Supercharged Aerospace Madness", hi: "सुपरचार्ज्ड एयरोस्पेस इंजीनियरिंग के 310 हॉर्सपावर" },
    watermark: "KAWASAKI",
    price: 7990000,
    priceDisplay: "₹79.90 L",
    acceleration0to100: "2.5s",
    topSpeed: "400 km/h",
    power: "310 PS (326 with Ram Air)",
    engine: "998cc Supercharged DOHC Inline-4",
    transmission: "6-Speed Dog-Ring Racing Gearbox",
    weight: "216 kg (Curb)",
    badge: "SUPERCHARGED",
    accentColor: "cyan",
    image: "/assets/vehicles/kawasaki-h2r.png",
    heroSnippet: {
      en: "Custom planetary-geared centrifugal supercharger spinning at 130,000 RPM pushing 2.4 bar boost.",
      hi: "130,000 RPM पर घूमने वाला प्लेनेटरी सुपरचार्जर जो 2.4 बार का बूस्ट प्रेशर देता है।"
    },
    highlights: ["Aerospace Carbon Winglets", "Silver-Mirror Self-Repairing Paint", "Öhlins TTX36 Shock"]
  },
  {
    id: "mclaren-750s",
    type: "car",
    category: "supercar",
    categoryLabel: { en: "Twin-Turbo Ultralight Supercar", hi: "ट्विन-टर्बो अल्ट्रालाइट सुपरकार" },
    brand: "McLaren",
    model: "750S Coupe",
    tagline: { en: "Purity of Driving Dynamics & 750 PS of Precision", hi: "ड्राइविंग डायनामिक्स की शुद्धता और 750 PS की सटीकता" },
    watermark: "MCLAREN",
    price: 59100000,
    priceDisplay: "₹5.91 Cr",
    acceleration0to100: "2.8s",
    topSpeed: "332 km/h",
    power: "750 PS / 740 bhp",
    engine: "4.0L M840T Twin-Turbo V8",
    transmission: "7-Speed Seamless Shift Gearbox (SSG)",
    weight: "1,277 kg (Dry)",
    badge: "CARBON MONOCAGE",
    accentColor: "amber",
    image: "/assets/vehicles/mclaren-750s.png",
    heroSnippet: {
      en: "Segment-leading power-to-weight ratio of 587 PS-per-tonne and Proactive Chassis Control III hydraulic suspension.",
      hi: "587 PS प्रति टन का सेगमेंट-लीडिंग पावर-टू-वेट रेशियो और PCC III हाइड्रोलिक सस्पेंशन।"
    },
    highlights: ["Active Carbon Rear Airbrake", "Hydraulic Power Steering", "Variable Drift Control (VDC)"]
  },
  {
    id: "yamaha-yzf-r1m",
    type: "bike",
    category: "superbike",
    categoryLabel: { en: "Crossplane Factory Special", hi: "क्रॉसप्लेन फ़ैक्टरी स्पेशल" },
    brand: "Yamaha",
    model: "YZF-R1M",
    tagline: { en: "Uneven 270°-180°-90°-180° Crossplane Throttle Connection", hi: "अनइवन क्रॉसप्लेन थ्रॉटल कनेक्शन और मोटोGP इलेक्ट्रॉनिक्स" },
    watermark: "YAMAHA",
    price: 2850000,
    priceDisplay: "₹28.50 L",
    acceleration0to100: "2.9s",
    topSpeed: "299+ km/h",
    power: "200 PS @ 13,500 rpm",
    engine: "998cc CP4 Crossplane DOHC Inline-4",
    transmission: "6-Speed with Quick Shift System (QSS)",
    weight: "202 kg (Wet)",
    badge: "ÖHLINS ERS",
    accentColor: "cyan",
    image: "/assets/vehicles/yamaha-r1m.png",
    heroSnippet: {
      en: "Öhlins Electronic Racing Suspension (ERS) with NPX gas front forks and full carbon fairing with production number badge.",
      hi: "Öhlins इलेक्ट्रॉनिक रेसिंग सस्पेंशन, NPX गैस फ्रंट फोर्क्स और फुल कार्बन फेयरिंग।"
    },
    highlights: ["Carbon Cowl & Fairing", "6-Axis IMU with Lean Angle Sensor", "Communication Control Unit (CCU)"]
  }
];

export const SHOWROOM_CATEGORIES = [
  { id: "all", label: { en: "All Showroom", hi: "पूरा शोरूम" } },
  { id: "supercar", label: { en: "Supercars & GT", hi: "सुपरकार्स व GT" } },
  { id: "superbike", label: { en: "Superbikes & Track", hi: "सुपरबाइक्स व ट्रैक" } },
  { id: "hypercar", label: { en: "Hypercars (1,000+ HP)", hi: "हाइपरकार्स (1,000+ HP)" } },
  { id: "track-monster", label: { en: "Track Editions", hi: "ट्रैक एडिशन" } },
];
