/**
 * One-shot sync for local testing (no cron):
 *   node scripts/run-sync-once.mjs
 *
 * Runs the sync service in-process — requires built Next.js or tsx.
 * Prefer hitting the API route when the dev server is already running:
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-vehicles
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

async function main() {
  process.env.SYNC_STORAGE_MODE ??= "local";

  const secret = process.env.CRON_SECRET ?? "dev-cron-secret";
  const base = process.env.SYNC_API_BASE_URL ?? "http://localhost:3000";

  const res = await fetch(`${base}/api/cron/sync-vehicles`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));
  process.exit(res.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
