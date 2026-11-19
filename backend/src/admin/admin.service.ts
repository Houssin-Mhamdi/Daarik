import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApplicationStatus,
  ComplianceStatus,
  CookStatus,
  DishStatus,
  DisputeStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  TransferStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AdminAuditActor } from "../common/decorators/audit-actor.decorator";
import { buildDishSearchText } from "../common/dish-search";
import { PaymentsService } from "../payments/payments.service";
import { toEuros } from "../payments/money";
import { CreateDishDto } from "../dishes/dto/dish.dto";
import { UpdateAvailabilityDto } from "../cooks/dto/cook.dto";
import { CooksService } from "../cooks/cooks.service";
import {
  ModerateDishDto,
  ResolveDisputeDto,
  ReviewApplicationDto,
  UpdateAdminOrderStatusDto,
  UpdateCookComplianceDto,
  UpdateCookStatusDto,
  UpdatePayoutStatusDto,
  UpdatePlatformSettingsDto,
} from "./dto/admin.dto";

/** Payment states in which the customer's money has actually been captured. */
const CAPTURED_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.DISPUTED,
];

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private cooks: CooksService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Audit logging is best-effort: a broken audit table must never roll back or
   * fail the admin mutation that just succeeded.
   */
  private async writeAudit(params: {
    actor?: AdminAuditActor;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.audit.log({
        actorId: params.actor?.actorId,
        actorRole: params.actor?.actorRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        diff: params.metadata ?? null,
        ip: params.actor?.ip,
        userAgent: params.actor?.userAgent,
      });
    } catch {
      // Intentionally swallowed: auditing must never break the main request.
    }
  }

  /** Global counts, independent of the current page/filter/search. */
  private async getOrderCounts() {
    const [all, grouped] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {
      all,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const row of grouped) counts[row.status.toLowerCase()] = row._count._all;
    return counts;
  }

  private async getCookCounts() {
    const [all, grouped] = await Promise.all([
      this.prisma.cookProfile.count(),
      this.prisma.cookProfile.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {
      all,
      verified: 0,
      pending: 0,
      suspended: 0,
    };
    for (const row of grouped) counts[row.status.toLowerCase()] = row._count._all;
    return counts;
  }

  private async getDishCounts() {
    const [all, grouped, reported] = await Promise.all([
      this.prisma.dish.count(),
      this.prisma.dish.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.dish.count({ where: { reported: true } }),
    ]);
    const counts: Record<string, number> = {
      all,
      live: 0,
      paused: 0,
      draft: 0,
      reported,
    };
    for (const row of grouped) counts[row.status.toLowerCase()] = row._count._all;
    return counts;
  }

  private async getDisputeCounts() {
    const [all, grouped] = await Promise.all([
      this.prisma.dispute.count(),
      this.prisma.dispute.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {
      all,
      open: 0,
      review: 0,
      won: 0,
      lost: 0,
      resolved: 0,
    };
    for (const row of grouped) counts[row.status.toLowerCase()] = row._count._all;
    return counts;
  }

  // ---------------------------------------------------------------------------
  // Overview
  // ---------------------------------------------------------------------------

  async getOverview(range = "30d") {
    const days = range === "90d" ? 90 : range === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * DAY_MS);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      rangeOrders,
      recentOrders,
      cooks,
      customersCount,
      verificationQueue,
      disputes,
      pendingTransfers,
      payouts,
      ordersToday,
      activeCooksCount,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          paymentStatus: { in: CAPTURED_STATUSES },
        },
        include: {
          items: { include: { dish: { select: { cuisineId: true } } } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.order.findMany({
        include: { cook: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      this.prisma.cookProfile.findMany({
        orderBy: { ordersCount: "desc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          name: true,
          avatar: true,
          city: true,
          rating: true,
          ordersCount: true,
          status: true,
          complianceStatus: true,
          stripeAccountStatus: true,
        },
      }),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.cookApplication.findMany({
        where: { status: ApplicationStatus.PENDING },
        orderBy: { submittedAt: "desc" },
      }),
      this.prisma.dispute.findMany({
        where: {
          status: { in: [DisputeStatus.OPEN, DisputeStatus.REVIEW] },
        },
      }),
      this.prisma.transfer.findMany({
        where: { status: TransferStatus.PENDING },
        select: { amountCents: true },
      }),
      this.prisma.payout.findMany({
        select: { status: true, amountCents: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // Real global count: `cooks` above is a top-6 list for the leaderboard.
      this.prisma.cookProfile.count({
        where: { status: CookStatus.VERIFIED },
      }),
    ]);

    const gmvCents = rangeOrders.reduce((s, o) => s + o.totalCents, 0);
    const commissionCents = rangeOrders.reduce(
      (s, o) => s + o.commissionCents,
      0,
    );
    const serviceFeeCents = rangeOrders.reduce(
      (s, o) => s + o.serviceFeeCents,
      0,
    );
    const refundedCents = rangeOrders.reduce((s, o) => s + o.refundedCents, 0);

    // Daarik revenue = commission + its own service fee.
    const revenueCents = commissionCents + serviceFeeCents;

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i -= 1) {
      const key = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      buckets.set(key, { revenue: 0, orders: 0 });
    }
    for (const order of rangeOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += order.commissionCents + order.serviceFeeCents;
      bucket.orders += 1;
    }
    const series = [...buckets.values()];

    const weeklyOrders = series.slice(-7).map((b) => b.orders);

    const cuisineCounts = new Map<string, number>();
    for (const order of rangeOrders) {
      for (const item of order.items) {
        const id = item.dish?.cuisineId ?? "other";
        cuisineCounts.set(id, (cuisineCounts.get(id) ?? 0) + item.qty);
      }
    }
    const cuisineTotal = [...cuisineCounts.values()].reduce((a, b) => a + b, 0);
    const topCuisines = [...cuisineCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        orders: count,
        share: cuisineTotal ? Math.round((count / cuisineTotal) * 100) : 0,
      }));

    const payoutsDueCents = payouts
      .filter(
        (p) =>
          p.status === PayoutStatus.SCHEDULED ||
          p.status === PayoutStatus.IN_TRANSIT,
      )
      .reduce((s, p) => s + p.amountCents, 0);

    return {
      range: `${days}d`,
      kpis: {
        gmv: toEuros(gmvCents),
        commission: toEuros(commissionCents),
        serviceFee: toEuros(serviceFeeCents),
        revenue: toEuros(revenueCents),
        activeCooks: activeCooksCount,
        activeCustomers: customersCount,
        ordersToday,
        pendingVerifications: verificationQueue.length,
        disputes: disputes.length,
        avgOrder: rangeOrders.length
          ? toEuros(Math.round(gmvCents / rangeOrders.length))
          : 0,
        refundRate: gmvCents
          ? Math.round((refundedCents / gmvCents) * 1000) / 10
          : 0,
        pendingTransfersCents: pendingTransfers.reduce(
          (s, t) => s + t.amountCents,
          0,
        ),
      },
      revenueSeries: series.map((b) => toEuros(b.revenue)),
      weeklyOrders,
      topCuisines,
      topCooks: cooks,
      verificationQueue,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        code: o.code,
        customer: o.customerName,
        cook: o.cook.name,
        amount: toEuros(o.totalCents),
        status: o.status.toLowerCase(),
        paymentStatus: o.paymentStatus,
        pickup: `${o.pickup} · ${o.pickupTime}`,
        placed: o.createdAt,
      })),
      payoutsSummary: {
        due: toEuros(payoutsDueCents),
        pendingCount: payouts.filter(
          (p) =>
            p.status === PayoutStatus.SCHEDULED ||
            p.status === PayoutStatus.IN_TRANSIT,
        ).length,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  async getOrders(query: {
    status?: string;
    q?: string;
    page?: string;
    limit?: string;
  }) {
    const p = Math.max(1, Number(query.page) || 1);
    const rawL = query.limit ? Number(query.limit) : 0;
    const l = rawL > 0 ? Math.min(100, rawL) : 0;
    const usePaging = l > 0;

    const where = {
      ...(query.status && query.status !== "all"
        ? { status: query.status.toUpperCase() as OrderStatus }
        : {}),
      ...(query.q
        ? {
            OR: [
              { code: { contains: query.q, mode: "insensitive" } },
              { customerName: { contains: query.q, mode: "insensitive" } },
              {
                cook: { name: { contains: query.q, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where: where as any }),
      this.prisma.order.findMany({
        where: where as any,
        include: {
          cook: true,
          items: { include: { dish: true } },
          transfers: true,
          refunds: true,
        },
        orderBy: { createdAt: "desc" },
        ...(usePaging ? { skip: (p - 1) * l, take: l } : {}),
      }),
    ]);
    const counts = await this.getOrderCounts();

    const items = orders.map((o) => ({
      id: o.id,
      code: o.code,
      customer: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      cook: o.cook.name,
      cookId: o.cook.slug,
      amount: toEuros(o.totalCents),
      subtotal: toEuros(o.subtotalCents),
      serviceFee: toEuros(o.serviceFeeCents),
      commission: toEuros(o.commissionCents),
      cookNet: toEuros(o.cookNetCents),
      refunded: toEuros(o.refundedCents),
      stripeFee: toEuros(o.stripeFeeCents),
      status: o.status.toLowerCase(),
      paymentStatus: o.paymentStatus,
      pickup: `${o.pickup} · ${o.pickupTime}`,
      paid:
        CAPTURED_STATUSES.includes(o.paymentStatus) &&
        o.paymentStatus !== PaymentStatus.DISPUTED,
      items: o.items.map((i) => ({
        ...i,
        unitPrice: toEuros(i.unitPriceCents),
      })),
      transfer: o.transfers[0]
        ? {
            status: o.transfers[0].status,
            amount: toEuros(o.transfers[0].amountCents),
            reversed: toEuros(o.transfers[0].reversedCents),
          }
        : null,
      transferEligibleAt: o.transferEligibleAt,
      createdAt: o.createdAt,
    }));

    return {
      items,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
      counts,
    };
  }

  async updateOrderStatus(
    idOrCode: string,
    dto: UpdateAdminOrderStatusDto,
    adminId: string | undefined,
    actor?: AdminAuditActor,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    let updated;
    // Cancelling a paid order must move real money, not just relabel a row.
    if (
      dto.status === OrderStatus.CANCELLED &&
      CAPTURED_STATUSES.includes(order.paymentStatus) &&
      order.refundedCents < order.totalCents
    ) {
      await this.payments.refundOrder(
        order.id,
        { reason: "Cancelled by Daarik admin" },
        `admin:${adminId ?? actor?.actorId ?? "unknown"}`,
      );
      updated = await this.prisma.order.findUnique({ where: { id: order.id } });
    } else if (
      dto.status === OrderStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      updated = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
      });
      await this.payments.scheduleEarningsRelease(order.id, new Date());
    } else {
      updated = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: dto.status },
      });
    }

    await this.writeAudit({
      actor,
      action: "order.status.update",
      entity: "Order",
      entityId: order.id,
      metadata: { code: order.code, from: order.status, to: dto.status },
    });
    return updated;
  }

  async refundOrder(
    idOrCode: string,
    dto: { amount?: number; reason?: string },
    adminId: string | undefined,
    actor?: AdminAuditActor,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) throw new NotFoundException("Order not found");

    const result = await this.payments.refundOrder(
      order.id,
      dto,
      `admin:${adminId ?? actor?.actorId ?? "unknown"}`,
    );
    await this.writeAudit({
      actor,
      action: "order.refund",
      entity: "Order",
      entityId: order.id,
      metadata: { code: order.code, amountCents: result.amountCents },
    });
    return result;
  }

  // ---------------------------------------------------------------------------
  // Cooks
  // ---------------------------------------------------------------------------

  async getCooks(query: {
    status?: string;
    q?: string;
    page?: string;
    limit?: string;
  }) {
    const p = Math.max(1, Number(query.page) || 1);
    const rawL = query.limit ? Number(query.limit) : 0;
    const l = rawL > 0 ? Math.min(100, rawL) : 0;
    const usePaging = l > 0;

    const where = {
      ...(query.status && query.status !== "all"
        ? { status: query.status.toUpperCase() as CookStatus }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, cooks, applications] = await Promise.all([
      this.prisma.cookProfile.count({ where: where as any }),
      this.prisma.cookProfile.findMany({
        where: where as any,
        include: {
          _count: { select: { dishes: true, orders: true } },
        },
        orderBy: { ordersCount: "desc" },
        ...(usePaging ? { skip: (p - 1) * l, take: l } : {}),
      }),
      this.prisma.cookApplication.findMany({
        where: { status: ApplicationStatus.PENDING },
        orderBy: { submittedAt: "desc" },
      }),
    ]);
    const counts = await this.getCookCounts();

    return {
      cooks: cooks.map((c) => this.toAdminCook(c)),
      verificationQueue: applications,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
      counts,
    };
  }

  async getCookWorkspace(idOrSlug: string) {
    const cook = await this.findCook(idOrSlug);
    const dishes = await this.prisma.dish.findMany({
      where: { cookId: cook.id },
      orderBy: { updatedAt: "desc" },
    });

    return {
      cook: this.toAdminCook(cook),
      dishes,
    };
  }

  async createCookDish(
    idOrSlug: string,
    dto: CreateDishDto,
    actor?: AdminAuditActor,
  ) {
    const cook = await this.findCook(idOrSlug);
    const baseSlug = (dto.name.en || dto.name.nl || "dish")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const dish = await this.prisma.dish.create({
      data: {
        slug: `${baseSlug || "dish"}-${Date.now().toString(36)}`,
        cookId: cook.id,
        name: dto.name,
        desc: dto.desc,
        image: dto.image,
        price: dto.price,
        cuisineId: dto.cuisineId,
        serves: dto.serves ?? 1,
        portions: dto.portions ?? 8,
        portionsLeft: dto.portionsLeft ?? dto.portions ?? 8,
        allergens: dto.allergens ?? [],
        dietary: dto.dietary ?? [],
        ingredients: (dto.ingredients ?? []).map((i) => ({ ...i })),
        pickup: dto.pickup ?? [],
        featured: dto.featured ?? false,
        weekend: dto.weekend ?? false,
        family: dto.family ?? false,
        badge: dto.badge,
        prepTime: dto.prepTime ?? { nl: "1 uur", en: "1 hour", ar: "ساعة" },
        status: dto.status ?? DishStatus.LIVE,
        searchText: buildDishSearchText(dto),
      },
    });
    await this.writeAudit({
      actor,
      action: "cook.dish.create",
      entity: "Dish",
      entityId: dish.id,
      metadata: { cookId: cook.id, slug: dish.slug, status: dish.status },
    });
    return dish;
  }

  async updateCookAvailability(
    idOrSlug: string,
    dto: UpdateAvailabilityDto,
    actor?: AdminAuditActor,
  ) {
    const cook = await this.findCook(idOrSlug);
    const updated = await this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        ...(dto.kitchenOpen !== undefined
          ? { kitchenOpen: dto.kitchenOpen }
          : {}),
        ...(dto.maxPortionsPerDay !== undefined
          ? { maxPortionsPerDay: dto.maxPortionsPerDay }
          : {}),
        ...(dto.availableDays !== undefined
          ? { availableDays: dto.availableDays }
          : {}),
        ...(dto.availableSlots !== undefined
          ? { availableSlots: dto.availableSlots }
          : {}),
      },
    });
    await this.writeAudit({
      actor,
      action: "cook.availability.update",
      entity: "CookProfile",
      entityId: cook.id,
      metadata: {
        slug: cook.slug,
        fields: Object.keys(dto),
        kitchenOpen: updated.kitchenOpen,
        maxPortionsPerDay: updated.maxPortionsPerDay,
      },
    });
    return updated;
  }

  async updateCookStatus(
    idOrSlug: string,
    dto: UpdateCookStatusDto,
    actor?: AdminAuditActor,
  ) {
    const cook = await this.findCook(idOrSlug);
    const updated = await this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        status: dto.status,
        verified: dto.status === CookStatus.VERIFIED,
      },
    });
    await this.writeAudit({
      actor,
      action: "cook.status.update",
      entity: "CookProfile",
      entityId: cook.id,
      metadata: { slug: cook.slug, from: cook.status, to: dto.status },
    });
    return updated;
  }

  /** Re-reads the connected account so admin decisions use Stripe's real state. */
  async syncCookAccount(idOrSlug: string, actor?: AdminAuditActor) {
    const cook = await this.findCook(idOrSlug);
    if (!cook.stripeAccountId) {
      throw new BadRequestException("This cook has no Stripe account yet");
    }
    const result = await this.payments.syncAccount(cook.stripeAccountId);
    await this.writeAudit({
      actor,
      action: "cook.stripe.sync",
      entity: "CookProfile",
      entityId: cook.id,
      metadata: { slug: cook.slug, accountId: cook.stripeAccountId },
    });
    return result;
  }

  /**
   * Updates Daarik's own compliance gate. Approving here does NOT skip Stripe
   * onboarding, and Stripe verification does NOT satisfy this gate.
   */
  async updateCookCompliance(
    idOrSlug: string,
    dto: UpdateCookComplianceDto,
    adminId: string | undefined,
    actor?: AdminAuditActor,
  ) {
    const cook = await this.findCook(idOrSlug);

    const updated = await this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        complianceStatus: dto.status,
        complianceNote: dto.note ?? cook.complianceNote,
        complianceCheckedAt: new Date(),
        complianceCheckedBy: `admin:${adminId ?? actor?.actorId ?? "unknown"}`,
        ...(dto.kvkNumber !== undefined ? { kvkNumber: dto.kvkNumber } : {}),
        ...(dto.nvwaRegistered !== undefined
          ? { nvwaRegistered: dto.nvwaRegistered }
          : {}),
        ...(dto.payoutHoldDays !== undefined
          ? { payoutHoldDays: dto.payoutHoldDays }
          : {}),
      },
    });
    await this.writeAudit({
      actor,
      action: "cook.compliance.update",
      entity: "CookProfile",
      entityId: cook.id,
      metadata: {
        slug: cook.slug,
        from: cook.complianceStatus,
        to: dto.status,
        fields: Object.keys(dto).filter((key) => key !== "note"),
      },
    });
    return updated;
  }

  private async findCook(idOrSlug: string) {
    const cook = await this.prisma.cookProfile.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!cook) throw new NotFoundException("Cook not found");
    return cook;
  }

  private toAdminCook(cook: any) {
    return {
      id: cook.slug || cook.id,
      dbId: cook.id,
      name: cook.name,
      avatar: cook.avatar,
      city: cook.city,
      createdAt: cook.createdAt,
      cuisineIds: cook.cuisineIds,
      status: cook.status,
      verified: cook.verified,
      rating: cook.rating,
      ordersCount: cook.ordersCount,
      kitchenOpen: cook.kitchenOpen,
      maxPortionsPerDay: cook.maxPortionsPerDay,
      availableDays: cook.availableDays,
      availableSlots: cook.availableSlots,
      bankName: cook.bankName,
      ibanLast4: cook.ibanLast4,
      stripe: {
        connected: Boolean(cook.stripeAccountId),
        status: cook.stripeAccountStatus,
        chargesEnabled: cook.stripeChargesEnabled,
        payoutsEnabled: cook.stripePayoutsEnabled,
        requirementsDue: cook.stripeRequirementsDue,
        disabledReason: cook.stripeDisabledReason,
        syncedAt: cook.stripeSyncedAt,
      },
      compliance: {
        status: cook.complianceStatus,
        note: cook.complianceNote,
        checkedAt: cook.complianceCheckedAt,
        kvkNumber: cook.kvkNumber,
        nvwaRegistered: cook.nvwaRegistered,
      },
      payoutHoldDays: cook.payoutHoldDays,
      canReceiveOrders:
        cook.stripePayoutsEnabled &&
        cook.complianceStatus === ComplianceStatus.APPROVED,
    };
  }

  // ---------------------------------------------------------------------------
  // Applications
  // ---------------------------------------------------------------------------

  /** Shared by single approval and bulk approval so both create the profile. */
  private async approveApplicationRecord(id: string, notes?: string) {
    const app = await this.prisma.cookApplication.findUnique({ where: { id } });
    if (!app) return null;

    let userId = app.userId;
    if (!userId && app.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: { equals: app.email.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    const updated = await this.prisma.cookApplication.update({
      where: { id },
      data: {
        userId,
        status: ApplicationStatus.APPROVED,
        reviewerNotes: notes,
        reviewedAt: new Date(),
      },
    });

    if (userId) {
      await this.cooks.ensureCookProfileForApplication({
        ...app,
        userId,
      });
    }

    return updated;
  }

  async approveApplication(
    id: string,
    dto: ReviewApplicationDto,
    actor?: AdminAuditActor,
  ) {
    const updated = await this.approveApplicationRecord(id, dto.notes);
    if (!updated) {
      throw new NotFoundException("Application not found");
    }
    await this.writeAudit({
      actor,
      action: "application.approve",
      entity: "CookApplication",
      entityId: id,
      metadata: { name: updated.name, status: updated.status },
    });
    return updated;
  }

  async requestApplicationChanges(
    id: string,
    dto: ReviewApplicationDto,
    actor?: AdminAuditActor,
  ) {
    const app = await this.prisma.cookApplication.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException("Application not found");
    }

    const updated = await this.prisma.cookApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.CHANGES_REQUESTED,
        reviewerNotes: dto.notes,
        reviewedAt: new Date(),
      },
    });
    await this.writeAudit({
      actor,
      action: "application.changes_request",
      entity: "CookApplication",
      entityId: id,
      metadata: { name: app.name, status: updated.status },
    });
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Dishes
  // ---------------------------------------------------------------------------

  async getDishes(query: {
    filter?: string;
    q?: string;
    page?: string;
    limit?: string;
  }) {
    const p = Math.max(1, Number(query.page) || 1);
    const rawL = query.limit ? Number(query.limit) : 0;
    const l = rawL > 0 ? Math.min(100, rawL) : 0;
    const usePaging = l > 0;

    const where = {
      ...(query.filter === "reported"
        ? { reported: true }
        : query.filter && query.filter !== "all"
          ? { status: query.filter.toUpperCase() as DishStatus }
          : {}),
      ...(query.q
        ? {
            OR: [
              { name: { path: ["nl"], string_contains: query.q } },
              { searchText: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [total, dishes] = await this.prisma.$transaction([
      this.prisma.dish.count({ where: where as any }),
      this.prisma.dish.findMany({
        where: where as any,
        include: { cook: true },
        orderBy: { updatedAt: "desc" },
        ...(usePaging ? { skip: (p - 1) * l, take: l } : {}),
      }),
    ]);
    const counts = await this.getDishCounts();

    const items = dishes.map((d) => ({
      id: d.slug || d.id,
      dbId: d.id,
      name: d.name,
      desc: d.desc,
      image: d.image,
      cook: d.cook.name,
      cookId: d.cook.slug,
      cuisine: d.cuisineId,
      price: d.price,
      rating: d.rating,
      reviewCount: d.reviewCount,
      portionsLeft: d.portionsLeft,
      status: d.status.toLowerCase(),
      reported: d.reported,
      reportReason: d.reportReason,
    }));

    return {
      items,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
      counts,
    };
  }

  async moderateDish(
    idOrSlug: string,
    dto: ModerateDishDto,
    actor?: AdminAuditActor,
  ) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    const updated = await this.prisma.dish.update({
      where: { id: dish.id },
      data: {
        status: dto.status,
        reported: dto.status === DishStatus.LIVE ? false : dish.reported,
      },
    });
    await this.writeAudit({
      actor,
      action: "dish.status.update",
      entity: "Dish",
      entityId: dish.id,
      metadata: { slug: dish.slug, from: dish.status, to: dto.status },
    });
    return updated;
  }

  async removeDish(idOrSlug: string, actor?: AdminAuditActor) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    const updated = await this.prisma.dish.update({
      where: { id: dish.id },
      data: { status: DishStatus.PAUSED },
    });
    await this.writeAudit({
      actor,
      action: "dish.delete",
      entity: "Dish",
      entityId: dish.id,
      metadata: { slug: dish.slug, from: dish.status, to: DishStatus.PAUSED },
    });
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Payouts (Stripe-driven)
  // ---------------------------------------------------------------------------

  async getPayouts() {
    const payouts = await this.prisma.payout.findMany({
      include: { cook: true },
      orderBy: { createdAt: "desc" },
    });

    return payouts.map((p) => ({
      id: p.code,
      dbId: p.id,
      stripePayoutId: p.stripePayoutId,
      cook: p.cook.name,
      cookId: p.cook.slug,
      period: p.period,
      gross: toEuros(p.grossCents),
      commission: toEuros(p.commissionCents),
      net: toEuros(p.amountCents),
      amount: toEuros(p.amountCents),
      ordersCount: p.ordersCount,
      status: p.status.toLowerCase(),
      automatic: p.automatic,
      arrivalDate: p.arrivalDate,
      failureMessage: p.failureMessage,
      paidAt: p.paidAt,
    }));
  }

  /**
   * A payout may never be declared PAID by a human: only Stripe can confirm
   * that the bank transfer happened. The only manual transition kept is
   * cancelling a local scheduled row that Stripe does not know about yet.
   */
  async updatePayoutStatus(
    idOrCode: string,
    dto: UpdatePayoutStatusDto,
    actor?: AdminAuditActor,
  ) {
    const payout = await this.prisma.payout.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    if (dto.status !== PayoutStatus.CANCELED) {
      throw new BadRequestException(
        "Payout status is controlled by Stripe. Use `sync` to pull the latest state.",
      );
    }
    if (payout.stripePayoutId) {
      throw new BadRequestException(
        "This payout already exists at Stripe and cannot be cancelled locally.",
      );
    }

    const updated = await this.prisma.payout.update({
      where: { id: payout.id },
      data: { status: PayoutStatus.CANCELED },
    });
    await this.writeAudit({
      actor,
      action: "payout.cancel",
      entity: "Payout",
      entityId: payout.id,
      metadata: { code: payout.code, from: payout.status, to: PayoutStatus.CANCELED },
    });

    return {
      ...updated,
      id: updated.code,
      dbId: updated.id,
      status: updated.status.toLowerCase(),
      canceled: true,
      message: "Payout canceled locally (no Stripe payout existed).",
    };
  }

  async syncPayout(idOrCode: string, actor?: AdminAuditActor) {
    const payout = await this.prisma.payout.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
      select: { id: true, code: true },
    });
    const result = await this.payments.syncPayout(idOrCode);
    await this.writeAudit({
      actor,
      action: "payout.sync",
      entity: "Payout",
      entityId: payout?.id ?? idOrCode,
      metadata: { code: payout?.code },
    });
    return result;
  }

  /** Releases all eligible order earnings (the same job the scheduler runs). */
  async releaseTransfers(actor?: AdminAuditActor) {
    const result = await this.payments.releaseNow();
    await this.writeAudit({
      actor,
      action: "payout.release",
      entity: "Payout",
      entityId: "singleton",
      metadata: { released: result.released, failed: result.failed, skipped: result.skipped },
    });
    return result;
  }

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------

  async getDisputes(status?: string, page?: string, limit?: string) {
    const p = Math.max(1, Number(page) || 1);
    const rawL = limit ? Number(limit) : 0;
    const l = rawL > 0 ? Math.min(100, rawL) : 0;
    const usePaging = l > 0;

    const where = {
      ...(status && status !== "all"
        ? { status: status.toUpperCase() as DisputeStatus }
        : {}),
    };

    const [total, disputes] = await this.prisma.$transaction([
      this.prisma.dispute.count({ where: where as any }),
      this.prisma.dispute.findMany({
        where: where as any,
        orderBy: { openedAt: "desc" },
        ...(usePaging ? { skip: (p - 1) * l, take: l } : {}),
      }),
    ]);

    const counts = await this.getDisputeCounts();

    return {
      items: disputes.map((d) => this.toAdminDispute(d)),
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
      counts,
    };
  }

  private toAdminDispute(d: any) {
    return {
      id: d.code,
      dbId: d.id,
      code: d.orderCode,
      customer: d.customerName,
      cook: d.cookName,
      reason: d.reason,
      customerNote: d.customerNote,
      resolutionNote: d.resolutionNote,
      amount: toEuros(d.amountCents),
      refundAmount: d.refundCents != null ? toEuros(d.refundCents) : null,
      stripeDisputeId: d.stripeDisputeId,
      stripeStatus: d.stripeStatus,
      evidenceDueBy: d.evidenceDueBy,
      status: d.status.toLowerCase(),
      opened: d.openedAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      resolvedAt: d.resolvedAt,
      orderId: d.orderId,
      cookId: d.cookId,
      transferReversed: d.transferReversed,
      evidence: d.evidence ?? [],
      timeline: d.timeline ?? [],
    };
  }

  /** Existing helper, now exposed through GET /admin/disputes/:id. */
  async getDispute(idOrCode: string) {
    return this.prisma.dispute.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
  }

  async getDisputeView(idOrCode: string) {
    const dispute = await this.getDispute(idOrCode);
    if (!dispute) throw new NotFoundException("Dispute not found");
    return this.toAdminDispute(dispute);
  }

  async appendDisputeEvidence(
    idOrCode: string,
    url: string,
    actor?: AdminAuditActor,
  ) {
    const dispute = await this.getDispute(idOrCode);
    if (!dispute) throw new NotFoundException("Dispute not found");
    const evidence = [...(dispute.evidence ?? []), url];
    const timeline = [
      ...(Array.isArray(dispute.timeline) ? dispute.timeline : []),
      { at: new Date(), action: "evidence_uploaded", url },
    ];
    const updated = await this.prisma.dispute.update({
      where: { id: dispute.id },
      data: { evidence, timeline: timeline as any },
    });
    await this.writeAudit({
      actor,
      action: "dispute.evidence_upload",
      entity: "Dispute",
      entityId: dispute.id,
      // Never log the evidence URL itself; it links to private documents.
      metadata: { code: dispute.code, evidenceCount: evidence.length },
    });
    return this.toAdminDispute(updated);
  }

  async resolveDispute(
    idOrCode: string,
    dto: ResolveDisputeDto,
    actor?: AdminAuditActor,
  ) {
    const dispute = await this.getDispute(idOrCode);
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    const refundCents = dto.refundAmount != null
      ? Math.round(dto.refundAmount * 100)
      : null;

    // A refund tied to a dispute must go through Stripe, not a local field.
    if (refundCents != null && refundCents > 0) {
      if (refundCents > dispute.amountCents) {
        throw new BadRequestException(
          `Refund amount (€${toEuros(refundCents).toFixed(2)}) exceeds the dispute amount (€${toEuros(dispute.amountCents).toFixed(2)}).`,
        );
      }
      const alreadyRefunded = dispute.refundCents ?? 0;
      if (alreadyRefunded + refundCents > dispute.amountCents) {
        throw new BadRequestException(
          `Total refunds (€${toEuros(alreadyRefunded + refundCents).toFixed(2)}) would exceed the dispute amount (€${toEuros(dispute.amountCents).toFixed(2)}).`,
        );
      }
      if (!dispute.orderId) {
        throw new BadRequestException(
          "This dispute is not linked to an order, so it cannot be refunded automatically",
        );
      }
      await this.payments.refundOrder(
        dispute.orderId,
        { amount: dto.refundAmount!, reason: dto.resolutionNote ?? "dispute" },
        `admin:dispute:${actor?.actorId ?? "unknown"}`,
      );
    }

    const updated = await this.prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: dto.status ?? DisputeStatus.RESOLVED,
        refundCents: refundCents ?? dispute.refundCents,
        resolutionNote: dto.resolutionNote,
        resolvedAt: new Date(),
      },
    });
    await this.writeAudit({
      actor,
      action: "dispute.resolve",
      entity: "Dispute",
      entityId: dispute.id,
      metadata: {
        code: dispute.code,
        from: dispute.status,
        to: updated.status,
        refundCents: updated.refundCents,
      },
    });
    return this.toAdminDispute(updated);
  }

  // ---------------------------------------------------------------------------
  // Marketplace payments panel
  // ---------------------------------------------------------------------------

  async getMarketplace() {
    const [balance, settings, transfers, payouts, events, cooks] =
      await Promise.all([
        this.payments.getPlatformBalance(),
        this.prisma.platformSetting.upsert({
          where: { id: "singleton" },
          update: {},
          create: { id: "singleton" },
        }),
        this.prisma.transfer.findMany({
          include: {
            cook: { select: { name: true, slug: true } },
            order: { select: { code: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        this.prisma.payout.findMany({
          include: { cook: { select: { name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        this.prisma.webhookEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            stripeEventId: true,
            type: true,
            processedAt: true,
            attempts: true,
            error: true,
            createdAt: true,
          },
        }),
        this.prisma.cookProfile.findMany({
          select: {
            slug: true,
            name: true,
            complianceStatus: true,
            stripeAccountStatus: true,
            stripePayoutsEnabled: true,
          },
        }),
      ]);

    const readiness = cooks.reduce(
      (acc, cook) => {
        if (
          cook.stripeAccountStatus === "ENABLED" &&
          cook.complianceStatus === "APPROVED"
        ) {
          acc.ready += 1;
        } else if (cook.stripeAccountStatus === "NONE") {
          acc.notStarted += 1;
        } else {
          acc.blocked += 1;
        }
        return acc;
      },
      { ready: 0, blocked: 0, notStarted: 0 },
    );

    return {
      balance,
      readiness,
      pricing: {
        serviceFeeCents: settings.serviceFeeCents,
        serviceFee: toEuros(settings.serviceFeeCents),
        commissionRate: settings.commissionRate,
        commissionFixedCents: settings.commissionFixedCents,
        commissionBase: settings.commissionBase,
        minOrderCents: settings.minOrderCents,
        stripeFeeBearer: settings.stripeFeeBearer,
      },
      payoutPolicy: {
        holdDays: settings.payoutHoldDays,
        interval: settings.payoutInterval,
        weeklyAnchor: settings.payoutWeeklyAnchor,
        monthlyAnchor: settings.payoutMonthlyAnchor,
      },
      transfers: transfers.map((t) => ({
        id: t.id,
        orderCode: t.order.code,
        cook: t.cook.name,
        cookId: t.cook.slug,
        amount: toEuros(t.amountCents),
        reversed: toEuros(t.reversedCents),
        status: t.status,
        stripeTransferId: t.stripeTransferId,
        failureReason: t.failureReason,
        createdAt: t.createdAt,
      })),
      payouts: payouts.map((p) => ({
        id: p.code,
        cook: p.cook.name,
        cookId: p.cook.slug,
        amount: toEuros(p.amountCents),
        status: p.status,
        automatic: p.automatic,
        arrivalDate: p.arrivalDate,
        failureMessage: p.failureMessage,
        paidAt: p.paidAt,
      })),
      webhookEvents: events,
      settings: toEurosSettings(settings),
    };
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * The admin table exposes cook slugs (id = slug), while pending verification
   * rows expose application ids. Accept both, and approve applications through
   * the same helper the single approval endpoint uses.
   */
  async bulkCookStatus(ids: string[], status: string, actor?: AdminAuditActor) {
    const nextStatus = status.toUpperCase() as CookStatus;
    const matched = new Set<string>();
    let updated = 0;

    if (nextStatus === CookStatus.VERIFIED) {
      const applications = await this.prisma.cookApplication.findMany({
        where: { id: { in: ids }, status: ApplicationStatus.PENDING },
      });
      for (const application of applications) {
        try {
          await this.approveApplicationRecord(application.id);
          matched.add(application.id);
          updated += 1;
        } catch {
          // Leave the id in `failed` so the admin can retry it individually.
        }
      }
    }

    const cooks = await this.prisma.cookProfile.findMany({
      where: { OR: [{ id: { in: ids } }, { slug: { in: ids } }] },
      select: { id: true, slug: true },
    });
    if (cooks.length) {
      const result = await this.prisma.cookProfile.updateMany({
        where: { id: { in: cooks.map((c) => c.id) } },
        data: {
          status: nextStatus,
          verified: nextStatus === CookStatus.VERIFIED,
        },
      });
      updated += result.count;
      for (const cook of cooks) {
        matched.add(cook.id);
        matched.add(cook.slug);
      }
    }

    const failed = ids.filter((id) => !matched.has(id));
    await this.writeAudit({
      actor,
      action: "cook.bulk_status",
      entity: "CookProfile",
      entityId: "bulk",
      metadata: {
        status: nextStatus,
        requested: ids.length,
        updated,
        failedCount: failed.length,
      },
    });
    return { updated, failed };
  }

  /** The admin table exposes dish slugs, so match ids and slugs. */
  async bulkDishStatus(ids: string[], status: string, actor?: AdminAuditActor) {
    const nextStatus = status.toUpperCase() as DishStatus;
    const dishes = await this.prisma.dish.findMany({
      where: { OR: [{ id: { in: ids } }, { slug: { in: ids } }] },
      select: { id: true, slug: true },
    });
    const dishIds = dishes.map((d) => d.id);
    const result = dishIds.length
      ? await this.prisma.dish.updateMany({
          where: { id: { in: dishIds } },
          data: {
            status: nextStatus,
            // Same rule as single moderation: a freshly live dish is no longer reported.
            ...(nextStatus === DishStatus.LIVE ? { reported: false } : {}),
          },
        })
      : { count: 0 };

    const matched = new Set<string>();
    for (const dish of dishes) {
      matched.add(dish.id);
      matched.add(dish.slug);
    }
    const failed = ids.filter((id) => !matched.has(id));
    await this.writeAudit({
      actor,
      action: "dish.bulk_status",
      entity: "Dish",
      entityId: "bulk",
      metadata: {
        status: nextStatus,
        requested: ids.length,
        updated: result.count,
        failedCount: failed.length,
      },
    });
    return { updated: result.count, failed };
  }

  async getAnalytics(range = "30d") {
    const days = range === "90d" ? 90 : range === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * DAY_MS);

    const [orders, cooks, customers, repeatCustomers] = await Promise.all([
      this.prisma.order.findMany({
        // Same captured-money definition as getOverview: unpaid orders must
        // never inflate GMV or commission in analytics.
        where: {
          createdAt: { gte: since },
          paymentStatus: { in: CAPTURED_STATUSES },
        },
        select: {
          totalCents: true,
          commissionCents: true,
          customerId: true,
          cookId: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.cookProfile.findMany({
        select: { id: true, name: true, ordersCount: true, rating: true, city: true },
        orderBy: { ordersCount: "desc" },
        take: 10,
      }),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.order.groupBy({
        by: ["customerId"],
        where: {
          createdAt: { gte: since },
          paymentStatus: { in: CAPTURED_STATUSES },
        },
        _count: { _all: true },
      }),
    ]);

    const gmv = orders.reduce((s, o) => s + (o.totalCents ?? 0), 0);
    const commission = orders.reduce((s, o) => s + (o.commissionCents ?? 0), 0);
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const repeatRate =
      repeatCustomers.length > 0
        ? repeatCustomers.filter((c) => c._count._all > 1).length / repeatCustomers.length
        : 0;

    return {
      range,
      gmv: gmv / 100,
      commission: commission / 100,
      ordersCount: orders.length,
      completedCount: completed,
      cancelledCount: cancelled,
      customersCount: customers,
      repeatRate: Math.round(repeatRate * 1000) / 1000,
      topCooks: cooks.map((c) => ({
        id: c.id,
        name: c.name,
        orders: c.ordersCount,
        rating: c.rating,
        city: c.city,
      })),
    };
  }

  async getSettings() {
    const settings = await this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return toEurosSettings(settings);
  }

  async updateSettings(
    dto: UpdatePlatformSettingsDto,
    actor?: AdminAuditActor,
  ) {
    const { serviceFee, serviceFeeCents, ...rest } = dto;
    const data: Record<string, unknown> = {};
    // Only persist fields the DTO actually validated; no raw body spreading.
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) data[key] = value;
    }
    if (serviceFeeCents !== undefined) {
      data.serviceFeeCents = serviceFeeCents;
      data.serviceFee = serviceFeeCents / 100;
    } else if (serviceFee !== undefined) {
      data.serviceFee = serviceFee;
      data.serviceFeeCents = Math.round(serviceFee * 100);
    }

    const settings = await this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: data as any,
      create: { id: "singleton", ...data } as any,
    });

    // Keep the connected accounts' payout schedules aligned with the policy.
    if (dto.payoutInterval) {
      await this.payments.applyPayoutPolicyToCooks();
    }

    await this.writeAudit({
      actor,
      action: "settings.update",
      entity: "PlatformSetting",
      entityId: "singleton",
      // Field names only: values (KVK, emails) must not leak into the audit log.
      metadata: { fields: Object.keys(dto) },
    });
    return toEurosSettings(settings);
  }
}

/**
 * Explicit settings view so GET /admin/settings always exposes every field the
 * PATCH DTO supports, plus the euro aliases older clients display.
 */
function toEurosSettings(settings: any) {
  return {
    id: settings.id,
    platformName: settings.platformName,
    region: settings.region,
    currency: settings.currency,
    timezone: settings.timezone,
    serviceFeeCents: settings.serviceFeeCents,
    serviceFee: toEuros(settings.serviceFeeCents),
    commissionRate: settings.commissionRate,
    commissionFixedCents: settings.commissionFixedCents,
    commissionFixed: toEuros(settings.commissionFixedCents),
    commissionBase: settings.commissionBase,
    minOrderCents: settings.minOrderCents,
    minOrder: toEuros(settings.minOrderCents),
    stripeFeeBearer: settings.stripeFeeBearer,
    payoutHoldDays: settings.payoutHoldDays,
    payoutInterval: settings.payoutInterval,
    payoutWeeklyAnchor: settings.payoutWeeklyAnchor,
    payoutMonthlyAnchor: settings.payoutMonthlyAnchor,
    vatRateBps: settings.vatRateBps,
    kvkNumber: settings.kvkNumber,
    supportEmail: settings.supportEmail,
    requireVerification: settings.requireVerification,
    autoApproveCooks: settings.autoApproveCooks,
    maintenanceMode: settings.maintenanceMode,
    updatedAt: settings.updatedAt,
  };
}
