/**
 * Logical SQL backup via mysql2 (no mysqldump required).
 *   node scripts/backup-db.mjs
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const root = path.resolve(import.meta.dirname, "..");

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) throw new Error("Missing .env.local");
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

function esc(value) {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

const env = loadEnvLocal();
const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const outDir = path.join(root, "backups");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `backup_${ts}.sql`);

const conn = await mysql.createConnection({
  host: env.DB_HOST || "127.0.0.1",
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || "root",
  password: env.DB_PASSWORD || "",
  database: env.DB_NAME || "carbikekharido",
  multipleStatements: true,
});

const lines = [
  "-- CarBikeKharido logical backup",
  `-- Generated: ${new Date().toISOString()}`,
  "SET NAMES utf8mb4;",
  "SET FOREIGN_KEY_CHECKS=0;",
  "",
];

const [tables] = await conn.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
  [env.DB_NAME || "carbikekharido"]
);

for (const { TABLE_NAME: table } of tables) {
  const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
  lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
  lines.push(`${createRows[0]["Create Table"]};`, "");
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    for (const row of rows) {
      const vals = cols.map((c) => esc(row[c]));
      lines.push(`INSERT INTO \`${table}\` (\`${cols.join("`, `")}\`) VALUES (${vals.join(", ")});`);
    }
    lines.push("");
  }
}

lines.push("SET FOREIGN_KEY_CHECKS=1;", "");
await conn.end();

fs.writeFileSync(outFile, lines.join("\n"), "utf8");
console.log(JSON.stringify({ ok: true, file: outFile, bytes: fs.statSync(outFile).size, tables: tables.length }));
