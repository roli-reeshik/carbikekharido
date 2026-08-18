import { createClient } from "redis";

/** Optional health check using the `redis` package (separate from Bull's ioredis). */
export async function pingRedis(): Promise<boolean> {
  const url = process.env.REDIS_URL;
  if (!url) return false;

  const client = createClient({
    url,
    socket: url.startsWith("rediss://") ? { tls: true } : undefined,
  });

  client.on("error", () => {});

  try {
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === "PONG";
  } catch {
    try {
      await client.quit();
    } catch {
      /* ignore */
    }
    return false;
  }
}
