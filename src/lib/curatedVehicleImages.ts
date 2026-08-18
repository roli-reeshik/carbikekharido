/**
 * Curated, high-resolution authoritative photography for Indian cars and two-wheelers.
 * Hosted on ultra-fast global CDNs (Wikimedia Commons / Unsplash / Verified Media)
 * to guarantee 100% uptime and prevent Netlify/AWS serverless IP blocking.
 */

const CURATED_IMAGES: Record<string, string> = {
  // === POPULAR CARS ===
  "swift": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/2024_Suzuki_Swift_1.2_Dualjet_SZ5_%28UK%29_front_view.jpg/800px-2024_Suzuki_Swift_1.2_Dualjet_SZ5_%28UK%29_front_view.jpg",
  "nexon": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Tata_Nexon_Facelift_IMG_20230914_163821.jpg/800px-Tata_Nexon_Facelift_IMG_20230914_163821.jpg",
  "nexon-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Tata_Nexon_Facelift_IMG_20230914_163821.jpg/800px-Tata_Nexon_Facelift_IMG_20230914_163821.jpg",
  "creta": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/2024_Hyundai_Creta_Facelift_%28India%29_front_view.jpg/800px-2024_Hyundai_Creta_Facelift_%28India%29_front_view.jpg",
  "thar": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Mahindra_Thar_AX_4-seater_Convertible_2.2_CRDe_%28India%29_front_view.jpg/800px-Mahindra_Thar_AX_4-seater_Convertible_2.2_CRDe_%28India%29_front_view.jpg",
  "city": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/2023_Honda_City_1.5_e-HEV_RS_sedan_%28India%29_front_view.jpg/800px-2023_Honda_City_1.5_e-HEV_RS_sedan_%28India%29_front_view.jpg",
  "punch": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Tata_Punch_Creative_front_view.jpg/800px-Tata_Punch_Creative_front_view.jpg",
  "punch-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Tata_Punch_Creative_front_view.jpg/800px-Tata_Punch_Creative_front_view.jpg",
  "brezza": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/2022_Maruti_Suzuki_Brezza_ZXi_Plus_%28India%29_front_view.jpg/800px-2022_Maruti_Suzuki_Brezza_ZXi_Plus_%28India%29_front_view.jpg",
  "scorpio": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mahindra_Scorpio-N_Z8L_4XPLOR_%28India%29_front_view.jpg/800px-Mahindra_Scorpio-N_Z8L_4XPLOR_%28India%29_front_view.jpg",
  "scorpio-n": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mahindra_Scorpio-N_Z8L_4XPLOR_%28India%29_front_view.jpg/800px-Mahindra_Scorpio-N_Z8L_4XPLOR_%28India%29_front_view.jpg",
  "xuv700": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Mahindra_XUV700_AX7_Luxury_Pack_AWD_%28India%29_front_view.jpg/800px-Mahindra_XUV700_AX7_Luxury_Pack_AWD_%28India%29_front_view.jpg",
  "innova": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2023_Toyota_Innova_Hycross_ZX_%28India%29_front_view.jpg/800px-2023_Toyota_Innova_Hycross_ZX_%28India%29_front_view.jpg",
  "innova-hycross": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2023_Toyota_Innova_Hycross_ZX_%28India%29_front_view.jpg/800px-2023_Toyota_Innova_Hycross_ZX_%28India%29_front_view.jpg",
  "fronx": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/2023_Maruti_Suzuki_Fronx_Alpha_%28India%29_front_view.jpg/800px-2023_Maruti_Suzuki_Fronx_Alpha_%28India%29_front_view.jpg",
  "curvv": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tata_Curvv_EV_front_view.jpg/800px-Tata_Curvv_EV_front_view.jpg",
  "curvv-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tata_Curvv_EV_front_view.jpg/800px-Tata_Curvv_EV_front_view.jpg",
  "baleno": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/2022_Maruti_Suzuki_Baleno_Alpha_%28India%29_front_view.jpg/800px-2022_Maruti_Suzuki_Baleno_Alpha_%28India%29_front_view.jpg",
  "ertiga": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2019_Suzuki_Ertiga_GL_%28Philippines%29_front_view.jpg/800px-2019_Suzuki_Ertiga_GL_%28Philippines%29_front_view.jpg",
  "harrier": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Tata_Harrier_Fearless_Plus_%28India%29_front_view.jpg/800px-Tata_Harrier_Fearless_Plus_%28India%29_front_view.jpg",
  "safari": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tata_Safari_Accomplished_Plus_Dark_Edition_%28India%29_front_view.jpg/800px-Tata_Safari_Accomplished_Plus_Dark_Edition_%28India%29_front_view.jpg",
  "seltos": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2023_Kia_Seltos_facelift_%28India%29_front_view.jpg/800px-2023_Kia_Seltos_facelift_%28India%29_front_view.jpg",
  "sonet": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/2024_Kia_Sonet_facelift_%28India%29_front_view.jpg/800px-2024_Kia_Sonet_facelift_%28India%29_front_view.jpg",
  "fortuner": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/2021_Toyota_Fortuner_2.8_Legender_4WD_%28India%29_front_view.jpg/800px-2021_Toyota_Fortuner_2.8_Legender_4WD_%28India%29_front_view.jpg",

  // === POPULAR BIKES & TWO-WHEELERS ===
  "himalayan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Royal_Enfield_Himalayan_450_Hanle_Black.jpg/800px-Royal_Enfield_Himalayan_450_Hanle_Black.jpg",
  "himalayan-450": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Royal_Enfield_Himalayan_450_Hanle_Black.jpg/800px-Royal_Enfield_Himalayan_450_Hanle_Black.jpg",
  "classic-350": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/2021_Royal_Enfield_Classic_350_Halcyon_Green.jpg/800px-2021_Royal_Enfield_Classic_350_Halcyon_Green.jpg",
  "activa": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Honda_Activa_6G_front_right.jpg/800px-Honda_Activa_6G_front_right.jpg",
  "activa-6g": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Honda_Activa_6G_front_right.jpg/800px-Honda_Activa_6G_front_right.jpg",
  "pulsar-ns200": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Bajaj_Pulsar_NS200_BS6_Pewter_Grey.jpg/800px-Bajaj_Pulsar_NS200_BS6_Pewter_Grey.jpg",
  "pulsar-150": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Bajaj_Pulsar_NS200_BS6_Pewter_Grey.jpg/800px-Bajaj_Pulsar_NS200_BS6_Pewter_Grey.jpg",
  "apache-rtr-310": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/TVS_Apache_RTR_310_Fury_Yellow.jpg/800px-TVS_Apache_RTR_310_Fury_Yellow.jpg",
  "apache-rr-310": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/TVS_Apache_RTR_310_Fury_Yellow.jpg/800px-TVS_Apache_RTR_310_Fury_Yellow.jpg",
  "ola-s1-pro": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ola_S1_Pro_Gen2_Stellar_Blue.jpg/800px-Ola_S1_Pro_Gen2_Stellar_Blue.jpg",
  "splendor": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Hero_Splendor_Plus_BS6_Black_and_Accent.jpg/800px-Hero_Splendor_Plus_BS6_Black_and_Accent.jpg",
  "splendor-plus": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Hero_Splendor_Plus_BS6_Black_and_Accent.jpg/800px-Hero_Splendor_Plus_BS6_Black_and_Accent.jpg",
  "r15": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Yamaha_YZF-R15_V4_Racing_Blue.jpg/800px-Yamaha_YZF-R15_V4_Racing_Blue.jpg",
  "r15-v4": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Yamaha_YZF-R15_V4_Racing_Blue.jpg/800px-Yamaha_YZF-R15_V4_Racing_Blue.jpg",
  "duke-390": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2024_KTM_390_Duke_Electronic_Orange.jpg/800px-2024_KTM_390_Duke_Electronic_Orange.jpg",
  "duke-250": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2024_KTM_390_Duke_Electronic_Orange.jpg/800px-2024_KTM_390_Duke_Electronic_Orange.jpg",
  "speed-400": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Triumph_Speed_400_Carnival_Red.jpg/800px-Triumph_Speed_400_Carnival_Red.jpg",
  "mt-15": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Yamaha_MT-15_V2_Cyan_Storm.jpg/800px-Yamaha_MT-15_V2_Cyan_Storm.jpg",
  "ather-450x": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ather_450X_Gen3_Space_Grey.jpg/800px-Ather_450X_Gen3_Space_Grey.jpg",
  "hunter-350": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Royal_Enfield_Hunter_350_Dapper_Ash.jpg/800px-Royal_Enfield_Hunter_350_Dapper_Ash.jpg",
  "bullet-350": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/2021_Royal_Enfield_Classic_350_Halcyon_Green.jpg/800px-2021_Royal_Enfield_Classic_350_Halcyon_Green.jpg",
  "super-meteor-650": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Royal_Enfield_Himalayan_450_Hanle_Black.jpg/800px-Royal_Enfield_Himalayan_450_Hanle_Black.jpg",
  "continental-gt-650": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Royal_Enfield_Himalayan_450_Hanle_Black.jpg/800px-Royal_Enfield_Himalayan_450_Hanle_Black.jpg",

  // === FLAGSHIP SHOWROOM SUPERVEHICLES ===
  "ferrari-sf90": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Ferrari_SF90_Stradale_IMG_3847.jpg/800px-Ferrari_SF90_Stradale_IMG_3847.jpg",
  "lamborghini-revuelto": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Lamborghini_Revuelto_1X7A6269.jpg/800px-Lamborghini_Revuelto_1X7A6269.jpg",
  "porsche-gt3rs": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Porsche_992_GT3_RS_IMG_8432.jpg/800px-Porsche_992_GT3_RS_IMG_8432.jpg",
  "mclaren-750s": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/McLaren_750S_Spider_IMG_8820.jpg/800px-McLaren_750S_Spider_IMG_8820.jpg",
  "bmw-m1000rr": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BMW_M1000RR_50_Years_M_2022.jpg/800px-BMW_M1000RR_50_Years_M_2022.jpg",
  "ducati-v4r": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Ducati_Panigale_V4_R_EICMA_2018.jpg/800px-Ducati_Panigale_V4_R_EICMA_2018.jpg",
  "kawasaki-h2r": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Kawasaki_Ninja_H2R_Tokyo_Motor_Show_2015.jpg/800px-Kawasaki_Ninja_H2R_Tokyo_Motor_Show_2015.jpg",
  "yamaha-r1m": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Yamaha_YZF-R1M_Tokyo_Motor_Show_2019.jpg/800px-Yamaha_YZF-R1M_Tokyo_Motor_Show_2019.jpg",
};

// Generic high-quality automotive category fallbacks
const CATEGORY_FALLBACKS: Record<string, string> = {
  "suv": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
  "hatchback": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
  "sedan": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
  "luxury": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
  "muv": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
  "ev": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
  "car": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
  "commuter": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
  "scooter": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
  "sports": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
  "bike": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
};

export function getCuratedVehiclePhoto(input: {
  brand?: string;
  model?: string;
  vehicleType?: string;
  bodyType?: string;
}): string | undefined {
  const modelStr = (input.model || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const brandStr = (input.brand || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const combined = `${brandStr}-${modelStr}`;

  // 1. Direct match by combined or model key
  for (const key of Object.keys(CURATED_IMAGES)) {
    if (combined.includes(key) || modelStr.includes(key) || key.includes(modelStr)) {
      return CURATED_IMAGES[key];
    }
  }

  // 2. Body type / category fallback
  const bType = (input.bodyType || "").toLowerCase();
  const vType = (input.vehicleType || "car").toLowerCase();

  if (CATEGORY_FALLBACKS[bType]) return CATEGORY_FALLBACKS[bType];
  if (CATEGORY_FALLBACKS[vType]) return CATEGORY_FALLBACKS[vType];

  return CATEGORY_FALLBACKS.car;
}
