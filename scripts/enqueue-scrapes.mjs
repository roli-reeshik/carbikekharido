/**
 * Trigger default scrape batch via API (requires running Next.js + CRON_SECRET).
 * Usage: npm run queue:enqueue
 */
const CRON_SECRET = process.env.CRON_SECRET;
const BASE = process.env.SYNC_API_BASE_URL ?? "http://localhost:3000";

if (!CRON_SECRET) {
  console.error("CRON_SECRET required");
  process.exit(1);
}

const res = await fetch(`${BASE}/api/queue/enqueue?schedule=1`, {
  headers: { Authorization: `Bearer ${CRON_SECRET}` },
});
const body = await res.json();
console.log(res.status, JSON.stringify(body, null, 2));
