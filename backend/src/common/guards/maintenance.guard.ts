import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// These areas must keep working while the marketplace is in maintenance:
// - admin: to be able to switch maintenance mode back off
// - auth: so users can still sign in and see the banner
// - support: contact with support must stay open
// - payments/webhook: Stripe must be able to deliver events
const OPEN_PREFIXES = ["/admin", "/auth", "/support"];
const OPEN_PATHS = ["/payments/webhook"];

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const path = this.normalizePath(req);
    if (
      OPEN_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ||
      OPEN_PATHS.includes(path)
    ) {
      return true;
    }

    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
      select: { maintenanceMode: true },
    });
    if (!settings?.maintenanceMode) return true;

    throw new ServiceUnavailableException({
      statusCode: 503,
      code: "MAINTENANCE_MODE",
      message: "Daarik is in maintenance mode. Please try again later.",
    });
  }

  /** Express paths include the global `/api` prefix; strip it for matching. */
  private normalizePath(req: Request): string {
    const raw = (req.originalUrl || req.url || "").split("?")[0] || "/";
    return raw.startsWith("/api") ? raw.slice(4) || "/" : raw;
  }
}
