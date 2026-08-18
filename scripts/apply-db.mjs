/**
 * Apply schema, seeds, and migrations in order.
 *   node scripts/apply-db.mjs
 *
 * Reads DB_* and CRON_SECRET from .env.local (no extra deps).
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) {
    throw new Error("Missing .env.local — copy from .env.example");
  }
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );
}

const DUP_CODES = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_TABLE_EXISTS_ERROR",
]);
const DUP_ERRNOS = new Set([1050, 1060, 1061, 1062]);

async function runFile(conn, filePath, { ignoreDup = false } = {}) {
  const sql = fs.readFileSync(filePath, "utf8");
  try {
    await conn.query(sql);
    console.log("✓", path.relative(root, filePath));
  } catch (err) {
    if (ignoreDup && (DUP_CODES.has(err.code) || DUP_ERRNOS.has(err.errno))) {
      console.log("~", path.relative(root, filePath), "(already applied)");
      return;
    }
    throw err;
  }
}

async function main() {
  const env = loadEnvLocal();
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;

  const bootstrap = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  const files = [
    ["db/schema.sql", {}],
    ["db/seed.sql", { ignoreDup: true }],
    ["db/migrations/002_content_community_editorial.sql", { ignoreDup: true }],
    ["db/migrations/003_aggregator_sync_alter.sql", { ignoreDup: true }],
    ["db/migrations/003_aggregator_sync.sql", {}],
    ["db/seed_editorial.sql", { ignoreDup: true }],
  ];

  for (const [rel, opts] of files) {
    await runFile(conn, path.join(root, rel), opts);
  }

  await conn.end();
  console.log("\nDatabase setup complete.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
