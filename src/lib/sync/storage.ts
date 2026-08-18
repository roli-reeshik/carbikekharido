import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface StorageUploadResult {
  publicUrl: string;
  storageKey: string;
}

export interface VehicleStorageAdapter {
  upload(buffer: Buffer, storageKey: string, contentType: string): Promise<StorageUploadResult>;
}

function publicBaseUrl(): string {
  if (process.env.SYNC_CDN_BASE_URL) return process.env.SYNC_CDN_BASE_URL.replace(/\/$/, "");
  if (process.env.AWS_S3_BUCKET && process.env.AWS_S3_REGION) {
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com`;
  }
  return "";
}

/** Writes optimized assets under public/uploads — zero cloud creds needed locally. */
export class LocalVehicleStorage implements VehicleStorageAdapter {
  private readonly rootDir: string;

  constructor(rootDir = path.join(process.cwd(), "public", "uploads", "vehicles")) {
    this.rootDir = rootDir;
  }

  async upload(buffer: Buffer, storageKey: string, _contentType: string): Promise<StorageUploadResult> {
    const filePath = path.join(this.rootDir, storageKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return {
      storageKey,
      publicUrl: `/uploads/vehicles/${storageKey.replace(/\\/g, "/")}`,
    };
  }
}

/** Production path — uploads to your own S3 bucket (ap-south-1 per seed data). */
export class S3VehicleStorage implements VehicleStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET ?? "";
    this.prefix = (process.env.AWS_S3_PREFIX ?? "vehicles").replace(/\/$/, "");
    this.client = new S3Client({
      region: process.env.AWS_S3_REGION ?? "ap-south-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async upload(buffer: Buffer, storageKey: string, contentType: string): Promise<StorageUploadResult> {
    const key = `${this.prefix}/${storageKey}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    const base = publicBaseUrl();
    return {
      storageKey: key,
      publicUrl: `${base}/${key}`,
    };
  }
}

export function createVehicleStorage(): VehicleStorageAdapter {
  const mode = (process.env.SYNC_STORAGE_MODE ?? "local").toLowerCase();
  if (mode === "s3") {
    if (!process.env.AWS_S3_BUCKET) {
      throw new Error("SYNC_STORAGE_MODE=s3 requires AWS_S3_BUCKET");
    }
    return new S3VehicleStorage();
  }
  return new LocalVehicleStorage();
}

export function buildImageStorageKey(payload: {
  brand: string;
  model: string;
  variant: string;
  year: number;
  index: number;
}): string {
  const slug = [payload.brand, payload.model, payload.variant, String(payload.year)]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}/${Date.now()}-${payload.index}.webp`;
}
