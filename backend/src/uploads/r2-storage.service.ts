import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

export type UploadFolder = "dishes" | "cooks" | "avatars" | "documents" | "uploads";

const ALLOWED_FOLDERS = new Set<UploadFolder>([
  "dishes",
  "cooks",
  "avatars",
  "documents",
  "uploads",
]);

export const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

const UPLOAD_DIR = join(process.cwd(), "uploads");

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string | null = null;
  private readonly publicUrl: string | null = null;

  constructor(private readonly config: ConfigService) {
    mkdirSync(UPLOAD_DIR, { recursive: true });

    const accountId = this.config.get<string>("R2_ACCOUNT_ID")?.trim();
    const endpoint =
      this.config.get<string>("R2_ENDPOINT")?.trim() ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID")?.trim();
    const secretAccessKey = this.config
      .get<string>("R2_SECRET_ACCESS_KEY")
      ?.trim();
    const bucket = this.config.get<string>("R2_BUCKET_NAME")?.trim();
    const publicUrl = this.config.get<string>("R2_PUBLIC_URL")?.trim();

    if (endpoint && accessKeyId && secretAccessKey && bucket) {
      this.client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucket = bucket;
      this.publicUrl = publicUrl ? publicUrl.replace(/\/+$/, "") : null;
      this.logger.log(
        `Cloudflare R2 Object Storage initialized (bucket: ${this.bucket})`,
      );
    } else {
      this.logger.log(
        "Cloudflare R2 credentials not set in .env — using local /uploads fallback until R2_* keys are configured.",
      );
    }
  }

  isR2Configured(): boolean {
    return Boolean(this.client && this.bucket);
  }

  normalizeFolder(raw?: string): UploadFolder {
    if (raw && ALLOWED_FOLDERS.has(raw as UploadFolder)) {
      return raw as UploadFolder;
    }
    return "uploads";
  }

  async uploadImage(
    file: Express.Multer.File,
    origin: string,
    folderRaw?: string,
  ) {
    const folder = this.normalizeFolder(folderRaw);
    const ext = (
      ALLOWED_IMAGE_TYPES.get(file.mimetype) ??
      extname(file.originalname) ??
      ".jpg"
    ).toLowerCase();
    const filename = `${randomUUID()}${ext}`;
    const objectKey = `${folder}/${filename}`;

    if (this.client && this.bucket) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      const url = this.publicUrl
        ? `${this.publicUrl}/${objectKey}`
        : `${origin}/api/uploads/r2/${objectKey}`;
      return {
        url,
        path: `/api/uploads/r2/${objectKey}`,
        key: objectKey,
        filename,
        size: file.size,
        mimeType: file.mimetype,
        storage: "r2" as const,
      };
    }

    const folderDir = join(UPLOAD_DIR, folder);
    mkdirSync(folderDir, { recursive: true });
    await writeFile(join(folderDir, filename), file.buffer);
    const relPath = `/uploads/${folder}/${filename}`;
    return {
      url: `${origin}${relPath}`,
      path: relPath,
      key: objectKey,
      filename,
      size: file.size,
      mimeType: file.mimetype,
      storage: "local" as const,
    };
  }

  async getObject(folderRaw: string, filename: string) {
    if (!this.client || !this.bucket) return null;
    const folder = this.normalizeFolder(folderRaw);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    const Key = `${folder}/${safeName}`;
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key,
      }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      buffer: Buffer.from(bytes),
      contentType: res.ContentType || "application/octet-stream",
      cacheControl: res.CacheControl || "public, max-age=31536000, immutable",
    };
  }
}
