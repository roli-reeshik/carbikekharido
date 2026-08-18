/**
 * Apply a single Prisma migration SQL file and register it.
 *   node scripts/apply-prisma-migration.mjs [migration_folder_name]
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");
const migrationName = process.argv[2] || "20260728134000_add_vehicles_module";

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
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

const env = loadEnvLocal();
const sqlPath = path.join(root, "prisma", "migrations", migrationName, "migration.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const conn = await mysql.createConnection({
  host: env.DB_HOST || "127.0.0.1",
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || "root",
  password: env.DB_PASSWORD || "",
  database: env.DB_NAME || "carbikekharido",
  multipleStatements: true,
});

await conn.query(`
  CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
    \`id\` VARCHAR(36) NOT NULL,
    \`checksum\` VARCHAR(64) NOT NULL,
    \`finished_at\` DATETIME(3) NULL,
    \`migration_name\` VARCHAR(255) NOT NULL,
    \`logs\` TEXT NULL,
    \`rolled_back_at\` DATETIME(3) NULL,
    \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`);

const [existing] = await conn.query(
  "SELECT migration_name FROM `_prisma_migrations` WHERE migration_name = ?",
  [migrationName]
);

if (existing.length === 0) {
  await conn.query(sql);
  const crypto = await import("crypto");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");
  await conn.query(
    `INSERT INTO \`_prisma_migrations\` (id, checksum, finished_at, migration_name, applied_steps_count)
     VALUES (UUID(), ?, NOW(3), ?, 1)`,
    [checksum, migrationName]
  );
  console.log(JSON.stringify({ ok: true, applied: migrationName }));
} else {
  console.log(JSON.stringify({ ok: true, skipped: migrationName, reason: "already_applied" }));
}

const [tables] = await conn.query(
  `SELECT TABLE_NAME FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (
     'app_users','sellers','marketplace_vehicles','marketplace_vehicle_images',
     'marketplace_wishlists','marketplace_inquiries','marketplace_reviews','marketplace_price_alerts'
   ) ORDER BY TABLE_NAME`,
  [env.DB_NAME || "carbikekharido"]
);

await conn.end();
console.log(JSON.stringify({ tables: tables.map((t) => t.TABLE_NAME) }));
