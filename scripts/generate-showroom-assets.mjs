import fs from "fs";
import path from "path";

const vehiclesDir = path.resolve("public/assets/vehicles");
if (!fs.existsSync(vehiclesDir)) {
  fs.mkdirSync(vehiclesDir, { recursive: true });
}

function generateCarSvg(name, brand, colorHex) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <defs>
    <radialGradient id="underGlow_${brand}" cx="50%" cy="80%" r="50%">
      <stop offset="0%" stop-color="${colorHex}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${colorHex}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bodyGrad_${brand}" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="50%" stop-color="#181818"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="roofGrad_${brand}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#383838"/>
      <stop offset="100%" stop-color="#121212"/>
    </linearGradient>
    <filter id="shadowBlur_${brand}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
    </filter>
  </defs>
  <!-- Floor Contact Shadow & Ambient Glow -->
  <ellipse cx="400" cy="300" rx="340" ry="24" fill="#000000" opacity="0.85" filter="url(#shadowBlur_${brand})"/>
  <ellipse cx="400" cy="295" rx="280" ry="18" fill="url(#underGlow_${brand})"/>
  
  <!-- Aerodynamic Low Slung Body -->
  <path d="M120,260 Q180,240 240,240 L330,195 Q400,165 520,165 L610,195 Q680,225 730,250 Q750,265 720,275 L670,280 Q620,240 550,240 Q480,240 430,280 L320,280 Q270,240 200,240 Q130,240 90,280 L70,270 Q60,260 120,260 Z" fill="url(#bodyGrad_${brand})" stroke="${colorHex}" stroke-width="2.5"/>
  
  <!-- Greenhouse / Cockpit Roofline -->
  <path d="M280,220 L350,175 Q420,150 510,150 L580,185 Q620,210 630,225 Z" fill="url(#roofGrad_${brand})" stroke="${colorHex}" stroke-width="1.5" opacity="0.95"/>
  <!-- Tinted Glass Window -->
  <path d="M360,180 Q430,160 505,160 L565,190 Q540,215 420,218 Z" fill="#0d1821" stroke="#ffffff" stroke-width="0.75" opacity="0.85"/>
  
  <!-- Headlight / Tailight LED Strips -->
  <path d="M680,230 Q720,245 730,250" stroke="${colorHex}" stroke-width="4" stroke-linecap="round"/>
  <path d="M80,265 L110,262" stroke="#ff3b30" stroke-width="4" stroke-linecap="round"/>

  <!-- Aero Wing / Spoiler -->
  <path d="M70,235 Q100,230 130,240 L125,255 L75,250 Z" fill="#1f1f1f" stroke="${colorHex}" stroke-width="1.5"/>

  <!-- Front Wheel & Disc Brake -->
  <g transform="translate(200, 275)">
    <circle cx="0" cy="0" r="46" fill="#0c0c0c" stroke="#333333" stroke-width="6"/>
    <circle cx="0" cy="0" r="36" fill="#141414" stroke="${colorHex}" stroke-width="2"/>
    <circle cx="0" cy="0" r="24" fill="#222222"/>
    <path d="M-30,-5 L30,5 M-5,-30 L5,30 M-22,22 L22,-22 M-22,-22 L22,22" stroke="${colorHex}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="0" cy="0" r="10" fill="${colorHex}"/>
  </g>

  <!-- Rear Wheel & Disc Brake -->
  <g transform="translate(550, 275)">
    <circle cx="0" cy="0" r="46" fill="#0c0c0c" stroke="#333333" stroke-width="6"/>
    <circle cx="0" cy="0" r="36" fill="#141414" stroke="${colorHex}" stroke-width="2"/>
    <circle cx="0" cy="0" r="24" fill="#222222"/>
    <path d="M-30,-5 L30,5 M-5,-30 L5,30 M-22,22 L22,-22 M-22,-22 L22,22" stroke="${colorHex}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="0" cy="0" r="10" fill="${colorHex}"/>
  </g>
</svg>`;
}

function generateBikeSvg(name, brand, colorHex) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <defs>
    <radialGradient id="bikeUnderGlow_${brand}" cx="50%" cy="80%" r="50%">
      <stop offset="0%" stop-color="${colorHex}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${colorHex}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bikeBodyGrad_${brand}" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2c2c2c"/>
      <stop offset="60%" stop-color="#141414"/>
      <stop offset="100%" stop-color="#080808"/>
    </linearGradient>
    <filter id="bikeShadowBlur_${brand}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
    </filter>
  </defs>
  <!-- Floor Contact Shadow & Ambient Glow -->
  <ellipse cx="400" cy="305" rx="310" ry="20" fill="#000000" opacity="0.85" filter="url(#bikeShadowBlur_${brand})"/>
  <ellipse cx="400" cy="300" rx="250" ry="16" fill="url(#bikeUnderGlow_${brand})"/>

  <!-- Rear Swingarm & Frame -->
  <path d="M220,265 L360,240 L440,260 L400,280 Z" fill="#1c1c1c" stroke="#444444" stroke-width="2"/>
  <line x1="360" y1="240" x2="480" y2="160" stroke="#555555" stroke-width="5"/>
  <line x1="330" y1="250" x2="420" y2="200" stroke="${colorHex}" stroke-width="3"/>

  <!-- Engine Block & Exhaust Headers -->
  <rect x="350" y="220" width="90" height="60" rx="10" fill="#181818" stroke="#333333" stroke-width="2"/>
  <path d="M370,270 Q390,300 450,290 L480,285" fill="none" stroke="#d4af37" stroke-width="5" stroke-linecap="round"/>
  <!-- Titanium Akrapovic Silencer -->
  <path d="M250,255 L340,270 L345,285 L245,270 Z" fill="#2a2a2a" stroke="${colorHex}" stroke-width="2"/>

  <!-- Aggressive Aero Fairing & Fuel Tank -->
  <path d="M340,195 Q400,145 470,145 Q520,145 550,170 L600,195 Q630,225 580,250 L520,260 L480,230 L390,235 Z" fill="url(#bikeBodyGrad_${brand})" stroke="${colorHex}" stroke-width="2.5"/>
  
  <!-- WSBK Carbon Winglets -->
  <path d="M540,210 L600,205 L590,220 L535,225 Z" fill="#111111" stroke="${colorHex}" stroke-width="1.5"/>

  <!-- Clip-on Handlebars & Windscreen -->
  <path d="M510,145 L545,120 Q565,145 560,175 Z" fill="#00f5d4" opacity="0.25" stroke="#ffffff" stroke-width="1"/>
  <circle cx="515" cy="140" r="6" fill="${colorHex}"/>

  <!-- Sharp Tail Unit / Solo Seat Cowl -->
  <path d="M250,195 L340,195 L330,215 L240,205 Z" fill="#1a1a1a" stroke="${colorHex}" stroke-width="2"/>

  <!-- Front Inverted Öhlins Forks -->
  <line x1="535" y1="150" x2="600" y2="265" stroke="#d4af37" stroke-width="7" stroke-linecap="round"/>

  <!-- Front Wheel with Dual Brembo Discs -->
  <g transform="translate(600, 265)">
    <circle cx="0" cy="0" r="44" fill="#080808" stroke="#222222" stroke-width="6"/>
    <circle cx="0" cy="0" r="32" fill="#141414" stroke="${colorHex}" stroke-width="2"/>
    <path d="M-28,-4 L28,4 M-4,-28 L4,28 M-20,20 L20,-20 M-20,-20 L20,20" stroke="${colorHex}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="0" cy="0" r="8" fill="#d4af37"/>
  </g>

  <!-- Rear Wheel & Sprocket -->
  <g transform="translate(220, 265)">
    <circle cx="0" cy="0" r="46" fill="#080808" stroke="#222222" stroke-width="7"/>
    <circle cx="0" cy="0" r="34" fill="#141414" stroke="${colorHex}" stroke-width="2"/>
    <path d="M-28,-4 L28,4 M-4,-28 L4,28 M-20,20 L20,-20 M-20,-20 L20,20" stroke="${colorHex}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="0" cy="0" r="10" fill="#d4af37"/>
  </g>
</svg>`;
}

const assets = [
  { file: "ferrari-sf90.png", svg: generateCarSvg("SF90 Stradale", "Ferrari", "#ff4500") },
  { file: "ducati-v4r.png", svg: generateBikeSvg("Panigale V4 R", "Ducati", "#00f5d4") },
  { file: "porsche-gt3rs.png", svg: generateCarSvg("911 GT3 RS", "Porsche", "#f5a623") },
  { file: "bmw-m1000rr.png", svg: generateBikeSvg("M 1000 RR", "BMW", "#00e5ff") },
  { file: "lamborghini-revuelto.png", svg: generateCarSvg("Revuelto V12", "Lamborghini", "#ff6b35") },
  { file: "kawasaki-h2r.png", svg: generateBikeSvg("Ninja H2R", "Kawasaki", "#00f5d4") },
  { file: "mclaren-750s.png", svg: generateCarSvg("750S", "McLaren", "#f5a623") },
  { file: "yamaha-r1m.png", svg: generateBikeSvg("YZF-R1M", "Yamaha", "#00e5ff") },
];

for (const a of assets) {
  // Store as svg and also copy for direct preview
  const svgPath = path.join(vehiclesDir, a.file.replace(".png", ".svg"));
  const pngPath = path.join(vehiclesDir, a.file);
  fs.writeFileSync(svgPath, a.svg);
  // Also create a fallback file for png name matching
  fs.writeFileSync(pngPath, a.svg);
}

console.log("Vehicle transparent vector assets generated at public/assets/vehicles/");
