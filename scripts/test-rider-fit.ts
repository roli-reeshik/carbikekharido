/**
 * Rider Fit validation — scores real riders against real bikes from `bike_specs`.
 *
 * Run: npm run test:rider-fit
 *
 * The point is not that it runs, but that the verdicts are defensible. A short
 * rider must be warned off tall bikes, a tall rider must flat-foot nearly
 * everything, and scooters must stay reachable for the riders who depend on them.
 */
import "dotenv/config";
import { scoreFit } from "../src/lib/riderFit/ergonomics";
import { rankBikesForRider, getFitCandidates } from "../src/lib/riderFit/service";
import type { FitBikeSpec, RiderProfile } from "../src/lib/riderFit/types";

const RIDERS: { label: string; profile: RiderProfile }[] = [
  { label: `Short rider — 152 cm, 50 kg, beginner`, profile: { heightCm: 152, weightKg: 50, experience: "beginner", intent: "commute" } },
  { label: `Average rider — 170 cm, 70 kg`, profile: { heightCm: 170, weightKg: 70, experience: "returning", intent: "commute" } },
  { label: `Tall rider — 185 cm, 95 kg, experienced`, profile: { heightCm: 185, weightKg: 95, experience: "experienced", intent: "touring" } },
];

/** Bikes whose verdicts we can sanity-check against widely known real-world fit. */
const SPOT_CHECKS = [
  "Royal Enfield Classic 350",
  "Royal Enfield Himalayan",
  "Honda Activa 6G",
  "Hero Splendor Plus",
  "Royal Enfield Super Meteor 650",
  "KTM 390 Duke",
];

async function main() {
  const all = await getFitCandidates();
  console.log(`Scorable models in bike_specs: ${all.length}\n`);

  const byName = new Map(all.map((b) => [b.modelName.toLowerCase(), b]));
  const picks = SPOT_CHECKS.map((n) => byName.get(n.toLowerCase())).filter(
    (b): b is FitBikeSpec => Boolean(b)
  );

  console.log("==================== SPOT CHECKS ====================");
  for (const rider of RIDERS) {
    console.log(`\n### ${rider.label}`);
    for (const bike of picks) {
      const fit = scoreFit(rider.profile, bike);
      console.log(
        `  ${String(fit.overall).padStart(3)}  ${bike.modelName.padEnd(30)} ` +
          `seat=${bike.seatHeightMm} kerb=${bike.kerbWeightKg}  ` +
          `${fit.reach.verdict.padEnd(16)} gap=${String(fit.reach.gapMm).padStart(4)}mm  ` +
          `${fit.manageability.verdict}${fit.cautioned ? "  [CAUTION]" : ""}`
      );
    }
  }

  console.log("\n\n==================== TOP MATCHES ====================");
  for (const rider of RIDERS) {
    const { results, candidatesConsidered, unscorable, assumptions } = await rankBikesForRider(
      rider.profile,
      { limit: 8 }
    );
    console.log(`\n### ${rider.label}`);
    console.log(`    considered ${candidatesConsidered} models (${unscorable} unscorable)`);
    for (const r of results) {
      console.log(
        `  ${String(r.overall).padStart(3)}  ${r.bike.modelName.padEnd(30)} ` +
          `seat=${r.bike.seatHeightMm} kerb=${r.bike.kerbWeightKg} ${r.reach.verdict}`
      );
    }
    console.log(`    assumptions: ${assumptions.notes.join(" ")}`);
  }

  // A short rider should never be told a tall adventure bike is a great fit.
  console.log("\n\n==================== SAFETY CHECK ====================");
  const shortRider = RIDERS[0].profile;
  const tallBikes = all.filter((b) => b.seatHeightMm >= 820);
  const wronglyApproved = tallBikes
    .map((b) => scoreFit(shortRider, b))
    .filter((f) => f.overall >= 70 && !f.cautioned);

  console.log(`Tall bikes (seat >= 820mm): ${tallBikes.length}`);
  console.log(
    wronglyApproved.length === 0
      ? "PASS — none scored >= 70 for a 152 cm rider without a caution."
      : `FAIL — ${wronglyApproved.length} tall bikes approved for a 152 cm rider:`
  );
  wronglyApproved
    .slice(0, 10)
    .forEach((f) => console.log(`   ${f.overall}  ${f.bike.modelName} seat=${f.bike.seatHeightMm}`));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
