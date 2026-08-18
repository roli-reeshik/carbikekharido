import { BodyType, VehicleType } from "@/lib/vehicles";

/**
 * Deliberately NOT a real manufacturer photo. These are original,
 * generic silhouettes — illustrative placeholders standing in for the
 * real vehicle photography a licensed image source would provide.
 * See README's "Vehicle imagery" section for how to source real photos
 * legitimately (manufacturer press/media kits, or a paid automotive
 * data provider) and swap them in here without touching any calling code.
 */
export function VehicleIllustration({
  vehicleType,
  bodyType,
  className = "",
}: {
  vehicleType: VehicleType;
  bodyType: BodyType;
  className?: string;
}) {
  if (vehicleType === "bike") {
    return (
      <svg viewBox="0 0 200 110" className={className} role="img" aria-label="Bike illustration">
        <rect width="200" height="110" fill="#EAF0EF" />
        <circle cx="52" cy="80" r="22" fill="none" stroke="#1F6F6B" strokeWidth="5" />
        <circle cx="150" cy="80" r="22" fill="none" stroke="#1F6F6B" strokeWidth="5" />
        <path
          d="M52 80 L88 50 H126 L150 80 M88 50 L100 30 H118"
          fill="none"
          stroke="#132A46"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M126 50 L150 80" stroke="#132A46" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="118" cy="30" r="4" fill="#132A46" />
      </svg>
    );
  }

  // Cars — silhouette shape varies slightly by body type so the grid
  // doesn't look like one shape repeated with a different label.
  const roofPath: Record<string, string> = {
    suv: "M35 68 L48 40 H150 L164 68",
    hatchback: "M40 68 L52 44 H140 L156 68",
    sedan: "M32 68 L48 44 H90 L108 40 H150 L168 68",
    muv: "M30 68 L44 38 H156 L172 68",
    luxury: "M34 68 L50 42 H148 L166 68",
  };
  const path = roofPath[bodyType] ?? roofPath.suv;

  return (
    <svg viewBox="0 0 200 110" className={className} role="img" aria-label="Car illustration">
      <rect width="200" height="110" fill="#EAEDF2" />
      <path d={path} fill="none" stroke="#132A46" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="68" width="140" height="14" rx="4" fill="#132A46" />
      <circle cx="60" cy="84" r="12" fill="#151821" />
      <circle cx="140" cy="84" r="12" fill="#151821" />
      <circle cx="60" cy="84" r="5" fill="#EAEDF2" />
      <circle cx="140" cy="84" r="5" fill="#EAEDF2" />
    </svg>
  );
}
