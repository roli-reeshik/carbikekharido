/** Print DATABASE_URL from .env.local for Prisma CLI usage. */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const user = encodeURIComponent(env.DB_USER || "root");
const pass = encodeURIComponent(env.DB_PASSWORD || "");
const host = env.DB_HOST || "127.0.0.1";
const port = env.DB_PORT || "3306";
const db = env.DB_NAME || "carbikekharido";
process.stdout.write(`mysql://${user}:${pass}@${host}:${port}/${db}`);
