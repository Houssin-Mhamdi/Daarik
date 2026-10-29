import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ApplicationStatus,
  CookStatus,
  DisputeStatus,
  PayoutStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ModerateDishDto,
  ResolveDisputeDto,
  ReviewApplicationDto,
  UpdateAdminOrderStatusDto,
  UpdateCookStatusDto,
  UpdatePayoutStatusDto,
  UpdatePlatformSettingsDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview(range = "30d") {
    const [
      orders,
      cooks,
      customersCount,
      verificationQueue,
      disputes,
      payouts,
    ] = await Promise.all([
      this.prisma.order.findMany({
        include: { cook: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      this.prisma.cookProfile.findMany({
        orderBy: { ordersCount: "desc" },
      }),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.cookApplication.findMany({
        where: { status: ApplicationStatus.PENDING },
        orderBy: { submittedAt: "desc" },
      }),
      this.prisma.dispute.findMany({
        where: { status: { not: DisputeStatus.RESOLVED } },
      }),
      this.prisma.payout.findMany(),
    ]);

    const baseRevenue = [
      1420, 1680, 1510, 1890, 1760, 2140, 1980, 2320, 2210, 2480, 2360, 2740,
      2590, 2810, 2660, 3040, 2890, 3120, 2980, 3310, 3180, 3460, 3290, 3620,
      3410, 3680, 3520, 3890, 3710, 3980,
    ];
    const revenueSeries =
      range === "90d"
        ? baseRevenue.map((v, i) => Math.round(v * 2.85 + Math.sin(i / 2) * 180))
        : baseRevenue;

    return {
      kpis: {
        gmv: 48260,
        commission: 7239,
        activeCooks: Math.max(cooks.length, 247),
        activeCustomers: Math.max(customersCount, 3184),
        ordersToday: 186,
        pendingVerifications: verificationQueue.length,
        disputes: disputes.length,
        avgOrder: 23.4,
        refundRate: 1.8,
        newCooks: 18,
      },
      revenueSeries,
      weeklyOrders: [148, 176, 152, 196, 214, 246, 91],
      topCuisines: [
        { name: "Moroccan", orders: 1284, share: 32 },
        { name: "Tunisian", orders: 972, share: 24 },
        { name: "Syrian", orders: 806, share: 20 },
        { name: "Lebanese", orders: 594, share: 15 },
        { name: "Other", orders: 364, share: 9 },
      ],
      topCooks: cooks.slice(0, 6),
      verificationQueue,
      recentOrders: orders.map((o) => ({
        id: o.id,
        code: o.code,
        customer: o.customerName,
        cook: o.cook.name,
        amount: o.total,
        status: o.status.toLowerCase(),
        pickup: `${o.pickup} · ${o.pickupTime}`,
        placed: o.createdAt,
      })),
      payoutsSummary: {
        due: payouts
          .filter((p) => p.status !== PayoutStatus.PAID)
          .reduce((s, p) => s + p.net, 0),
        pendingCount: payouts.filter((p) => p.status !== PayoutStatus.PAID)
          .length,
      },
    };
  }

  async getOrders(query: { status?: string; q?: string }) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(query.status && query.status !== "all"
          ? { status: query.status.toUpperCase() as any }
          : {}),
        ...(query.q
          ? {
              OR: [
                { code: { contains: query.q, mode: "insensitive" } },
                { customerName: { contains: query.q, mode: "insensitive" } },
                {
                  cook: {
                    name: { contains: query.q, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        cook: true,
        items: { include: { dish: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
      id: o.id,
      code: o.code,
      customer: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      cook: o.cook.name,
      cookId: o.cook.slug,
      amount: o.total,
      subtotal: o.subtotal,
      serviceFee: o.serviceFee,
      commission: o.commission,
      status: o.status.toLowerCase(),
      pickup: `${o.pickup} · ${o.pickupTime}`,
      paid: o.paid,
      refunded: o.refunded,
      items: o.items,
      createdAt: o.createdAt,
    }));
  }

  async updateOrderStatus(idOrCode: string, dto: UpdateAdminOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: dto.status,
        refunded: dto.status === "CANCELLED" ? true : order.refunded,
      },
    });
  }

  async getCooks(query: { status?: string; q?: string }) {
    const [cooks, applications] = await Promise.all([
      this.prisma.cookProfile.findMany({
        where: {
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
        },
        include: {
          _count: { select: { dishes: true, orders: true } },
        },
        orderBy: { ordersCount: "desc" },
      }),
      this.prisma.cookApplication.findMany({
        where: { status: ApplicationStatus.PENDING },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

    return { cooks, verificationQueue: applications };
  }

  async updateCookStatus(idOrSlug: string, dto: UpdateCookStatusDto) {
    const cook = await this.prisma.cookProfile.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!cook) {
      throw new NotFoundException("Cook not found");
    }

    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        status: dto.status,
        verified: dto.status === CookStatus.VERIFIED,
      },
    });
  }

  async approveApplication(id: string, dto: ReviewApplicationDto) {
    const app = await this.prisma.cookApplication.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException("Application not found");
    }

    return this.prisma.cookApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.APPROVED,
        reviewerNotes: dto.notes,
        reviewedAt: new Date(),
      },
    });
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

  async getDishes(query: { filter?: string; q?: string }) {
    const dishes = await this.prisma.dish.findMany({
      where: {
        ...(query.filter === "reported"
          ? { reported: true }
          : query.filter && query.filter !== "all"
            ? { status: query.filter.toUpperCase() as any }
            : {}),
      },
      include: { cook: true },
      orderBy: { updatedAt: "desc" },
    });

    return dishes.map((d) => ({
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

  async getPayouts() {
    const payouts = await this.prisma.payout.findMany({
      include: { cook: true },
      orderBy: { createdAt: "desc" },
    });

    return payouts.map((p) => ({
      id: p.code,
      dbId: p.id,
      cook: p.cook.name,
      cookId: p.cook.slug,
      period: p.period,
      gross: p.gross,
      commission: p.commission,
      net: p.net,
      ordersCount: p.ordersCount,
      status: p.status.toLowerCase(),
      paidAt: p.paidAt,
    }));
  }

  async updatePayoutStatus(idOrCode: string, dto: UpdatePayoutStatusDto) {
    const payout = await this.prisma.payout.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    return this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: dto.status,
        paidAt: dto.status === PayoutStatus.PAID ? new Date() : payout.paidAt,
      },
    });
  }

  async runScheduledPayouts() {
    const scheduled = await this.prisma.payout.findMany({
      where: { status: PayoutStatus.SCHEDULED },
    });

    await this.prisma.payout.updateMany({
      where: { status: PayoutStatus.SCHEDULED },
      data: { status: PayoutStatus.PROCESSING },
    });

    return {
      processedCount: scheduled.length,
      totalAmount: Number(
        scheduled.reduce((sum, p) => sum + p.net, 0).toFixed(2),
      ),
    };
  }

  async getDisputes(status?: string) {
    const disputes = await this.prisma.dispute.findMany({
      where: {
        ...(status && status !== "all"
          ? { status: status.toUpperCase() as DisputeStatus }
          : {}),
      },
      orderBy: { openedAt: "desc" },
    });

    return disputes.map((d) => ({
      id: d.code,
      dbId: d.id,
      code: d.orderCode,
      customer: d.customerName,
      cook: d.cookName,
      reason: d.reason,
      customerNote: d.customerNote,
      resolutionNote: d.resolutionNote,
      amount: d.amount,
      refundAmount: d.refundAmount,
      status: d.status.toLowerCase(),
      opened: d.openedAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      resolvedAt: d.resolvedAt,
    }));
  }

  async resolveDispute(idOrCode: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    return this.prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: dto.status ?? DisputeStatus.RESOLVED,
        refundAmount: dto.refundAmount ?? dispute.amount,
        resolutionNote: dto.resolutionNote,
        resolvedAt: new Date(),
      },
    });
  }

  async getSettings() {
    const settings = await this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return settings;
  }

  async updateSettings(dto: UpdatePlatformSettingsDto) {
    return this.prisma.platformSetting.upsert({
      where: { id: "singleton" },
      update: dto,
      create: { id: "singleton", ...dto },
    });
  }
}
