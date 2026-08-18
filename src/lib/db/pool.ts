import mysql from "mysql2/promise";

/**
 * One shared connection pool for the whole app. Every repository below
 * imports this same pool — there is deliberately no per-feature database
 * client, no second ORM, no parallel connection config. Swapping the
 * database host (e.g. moving from a local MySQL install to a managed
 * instance later) means changing the .env file, not code.
 */
declare global {
  // eslint-disable-next-line no-var
  var _cbdPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "cbd_app",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "carbikekharido",
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

// Reuse the pool across Next.js hot-reloads in dev (avoids exhausting
// MySQL's max_connections every time a file change reloads the module).
export const pool: mysql.Pool = global._cbdPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global._cbdPool = pool;
}
