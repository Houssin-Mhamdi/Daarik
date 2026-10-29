import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CookStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ApplyCookDto,
  UpdateAvailabilityDto,
  UpdateCookProfileDto,
} from "./dto/cook.dto";

@Injectable()
export class CooksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public cooks list — strips privateAddress, IBAN, and exact door instructions
   */
  async findAllPublic(params?: { city?: string; cuisine?: string; q?: string }) {
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

    const application = await this.prisma.cookApplication.create({
      data: {
        userId: userId ?? null,
        name: dto.name,
        email: dto.email,
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
        status: autoApprove ? "APPROVED" : "PENDING",
      },
    });

    return application;
  }

  async getMyDashboard(userId: string) {
    const cook = await this.getCookForUser(userId);

    const [orders, dishes, payouts] = await Promise.all([
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
    ]);

    const gross = orders
      .filter((o) => o.paid && !o.refunded)
      .reduce((sum, o) => sum + o.subtotal, 0);
    const commission = orders
      .filter((o) => o.paid && !o.refunded)
      .reduce((sum, o) => sum + o.commission, 0);
    const refunds = orders
      .filter((o) => o.refunded)
      .reduce((sum, o) => sum + o.total, 0);

    return {
      cook,
      stats: {
        gross: Number(gross.toFixed(2)),
        commission: Number(commission.toFixed(2)),
        net: Number((gross - commission).toFixed(2)),
        refunds: Number(refunds.toFixed(2)),
        activeDishes: dishes.filter((d) => d.status === "LIVE").length,
        incomingOrders: orders.filter((o) => o.status === "CONFIRMED").length,
        preparingOrders: orders.filter((o) => o.status === "PREPARING").length,
        readyOrders: orders.filter((o) => o.status === "READY").length,
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

  async getMyEarnings(userId: string) {
    const cook = await this.getCookForUser(userId);
    const [payouts, orders] = await Promise.all([
      this.prisma.payout.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.findMany({
        where: { cookId: cook.id, paid: true },
      }),
    ]);

    const gross = orders.reduce((s, o) => s + o.subtotal, 0);
    const commission = orders.reduce((s, o) => s + o.commission, 0);
    const refunds = orders
      .filter((o) => o.refunded)
      .reduce((s, o) => s + o.total, 0);
    const paidThisMonth = payouts
      .filter((p) => p.status === "PAID")
      .reduce((s, p) => s + p.net, 0);
    const pending = payouts
      .filter((p) => p.status !== "PAID")
      .reduce((s, p) => s + p.net, 0);

    return {
      gross: Number(gross.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      refunds: Number(refunds.toFixed(2)),
      pending: Number(pending.toFixed(2)),
      paidThisMonth: Number(paidThisMonth.toFixed(2)),
      nextPayoutDate: {
        nl: "3 november",
        en: "3 November",
        ar: "3 نوفمبر",
      },
      salesSeries: [78, 104, 66, 122, 91, 148, 132],
      payouts,
      bankDetails: {
        iban: cook.iban,
        accountHolder: cook.accountHolder,
        payoutDay: cook.payoutDay,
      },
    };
  }

  private async getCookForUser(userId: string) {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (!cook) {
      // Fallback to demo cook 'rana' if logged in as admin or demo user without linked profile
      const demo = await this.prisma.cookProfile.findUnique({
        where: { slug: "rana" },
      });
      if (!demo) {
        throw new ForbiddenException("Cook profile not found for this account");
      }
      return demo;
    }
    return cook;
  }

  private toPublicCook(cook: any) {
    const {
      privateAddress,
      instructions,
      iban,
      accountHolder,
      ...publicFields
    } = cook;
    return {
      ...publicFields,
      id: cook.slug || cook.id,
      dbId: cook.id,
    };
  }
}
