import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ComplianceStatus,
  CookStatus,
  PaymentStatus,
  TransferStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ApplyCookDto,
  UpdateAvailabilityDto,
  UpdateCookProfileDto,
} from "./dto/cook.dto";
import { toEuros } from "../payments/money";

/** Payment states in which the customer's money has actually been captured. */
const CAPTURED_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.DISPUTED,
];

@Injectable()
export class CooksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public cooks list — strips privateAddress, bank details and exact door
   * instructions.
   */
  async findAllPublic(params?: {
    city?: string;
    cuisine?: string;
    q?: string;
  }) {
    const cooks = await this.prisma.cookProfile.findMany({
      where: {
        status: CookStatus.VERIFIED,
        ...(params?.city
          ? { city: { equals: params.city, mode: "insensitive" } }
          : {}),
        ...(params?.cuisine ? { cuisineIds: { has: params.cuisine } } : {}),
        ...(params?.q
          ? { name: { contains: params.q, mode: "insensitive" } }
          : {}),
      },
      orderBy: [{ rating: "desc" }, { ordersCount: "desc" }],
    });

    return cooks.map((c) => this.toPublicCook(c));
  }

  /**
   * Public cook detail — strips exact home address & private door instructions
   */
  async findOnePublic(idOrSlug: string) {
    const cook = await this.prisma.cookProfile.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        dishes: {
          where: { status: "LIVE" },
          orderBy: { featured: "desc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!cook) {
      throw new NotFoundException("Cook not found");
    }

    return {
      ...this.toPublicCook(cook),
      dishes: cook.dishes,
      reviews: cook.reviews,
    };
  }

  async submitApplication(userId: string | undefined, dto: ApplyCookDto) {
    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
    });

    const autoApprove = settings?.autoApproveCooks ?? false;

    // Resolve userId from the authenticated token or by matching the email
    let resolvedUserId = userId ?? null;
    if (!resolvedUserId && dto.email) {
      const matchingUser = await this.prisma.user.findFirst({
        where: { email: { equals: dto.email.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      if (matchingUser) {
        resolvedUserId = matchingUser.id;
      }
    }

    const existing = await this.prisma.cookApplication.findFirst({
      where: {
        OR: [
          ...(resolvedUserId ? [{ userId: resolvedUserId }] : []),
          { email: { equals: dto.email.trim(), mode: "insensitive" } },
        ],
      },
      orderBy: { submittedAt: "desc" },
    });

    const application = existing
      ? await this.prisma.cookApplication.update({
          where: { id: existing.id },
          data: {
            userId: resolvedUserId ?? existing.userId,
            name: dto.name,
            email: dto.email.trim(),
            phone: dto.phone,
            city: dto.city,
            area: dto.area,
            cuisine: dto.cuisine,
            specialties: dto.specialties,
            bio: dto.bio,
            yearsCooking: dto.yearsCooking ?? 5,
            hygieneCertificate: dto.hygieneCertificate ?? true,
            idVerified: dto.idVerified ?? true,
            kitchenPhotos: dto.kitchenPhotos ?? [],
            status: "PENDING",
            submittedAt: new Date(),
          },
        })
      : await this.prisma.cookApplication.create({
          data: {
            userId: resolvedUserId,
            name: dto.name,
            email: dto.email.trim(),
            phone: dto.phone,
            city: dto.city,
            area: dto.area,
            cuisine: dto.cuisine,
            specialties: dto.specialties,
            bio: dto.bio,
            yearsCooking: dto.yearsCooking ?? 5,
            hygieneCertificate: dto.hygieneCertificate ?? true,
            idVerified: dto.idVerified ?? true,
            kitchenPhotos: dto.kitchenPhotos ?? [],
            status: "PENDING",
          },
        });

    if (autoApprove && application.userId) {
      await this.ensureCookProfileForApplication(application);
      return this.prisma.cookApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });
    }

    return application;
  }

  async getMyApplication(userId?: string, queryEmail?: string) {
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            cookProfile: { select: { id: true, status: true } },
          },
        })
      : null;

    const lookupEmail = (user?.email || queryEmail || "").trim();
    if (!userId && !lookupEmail) {
      return null;
    }

    const app = await this.prisma.cookApplication.findFirst({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(lookupEmail
            ? [{ email: { equals: lookupEmail, mode: "insensitive" as const } }]
            : []),
        ],
      },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        userId: true,
        status: true,
        submittedAt: true,
        reviewerNotes: true,
      },
    });

    if (app) {
      // Backfill userId if the application was submitted before userId was linked
      if (userId && !app.userId) {
        await this.prisma.cookApplication.update({
          where: { id: app.id },
          data: { userId },
        });
      }
      return {
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewerNotes: app.reviewerNotes,
      };
    }

    // If the user already has a verified CookProfile, treat their application as APPROVED
    if (user?.cookProfile) {
      return {
        id: user.cookProfile.id,
        status: "APPROVED" as const,
        submittedAt: new Date(),
        reviewerNotes: null,
      };
    }

    return null;
  }

  async ensureCookProfileForApplication(application: {
    userId: string | null;
    name: string;
    city: string;
    cuisine: string;
    specialties: string | null;
    bio: string | null;
    yearsCooking: number;
  }) {
    if (!application.userId) return null;

    // Promote user role to COOK so they can access all cook endpoints
    await this.prisma.user.update({
      where: { id: application.userId },
      data: { role: "COOK" },
    });

    const localized = (value: string) => ({ nl: value, en: value, ar: value });
    const baseSlug = application.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    return this.prisma.cookProfile.upsert({
      where: { userId: application.userId },
      update: {
        status: CookStatus.VERIFIED,
        verified: true,
        complianceStatus: ComplianceStatus.APPROVED,
        complianceCheckedAt: new Date(),
      },
      create: {
        slug: `${baseSlug || "cook"}-${application.userId.slice(-8)}`,
        userId: application.userId,
        name: application.name,
        city: application.city,
        area: localized(application.city),
        cuisineIds: application.cuisine ? [application.cuisine] : [],
        languages: ["Nederlands", "English"],
        bio: localized(application.bio ?? ""),
        response: localized("1 uur"),
        pickupArea: localized(application.city),
        specialties: localized(application.specialties ?? application.cuisine),
        instructions: localized(""),
        yearsCooking: application.yearsCooking,
        status: CookStatus.VERIFIED,
        verified: true,
        complianceStatus: ComplianceStatus.APPROVED,
        complianceCheckedAt: new Date(),
      },
    });
  }

  async getMyDashboard(userId: string) {
    const cook = await this.getCookForUser(userId);
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(
      weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
    );

    const [orders, dishes, payouts, weeklyOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { cookId: cook.id },
        include: { items: { include: { dish: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.dish.findMany({
        where: { cookId: cook.id },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.payout.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.order.findMany({
        where: { cookId: cook.id, createdAt: { gte: weekStart } },
        select: { createdAt: true, paymentStatus: true, subtotalCents: true },
      }),
    ]);

    const captured = orders.filter((o) =>
      CAPTURED_STATUSES.includes(o.paymentStatus),
    );

    const grossCents = captured.reduce((sum, o) => sum + o.subtotalCents, 0);
    const commissionCents = captured.reduce(
      (sum, o) => sum + o.commissionCents,
      0,
    );
    const netCents = captured.reduce((sum, o) => sum + o.cookNetCents, 0);
    const refundedCents = orders.reduce((sum, o) => sum + o.refundedCents, 0);
    const weeklySalesCents = Array<number>(7).fill(0);
    for (const order of weeklyOrders) {
      if (!CAPTURED_STATUSES.includes(order.paymentStatus)) continue;
      const weekday = (order.createdAt.getUTCDay() + 6) % 7;
      weeklySalesCents[weekday] += order.subtotalCents;
    }

    return {
      cook,
      stats: {
        gross: toEuros(grossCents),
        commission: toEuros(commissionCents),
        net: toEuros(netCents),
        refunds: toEuros(refundedCents),
        activeDishes: dishes.filter((d) => d.status === "LIVE").length,
        incomingOrders: orders.filter((o) => o.status === "CONFIRMED").length,
        preparingOrders: orders.filter((o) => o.status === "PREPARING").length,
        readyOrders: orders.filter((o) => o.status === "READY").length,
        weeklySales: weeklySalesCents.map(toEuros),
      },
      recentOrders: orders,
      dishes,
      payouts,
    };
  }

  async getMyProfile(userId: string) {
    return this.getCookForUser(userId);
  }

  async updateMyProfile(userId: string, dto: UpdateCookProfileDto) {
    const cook = await this.getCookForUser(userId);
    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: dto as any,
    });
  }

  async getMyAvailability(userId: string) {
    const cook = await this.getCookForUser(userId);
    const pickupOptions = await this.prisma.pickupOption.findMany();
    return {
      kitchenOpen: cook.kitchenOpen,
      maxPortionsPerDay: cook.maxPortionsPerDay,
      availableDays: cook.availableDays,
      availableSlots: cook.availableSlots,
      pickupOptions,
    };
  }

  async updateMyAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const cook = await this.getCookForUser(userId);
    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        kitchenOpen: dto.kitchenOpen,
        maxPortionsPerDay: dto.maxPortionsPerDay,
        availableDays: dto.availableDays,
        availableSlots: dto.availableSlots,
      },
    });
  }

  /**
   * Legacy earnings view kept for the cook dashboard. The authoritative
   * payout/transfer view lives in `GET /payments/cook/earnings`.
   */
  async getMyEarnings(userId: string) {
    const cook = await this.getCookForUser(userId);

    const [orders, transfers, payouts] = await Promise.all([
      this.prisma.order.findMany({ where: { cookId: cook.id } }),
      this.prisma.transfer.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payout.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const captured = orders.filter((o) =>
      CAPTURED_STATUSES.includes(o.paymentStatus),
    );

    const grossCents = captured.reduce((s, o) => s + o.subtotalCents, 0);
    const commissionCents = captured.reduce((s, o) => s + o.commissionCents, 0);
    const refundedCents = orders.reduce((s, o) => s + o.refundedCents, 0);
    const pendingCents = captured
      .filter((o) => !o.transferEligibleAt || o.transferEligibleAt > new Date())
      .reduce((s, o) => s + o.cookNetCents, 0);
    const releasedCents = transfers
      .filter((t) => t.status === TransferStatus.CREATED)
      .reduce((s, t) => s + t.amountCents - t.reversedCents, 0);
    const paidOutCents = payouts
      .filter((p) => p.status === "PAID")
      .reduce((s, p) => s + p.amountCents, 0);

    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
    });

    return {
      gross: toEuros(grossCents),
      commission: toEuros(commissionCents),
      refunds: toEuros(refundedCents),
      pending: toEuros(pendingCents),
      released: toEuros(releasedCents),
      paidOut: toEuros(paidOutCents),
      holdDays: cook.payoutHoldDays ?? settings?.payoutHoldDays ?? 7,
      payouts: payouts.map((p) => ({
        ...p,
        amount: toEuros(p.amountCents),
        gross: toEuros(p.grossCents),
        commission: toEuros(p.commissionCents),
      })),
      bankDetails: {
        bankName: cook.bankName,
        ibanLast4: cook.ibanLast4,
      },
      stripe: {
        connected: Boolean(cook.stripeAccountId),
        status: cook.stripeAccountStatus,
        payoutsEnabled: cook.stripePayoutsEnabled,
      },
      compliance: cook.complianceStatus,
    };
  }

  /**
   * Strict cook lookup. There is deliberately no demo fallback: falling back to
   * another cook would leak or mutate someone else's data.
   */
  private async getCookForUser(userId: string) {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (!cook) {
      throw new ForbiddenException("No cook profile is linked to this account");
    }
    return cook;
  }

  /**
   * Strips everything a customer must never see: exact address, door
   * instructions, bank details and Stripe identifiers.
   */
  private toPublicCook(cook: any) {
    const {
      privateAddress,
      instructions,
      bankName,
      ibanLast4,
      stripeAccountId,
      stripeAccountStatus,
      stripeChargesEnabled,
      stripePayoutsEnabled,
      stripeRequirementsDue,
      stripeDisabledReason,
      stripeSyncedAt,
      complianceStatus,
      complianceNote,
      complianceCheckedAt,
      complianceCheckedBy,
      kvkNumber,
      nvwaRegistered,
      payoutHoldDays,
      payoutDay,
      ...publicFields
    } = cook;

    const approx = (v: unknown) =>
      typeof v === "number" ? Math.round(v * 100) / 100 : null;

    return {
      ...publicFields,
      latitude: approx(cook.latitude),
      longitude: approx(cook.longitude),
      id: cook.slug || cook.id,
      dbId: cook.id,
    };
  }
}
