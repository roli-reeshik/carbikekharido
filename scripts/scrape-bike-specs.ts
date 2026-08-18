/**
 * Backfill structured two-wheeler specs from BikeDekho into `bike_specs`.
 *
 * Run: npm run specs:bikes -- [options]
 *
 *   --limit=N        stop after N models (default: all)
 *   --brand=slug     only this brand, e.g. --brand=royal-enfield
 *   --concurrency=N  parallel requests (default 3; be considerate)
 *   --force          re-scrape models refreshed within the last 7 days
 *   --dry            parse and report without writing to the database
 *   --verbose        print per-model completeness, worst first
 *
 * Safe to interrupt and re-run: models scraped in the last 7 days are skipped
 * unless --force is passed, so a run resumes rather than starting over.
 */
import "dotenv/config";
import { BikeDekhoSpecScraper, type BikeSpecTarget } from "../services/scraping/scrapers/bikedekho.scraper";
import {
  getBikeSpecCoverage,
  getFreshlyScrapedModelIds,
  LOW_COMPLETENESS_THRESHOLD,
  saveBikeSpecs,
} from "../services/scraping/bikeSpecRepo";
import { getIndiaCatalogIndex } from "../src/lib/catalog/indiaCatalog";

const REFRESH_DAYS = 7;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : undefined;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function bar(done: number, total: number, width = 30): string {
  const filled = total ? Math.round((done / total) * width) : 0;
  return `[${"#".repeat(filled)}${".".repeat(width - filled)}]`;
}

async function main() {
  const limit = arg("limit") ? Number(arg("limit")) : undefined;
  const brand = arg("brand");
  const concurrency = arg("concurrency") ? Number(arg("concurrency")) : 3;
  const force = flag("force");
  const dry = flag("dry");

  const index = await getIndiaCatalogIndex();
  let models = index.models.filter((m) => m.category === "bike" || m.category === "scooter");
  console.log(`Catalog holds ${models.length} two-wheeler models.`);

  if (brand) {
    models = models.filter((m) => m.brandSlug === brand);
    console.log(`Filtered to brand "${brand}": ${models.length} models.`);
  }

  if (!force && !dry) {
    const fresh = await getFreshlyScrapedModelIds(REFRESH_DAYS);
    const before = models.length;
    models = models.filter((m) => !fresh.has(m.id));
    if (before !== models.length) {
      console.log(`Skipping ${before - models.length} scraped within ${REFRESH_DAYS} days.`);
    }
  }

  if (limit) models = models.slice(0, limit);

  if (!models.length) {
    console.log("Nothing to scrape.");
    return;
  }

  const targets: BikeSpecTarget[] = models.map((m) => ({
    modelId: m.id,
    brandSlug: m.brandSlug,
    modelSlug: m.modelSlug,
    modelName: m.modelName,
    sourceUrl: m.sourceUrl,
  }));

  console.log(`\nScraping ${targets.length} models at concurrency ${concurrency}${dry ? " (dry run)" : ""}...\n`);
  const startedAt = Date.now();

  const scraper = new BikeDekhoSpecScraper({
    concurrency,
    onProgress: (p) => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = p.completed / Math.max(elapsed, 1);
      const eta = rate > 0 ? Math.round((p.total - p.completed) / rate) : 0;
      process.stdout.write(
        `\r  ${bar(p.completed, p.total)} ${p.completed}/${p.total}  ok=${p.succeeded} fail=${p.failed}  eta=${eta}s   `
      );
    },
  });

  const { results, failures } = await scraper.scrapeMany(targets);
  process.stdout.write("\n\n");

  // Report on-sale models separately: unreleased bikes have no published specs,
  // so mixing them in would make a healthy run look broken.
  const onSale = results.filter((r) => !r.spec.isUpcoming);
  const upcoming = results.length - onSale.length;
  const withSeat = onSale.filter((r) => r.spec.seatHeightMm !== undefined).length;
  const withWeight = onSale.filter((r) => r.spec.kerbWeightKg !== undefined).length;
  const avg = onSale.length
    ? Math.round(onSale.reduce((s, r) => s + r.completeness, 0) / onSale.length)
    : 0;

  console.log(`Scraped   : ${results.length}  (${onSale.length} on sale, ${upcoming} upcoming)`);
  console.log(`Failed    : ${failures.length}`);
  console.log(`Avg score : ${avg}%  (on-sale models only)`);
  console.log(`Seat height present : ${withSeat}/${onSale.length}`);
  console.log(`Kerb weight present : ${withWeight}/${onSale.length}`);

  if (failures.length) {
    console.log(`\nFirst failures:`);
    failures.slice(0, 10).forEach((f) => console.log(`   ${f.modelId} — ${f.reason}`));
  }

  if (flag("verbose")) {
    console.log(`\nPer-model (worst first):`);
    [...results]
      .sort((a, b) => a.completeness - b.completeness)
      .forEach((r) =>
        console.log(
          `   ${String(r.completeness).padStart(3)}%  ${r.modelName.padEnd(34)} ` +
            `cc=${r.spec.displacementCc ?? "-"} seat=${r.spec.seatHeightMm ?? "-"} ` +
            `kerb=${r.spec.kerbWeightKg ?? "-"} body=${r.spec.bodyType ?? "-"}` +
            `${r.spec.isUpcoming ? "  [upcoming]" : ""}`
        )
      );
  }

  if (dry) {
    console.log("\nDry run — nothing written.");
    return;
  }

  const saved = await saveBikeSpecs(results);
  console.log(
    `\nSaved: ${saved.created} created, ${saved.updated} updated, ${saved.errors} errors.` +
      `\n  ${saved.lowCompleteness} on-sale models below ${LOW_COMPLETENESS_THRESHOLD}% — review these if the count is high.`
  );

  const c = await getBikeSpecCoverage();
  console.log(`\n===== bike_specs coverage (on-sale models) =====`);
  console.log(`  rows              ${c.total}  (${c.onSale} on sale, ${c.upcoming} upcoming)`);
  console.log(`  seat height       ${c.withSeatHeight}/${c.onSale}`);
  console.log(`  kerb weight       ${c.withKerbWeight}/${c.onSale}`);
  console.log(`  displacement      ${c.withDisplacement}/${c.onSale}`);
  console.log(`  body type         ${c.withBodyType}/${c.onSale}`);
  console.log(`  electric          ${c.electric}`);
  console.log(`  avg completeness  ${c.avgCompleteness}%`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nBackfill failed:", err);
    process.exit(1);
  });
