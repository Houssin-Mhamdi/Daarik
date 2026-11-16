import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
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
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, JwtPayloadUser } from "../common/decorators/current-user.decorator";
import { ALLOWED_IMAGE_TYPES, R2StorageService } from "./r2-storage.service";

@ApiTags("Uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  constructor(
    private readonly r2Storage: R2StorageService,
    private readonly prisma: PrismaService,
  ) {}

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
    @CurrentUser() user: JwtPayloadUser,
    @Query("folder") queryFolder?: string,
    @Body("folder") bodyFolder?: string,
  ) {
    if (!file) throw new BadRequestException("No image uploaded");
    const origin = `${req.protocol}://${req.get("host")}`;
    const folder = queryFolder || bodyFolder;
    return this.r2Storage.uploadImage(
      file,
      origin,
      folder,
      user?.sub,
    );
  }

  @Public()
  @Get("r2/:folder/:filename")
  async serveR2Object(
    @Param("folder") folder: string,
    @Param("filename") filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const normalizedFolder = this.r2Storage.normalizeFolder(folder);
    // Documents are private: require auth + ownership (admin or uploader).
    if (normalizedFolder === "documents") {
      const token = this.extractToken(req);
      if (!token) throw new UnauthorizedException("Authentication required");
      const user = await this.resolveUser(token);
      const obj = await this.r2Storage.getObject(folder, filename);
      if (!obj) throw new NotFoundException("Image not found in R2");
      const ownerId = obj.metadata?.ownerid;
      const isAdmin = user?.role === "ADMIN";
      const isOwner = ownerId && ownerId === user?.id;
      if (!isAdmin && !isOwner) {
        throw new ForbiddenException("You do not have access to this document");
      }
      res.setHeader("Content-Type", obj.contentType);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
      res.send(obj.buffer);
      return;
    }
    // Public folders (dishes, cooks, avatars, uploads): public access.
    try {
      const obj = await this.r2Storage.getObject(folder, filename);
      if (!obj) throw new NotFoundException("Image not found in R2");
      res.setHeader("Content-Type", obj.contentType);
      res.setHeader("Cache-Control", obj.cacheControl);
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.send(obj.buffer);
    } catch {
      throw new NotFoundException("Image not found in R2");
    }
  }

  private extractToken(req: Request): string | null {
    const header = req.headers?.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    // cookie
    const cookie = req.headers?.cookie;
    if (cookie) {
      for (const part of cookie.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        if (part.slice(0, idx).trim() === "darna_at") {
          try {
            return decodeURIComponent(part.slice(idx + 1).trim());
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }

  private async resolveUser(token: string): Promise<{ id: string; role: string } | null> {
    try {
      const jwt = await import("jsonwebtoken");
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) return null;
      const payload = jwt.verify(token, secret) as { sub?: string; role?: string };
      if (!payload?.sub) return null;
      // verify user exists & active
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return null;
      return { id: user.id, role: user.role };
    } catch {
      return null;
    }
  }
}
