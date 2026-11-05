import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { diskStorage } from "multer";
import { extname, join } from "node:path";
import { mkdirSync } from "node:fs";
import type { Request } from "express";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

mkdirSync(UPLOAD_DIR, { recursive: true });

@ApiTags("Uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  @Post("image")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          const ext =
            ALLOWED.get(file.mimetype) ?? extname(file.originalname) ?? ".jpg";
          callback(null, `${randomUUID()}${ext.toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED.has(file.mimetype)) {
          callback(
            new BadRequestException(
              "Only JPEG, PNG, WebP or AVIF images are allowed",
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException("No image uploaded");
    const origin = `${req.protocol}://${req.get("host")}`;
    return {
      url: `${origin}/uploads/${file.filename}`,
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
