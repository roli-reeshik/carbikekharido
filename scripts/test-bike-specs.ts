/**
 * Parser smoke test — fetches a spread of real BikeDekho model pages and prints
 * the structured spec each one yields.
 *
 * Run: npm run test:bike-specs
 *
 * The sample deliberately mixes segments (commuter, cruiser, adventure, sport,
 * scooter, electric) because the parser's job is to survive all of them, and an
 * electric model is the case most likely to break unit assumptions.
 */
import { parseBikeSpecPage } from "../services/scraping/bikeSpecs/parse";
import { CORE_SPEC_FIELDS_ICE, coreFieldsFor } from "../services/scraping/bikeSpecs/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const SAMPLES = [
  "https://www.bikedekho.com/royal-enfield/classic-350",
  "https://www.bikedekho.com/hero/splendor-plus",
  "https://www.bikedekho.com/honda/activa-6g",
  "https://www.bikedekho.com/ktm/390-duke",
  "https://www.bikedekho.com/royal-enfield/himalayan",
  "https://www.bikedekho.com/ola-electric/s1-pro",
  "https://www.bikedekho.com/bajaj/pulsar-125",
  "https://www.bikedekho.com/tvs/apache-rtr-160",
];

const SHOW: string[] = [
  "displacementCc",
  "maxPowerPs",
  "maxTorqueNm",
  "topSpeedKmph",
  "seatHeightMm",
  "kerbWeightKg",
  "groundClearanceMm",
  "wheelbaseMm",
  "fuelTankL",
  "mileageOverallKmpl",
  "emissionNorm",
  "absType",
  "transmissionType",
  "gears",
  "warrantyYears",
  "warrantyKm",
  "serviceIntervalKm",
  "motorKw",
  "batteryKwh",
  "claimedRangeKm",
  "chargeTimeHrs",
  "bodyTypeRaw",
  "bodyType",
  "ridingPosture",
  "powerToWeight",
  "isElectric",
  "ratingAvg",
  "ratingCount",
  "exShowroomMinInr",
  "exShowroomMaxInr",
  "onRoadMinInr",
];

async function main() {
  let ok = 0;
  const coverage = new Map<string, number>();

  for (const url of SAMPLES) {
    process.stdout.write(`\n=== ${url}\n`);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9" },
      });
      if (!res.ok) {
        console.log(`   HTTP ${res.status}`);
        continue;
      }

      const parsed = parseBikeSpecPage(await res.text());
      if (!parsed) {
        console.log("   PARSE FAILED (no state / no pairs)");
        continue;
      }

      ok++;
      console.log(
        `   completeness=${parsed.completeness}%  rawPairs=${Object.keys(parsed.rawSpecs).length}`
      );
      const spec = parsed.spec as Record<string, unknown>;
      for (const key of SHOW) {
        const v = spec[key];
        if (v !== undefined) console.log(`   ${key.padEnd(20)} ${String(v)}`);
      }

      for (const f of coreFieldsFor(parsed.spec.isElectric)) {
        if (spec[f] !== undefined) coverage.set(f, (coverage.get(f) ?? 0) + 1);
      }
    } catch (err) {
      console.log(`   ERROR ${err instanceof Error ? err.message : String(err)}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n\n===== core field coverage across ${ok}/${SAMPLES.length} pages =====`);
  for (const f of CORE_SPEC_FIELDS_ICE) {
    const n = coverage.get(f) ?? 0;
    const bar = "#".repeat(n).padEnd(SAMPLES.length, ".");
    console.log(`   ${String(f).padEnd(20)} ${bar} ${n}/${ok}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
