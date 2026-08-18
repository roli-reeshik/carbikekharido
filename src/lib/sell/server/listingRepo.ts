import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export async function saveListingMedia(
  vehicleId: string,
  items: { dataUrl: string; type: "photo" | "video"; order: number; isThumb: boolean }[]
) {
  const dir = path.join(process.cwd(), "public", "uploads", "listings", vehicleId);
  await fs.mkdir(dir, { recursive: true });

  const saved: { url: string; type: "PHOTO" | "VIDEO"; order: number; isThumb: boolean }[] = [];

  for (const item of items) {
    const ext = item.type === "photo" ? "jpg" : "mp4";
    const fileName = `${item.order}-${Date.now()}.${ext}`;
    const filePath = path.join(dir, fileName);

    const base64 = item.dataUrl.includes(",") ? item.dataUrl.split(",")[1] : item.dataUrl;
    await fs.writeFile(filePath, Buffer.from(base64, "base64"));

    saved.push({
      url: `/uploads/listings/${vehicleId}/${fileName}`,
      type: item.type === "photo" ? "PHOTO" : "VIDEO",
      order: item.order,
      isThumb: item.isThumb,
    });
  }

  return saved;
}
