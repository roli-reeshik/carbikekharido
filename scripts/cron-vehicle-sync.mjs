/**
 * Standalone cron runner for self-hosted deployments (PM2, Windows Task Scheduler, Linux cron).
 *
 * Schedule at 02:00 IST daily:
 *   Linux: 0 2 * * * cd /path/to/carbikekharido && node scripts/cron-vehicle-sync.mjs
 *   Windows Task Scheduler: daily 02:00, action = node scripts\cron-vehicle-sync.mjs
 *
 * Requires CRON_SECRET and a running Next.js server (npm run start) OR set SYNC_API_BASE_URL.
 */
import cron from "node-cron";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.SYNC_API_BASE_URL ?? "http://localhost:3000";
const CRON_EXPR = process.env.SYNC_CRON_EXPR ?? "0 2 * * *"; // 02:00 server local time — set TZ=Asia/Kolkata

if (!CRON_SECRET) {
  console.error("CRON_SECRET is required");
  process.exit(1);
}

async function triggerSync() {
  const url = `${BASE_URL}/api/cron/sync-vehicles`;
  console.log(`[${new Date().toISOString()}] Triggering vehicle sync → ${url}`);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = await res.json();
    console.log(`[sync] status=${res.status}`, JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("[sync] request failed:", err);
  }
}

// Optional immediate run: node scripts/cron-vehicle-sync.mjs --now
if (process.argv.includes("--now")) {
  triggerSync().then(() => process.exit(0));
} else {
  console.log(`Vehicle sync cron scheduled: "${CRON_EXPR}" (set TZ=Asia/Kolkata for 2 AM IST)`);
  cron.schedule(CRON_EXPR, triggerSync);
}
