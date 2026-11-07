import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import type { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { ALLOWED_IMAGE_TYPES, R2StorageService } from "./r2-storage.service";

@ApiTags("Uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  constructor(private readonly r2Storage: R2StorageService) {}

  @Post("image")
  @ApiConsumes("multipart/form-data")
  @ApiQuery({
    name: "folder",
    required: false,
    enum: ["dishes", "cooks", "avatars", "documents", "uploads"],
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        folder: {
          type: "string",
          enum: ["dishes", "cooks", "avatars", "documents", "uploads"],
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
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
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Query("folder") queryFolder?: string,
    @Body("folder") bodyFolder?: string,
  ) {
    if (!file) throw new BadRequestException("No image uploaded");
    const origin = `${req.protocol}://${req.get("host")}`;
    return this.r2Storage.uploadImage(
      file,
      origin,
      queryFolder || bodyFolder,
    );
  }

  @Public()
  @Get("r2/:folder/:filename")
  async serveR2Object(
    @Param("folder") folder: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    try {
      const obj = await this.r2Storage.getObject(folder, filename);
      if (!obj) {
        throw new NotFoundException("Image not found in R2");
      }
      res.setHeader("Content-Type", obj.contentType);
      res.setHeader("Cache-Control", obj.cacheControl);
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.send(obj.buffer);
    } catch {
      throw new NotFoundException("Image not found in R2");
    }
  }
}
