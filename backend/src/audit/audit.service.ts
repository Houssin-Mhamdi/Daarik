import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    entity: string;
    entityId?: string;
    diff?: unknown;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          diff: params.diff as any,
          ip: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch {
      // Audit logging must never break the main request.
    }
  }

  async list(params: { entity?: string; actorId?: string; page?: string; limit?: string }) {
    const p = Math.max(1, Number(params.page) || 1);
    const l = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const where: any = {};
    if (params.entity) where.entity = params.entity;
    if (params.actorId) where.actorId = params.actorId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return { items, total, page: p, limit: l };
  }
}
