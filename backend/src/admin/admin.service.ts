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
  ) {}

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
        activeCooks: cooks.length,
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
    };
  }

  async updateOrderStatus(
    idOrCode: string,
    dto: UpdateAdminOrderStatusDto,
    adminId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Cancelling a paid order must move real money, not just relabel a row.
    if (
      dto.status === OrderStatus.CANCELLED &&
      CAPTURED_STATUSES.includes(order.paymentStatus) &&
      order.refundedCents < order.totalCents
    ) {
      await this.payments.refundOrder(
        order.id,
        { reason: "Cancelled by Daarik admin" },
        `admin:${adminId}`,
      );
      return this.prisma.order.findUnique({ where: { id: order.id } });
    }

    if (
      dto.status === OrderStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      const updated = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
      });
      await this.payments.scheduleEarningsRelease(order.id, new Date());
      return updated;
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: dto.status },
    });
  }

  async refundOrder(
    idOrCode: string,
    dto: { amount?: number; reason?: string },
    adminId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) throw new NotFoundException("Order not found");

    return this.payments.refundOrder(order.id, dto, `admin:${adminId}`);
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

    return {
      cooks: cooks.map((c) => this.toAdminCook(c)),
      verificationQueue: applications,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
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

  async createCookDish(idOrSlug: string, dto: CreateDishDto) {
    const cook = await this.findCook(idOrSlug);
    const baseSlug = (dto.name.en || dto.name.nl || "dish")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return this.prisma.dish.create({
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
  }

  async updateCookAvailability(idOrSlug: string, dto: UpdateAvailabilityDto) {
    const cook = await this.findCook(idOrSlug);
    return this.prisma.cookProfile.update({
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
  }

  async updateCookStatus(idOrSlug: string, dto: UpdateCookStatusDto) {
    const cook = await this.findCook(idOrSlug);
    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        status: dto.status,
        verified: dto.status === CookStatus.VERIFIED,
      },
    });
  }

  /** Re-reads the connected account so admin decisions use Stripe's real state. */
  async syncCookAccount(idOrSlug: string) {
    const cook = await this.findCook(idOrSlug);
    if (!cook.stripeAccountId) {
      throw new BadRequestException("This cook has no Stripe account yet");
    }
    return this.payments.syncAccount(cook.stripeAccountId);
  }

  /**
   * Updates Daarik's own compliance gate. Approving here does NOT skip Stripe
   * onboarding, and Stripe verification does NOT satisfy this gate.
   */
  async updateCookCompliance(
    idOrSlug: string,
    dto: UpdateCookComplianceDto,
    adminId: string,
  ) {
    const cook = await this.findCook(idOrSlug);

    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        complianceStatus: dto.status,
        complianceNote: dto.note ?? cook.complianceNote,
        complianceCheckedAt: new Date(),
        complianceCheckedBy: `admin:${adminId}`,
        ...(dto.kvkNumber !== undefined ? { kvkNumber: dto.kvkNumber } : {}),
        ...(dto.nvwaRegistered !== undefined
          ? { nvwaRegistered: dto.nvwaRegistered }
          : {}),
        ...(dto.payoutHoldDays !== undefined
          ? { payoutHoldDays: dto.payoutHoldDays }
          : {}),
      },
    });
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

  async approveApplication(id: string, dto: ReviewApplicationDto) {
    const app = await this.prisma.cookApplication.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException("Application not found");
    }

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
        reviewerNotes: dto.notes,
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

  async requestApplicationChanges(id: string, dto: ReviewApplicationDto) {
    const app = await this.prisma.cookApplication.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException("Application not found");
    }

    return this.prisma.cookApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.CHANGES_REQUESTED,
        reviewerNotes: dto.notes,
        reviewedAt: new Date(),
      },
    });
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
    };
  }

  async moderateDish(idOrSlug: string, dto: ModerateDishDto) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    return this.prisma.dish.update({
      where: { id: dish.id },
      data: {
        status: dto.status,
        reported: dto.status === "LIVE" ? false : dish.reported,
      },
    });
  }

  async removeDish(idOrSlug: string) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    return this.prisma.dish.update({
      where: { id: dish.id },
      data: { status: "PAUSED" },
    });
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
  async updatePayoutStatus(idOrCode: string, dto: UpdatePayoutStatusDto) {
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

    return this.prisma.payout.update({
      where: { id: payout.id },
      data: { status: PayoutStatus.CANCELED },
    });
  }

  async syncPayout(idOrCode: string) {
    return this.payments.syncPayout(idOrCode);
  }

  /** Releases all eligible order earnings (the same job the scheduler runs). */
  async releaseTransfers() {
    return this.payments.releaseNow();
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

    const items = disputes.map((d) => ({
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
    }));

    return {
      items,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
    };
  }

  async resolveDispute(idOrCode: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    // A refund tied to a dispute must go through Stripe, not a local field.
    if (dto.refundAmount && dto.refundAmount > 0) {
      if (!dispute.orderId) {
        throw new BadRequestException(
          "This dispute is not linked to an order, so it cannot be refunded automatically",
        );
      }
      await this.payments.refundOrder(
        dispute.orderId,
        { amount: dto.refundAmount, reason: dto.resolutionNote ?? "dispute" },
        "admin:dispute",
      );
    }

    return this.prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: dto.status ?? DisputeStatus.RESOLVED,
        refundCents:
          dto.refundAmount != null
            ? Math.round(dto.refundAmount * 100)
            : dispute.refundCents,
        resolutionNote: dto.resolutionNote,
        resolvedAt: new Date(),
      },
    });
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

  async getSettings() {
    const settings = await this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return toEurosSettings(settings);
  }

  async updateSettings(dto: UpdatePlatformSettingsDto) {
    const { serviceFee, serviceFeeCents, ...rest } = dto;

    const settings = await this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: {
        ...rest,
        ...(serviceFeeCents !== undefined
          ? { serviceFeeCents, serviceFee: serviceFeeCents / 100 }
          : serviceFee !== undefined
            ? { serviceFee, serviceFeeCents: Math.round(serviceFee * 100) }
            : {}),
      },
      create: {
        id: "singleton",
        ...rest,
        ...(serviceFeeCents !== undefined
          ? { serviceFeeCents, serviceFee: serviceFeeCents / 100 }
          : serviceFee !== undefined
            ? { serviceFee, serviceFeeCents: Math.round(serviceFee * 100) }
            : {}),
      },
    });

    // Keep the connected accounts' payout schedules aligned with the policy.
    if (dto.payoutInterval) {
      await this.payments.applyPayoutPolicyToCooks();
    }

    return toEurosSettings(settings);
  }
}

/** Adds euro views next to the cents fields the admin UI displays. */
function toEurosSettings(settings: any) {
  return {
    ...settings,
    serviceFee: toEuros(settings.serviceFeeCents),
    commissionFixed: toEuros(settings.commissionFixedCents),
    minOrder: toEuros(settings.minOrderCents),
  };
}
