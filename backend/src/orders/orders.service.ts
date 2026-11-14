import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ComplianceStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { randomInt } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";
import { computeOrderMoney, toEuros } from "../payments/money";
import { PaymentsService } from "../payments/payments.service";

const PAID_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.DISPUTED,
];

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Load items either from request body or from the user's cart
    let itemInputs = dto.items;
    if (!itemInputs || itemInputs.length === 0) {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: { dish: true },
      });
      if (cartItems.length === 0) {
        throw new BadRequestException("Your cart is empty");
      }
      itemInputs = cartItems.map((ci) => ({
        dishId: ci.dish.id,
        qty: ci.qty,
      }));
    }

    const dishes = await Promise.all(
      itemInputs.map(async (item) => {
        const dish = await this.prisma.dish.findFirst({
          where: { OR: [{ id: item.dishId }, { slug: item.dishId }] },
          include: { cook: true },
        });
        if (!dish || dish.status !== "LIVE") {
          throw new NotFoundException(`Dish ${item.dishId} is not available`);
        }
        if (dish.portionsLeft < item.qty) {
          throw new BadRequestException(
            `Not enough portions left for ${(dish.name as any)?.en || dish.slug}`,
          );
        }
        return { dish, qty: item.qty };
      }),
    );

    // Enforce single cook per checkout
    const cookIds = new Set(dishes.map((d) => d.dish.cookId));
    if (cookIds.size > 1) {
      throw new ConflictException({
        code: "DIFFERENT_COOK",
        message: "Daarik only allows ordering from one home kitchen per checkout.",
      });
    }

    const cook = dishes[0].dish.cook;

    if (!cook.kitchenOpen) {
      throw new ConflictException({
        code: "COOK_NOT_ORDERABLE",
        message: "This kitchen is on a break and is not accepting orders right now.",
      });
    }

    // A cook can only sell when BOTH gates are open: Stripe payouts enabled and
    // Daarik compliance approved. Stripe KYC is not a food-safety check.
    if (
      cook.status !== "VERIFIED" ||
      cook.complianceStatus !== ComplianceStatus.APPROVED ||
      !cook.stripePayoutsEnabled
    ) {
      throw new ConflictException({
        code: "COOK_NOT_ORDERABLE",
        message: "This kitchen is not accepting orders right now.",
      });
    }

    const settings =
      (await this.prisma.platformSetting.findUnique({
        where: { id: "singleton" },
      })) ?? (await this.prisma.platformSetting.create({ data: { id: "singleton" } }));

    // Prices come from the database, in cents. Nothing is trusted from the client.
    const subtotalCents = dishes.reduce(
      (sum, entry) => sum + Math.round(entry.dish.price * 100) * entry.qty,
      0,
    );

    const money = computeOrderMoney(subtotalCents, {
      serviceFeeCents: settings.serviceFeeCents,
      commissionRate: settings.commissionRate,
      commissionFixedCents: settings.commissionFixedCents,
      commissionBase: settings.commissionBase,
    });

    if (money.totalCents < settings.minOrderCents) {
      throw new BadRequestException(
        `Minimum order value is €${toEuros(settings.minOrderCents).toFixed(2)}`,
      );
    }

    const code = `DR-${randomInt(10000, 99999)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const entry of dishes) {
        await tx.dish.update({
          where: { id: entry.dish.id },
          data: { portionsLeft: { decrement: entry.qty } },
        });
      }

      await tx.cookProfile.update({
        where: { id: cook.id },
        data: { ordersCount: { increment: 1 } },
      });

      const created = await tx.order.create({
        data: {
          code,
          customerId: userId,
          cookId: cook.id,
          status: OrderStatus.CONFIRMED,
          pickup: dto.pickup,
          pickupTime: dto.pickupTime,
          subtotalCents: money.subtotalCents,
          serviceFeeCents: money.serviceFeeCents,
          commissionCents: money.commissionCents,
          cookNetCents: money.cookNetCents,
          totalCents: money.totalCents,
          currency: "eur",
          note: dto.note
            ? { nl: dto.note, en: dto.note, ar: dto.note }
            : undefined,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          paymentMethod: dto.paymentMethod ?? PaymentMethod.IDEAL,
          // Nothing is paid until Stripe confirms it via webhook.
          paymentStatus: PaymentStatus.REQUIRES_PAYMENT,
          items: {
            create: dishes.map((entry) => ({
              dishId: entry.dish.id,
              qty: entry.qty,
              unitPriceCents: Math.round(entry.dish.price * 100),
              name: entry.dish.name as any,
            })),
          },
        },
        include: {
          cook: true,
          items: { include: { dish: true } },
        },
      });

      // Clear the cart once the order exists. Payment happens afterwards.
      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    return this.formatCustomerOrder(order, false);
  }

  async getMyOrders(
    userId: string,
    params?: { page?: string; limit?: string; tab?: string },
  ) {
    const page = Math.max(1, Number(params?.page) || 1);
    const rawLimit = params?.limit ? Number(params.limit) : 0;
    const limit = rawLimit > 0 ? Math.min(100, rawLimit) : 0;
    const usePaging = limit > 0;

    const statusFilter =
      params?.tab === "completed"
        ? { status: OrderStatus.COMPLETED }
        : params?.tab === "cancelled"
          ? { status: OrderStatus.CANCELLED }
          : params?.tab === "upcoming"
            ? {
                status: {
                  in: [
                    OrderStatus.CONFIRMED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                  ],
                },
              }
            : {};

    const where = { customerId: userId, ...statusFilter };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          cook: true,
          items: { include: { dish: true } },
        },
        orderBy: { createdAt: "desc" },
        ...(usePaging ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
    ]);

    const items = orders.map((o) =>
      this.formatCustomerOrder(
        o,
        PAID_STATUSES.includes(o.paymentStatus) &&
          o.status !== OrderStatus.CANCELLED,
      ),
    );

    return { items, total, page: usePaging ? page : 1, limit: usePaging ? limit : total };
  }

  async getOrderById(userId: string, idOrCode: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
      include: {
        cook: true,
        items: { include: { dish: true } },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const includeInstructions =
      PAID_STATUSES.includes(order.paymentStatus) &&
      order.status !== OrderStatus.CANCELLED;
    return this.formatCustomerOrder(order, includeInstructions);
  }

  async cancelOrder(userId: string, idOrCode: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.customerId !== userId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException("This order can no longer be cancelled");
    }

    // Paid orders must be refunded through Stripe, not just relabelled.
    if (PAID_STATUSES.includes(order.paymentStatus)) {
      await this.payments.refundOrder(
        order.id,
        { reason: "Customer cancelled the order" },
        `customer:${userId}`,
      );
      return this.getOrderById(userId, order.id);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.dish.update({
          where: { id: item.dishId },
          data: { portionsLeft: { increment: item.qty } },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
        },
        include: {
          cook: true,
          items: { include: { dish: true } },
        },
      });
    });

    return this.formatCustomerOrder(updated, false);
  }

  async getCookOrders(
    userId: string,
    statusFilter?: string,
    page?: string,
    limit?: string,
  ) {
    const cook = await this.resolveCook(userId);
    const p = Math.max(1, Number(page) || 1);
    const rawL = limit ? Number(limit) : 0;
    const l = rawL > 0 ? Math.min(100, rawL) : 0;
    const usePaging = l > 0;

    const where = {
      cookId: cook.id,
      ...(statusFilter && statusFilter !== "all"
        ? { status: statusFilter.toUpperCase() as OrderStatus }
        : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { dish: true } },
        },
        orderBy: { createdAt: "desc" },
        ...(usePaging ? { skip: (p - 1) * l, take: l } : {}),
      }),
    ]);

    const items = orders.map((o) => ({
      id: o.id,
      code: o.code,
      customer: o.customerName,
      initials: o.customerName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      items: o.items.map((i) => ({
        dishId: i.dish.slug || i.dishId,
        qty: i.qty,
        name: i.name,
        unitPrice: toEuros(i.unitPriceCents),
      })),
      status:
        o.status === OrderStatus.CONFIRMED
          ? "incoming"
          : o.status.toLowerCase(),
      paymentStatus: o.paymentStatus,
      pickup: { nl: "Vandaag", en: "Today", ar: "اليوم" },
      pickupTime: o.pickupTime,
      total: toEuros(o.totalCents),
      note: o.note,
      phone: o.customerPhone,
      placed: { nl: "Zojuist", en: "Just now", ar: "الآن" },
      createdAt: o.createdAt,
    }));

    return {
      items,
      total,
      page: usePaging ? p : 1,
      limit: usePaging ? l : total,
    };
  }

  async updateCookOrderStatus(
    userId: string,
    idOrCode: string,
    dto: UpdateOrderStatusDto,
  ) {
    const cook = await this.resolveCook(userId);
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
        cookId: cook.id,
      },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const completing =
      dto.status === OrderStatus.COMPLETED &&
      order.status !== OrderStatus.COMPLETED;

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: dto.status },
      include: { items: { include: { dish: true } } },
    });

    // Completing an order starts the hold clock for the earnings release.
    if (completing) {
      await this.payments.scheduleEarningsRelease(order.id, new Date());
    }

    return updated;
  }

  private async resolveCook(userId: string) {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (!cook) {
      throw new ForbiddenException("No cook profile is linked to this account");
    }
    return cook;
  }

  private formatCustomerOrder(order: any, includePickupInstructions: boolean) {
    const paid = PAID_STATUSES.includes(order.paymentStatus);
    return {
      id: order.id,
      code: order.code,
      cookId: order.cook?.slug || order.cookId,
      cook: order.cook
        ? {
            id: order.cook.slug,
            name: order.cook.name,
            avatar: order.cook.avatar,
            city: order.cook.city,
            area: order.cook.area,
            pickupArea: order.cook.pickupArea,
            response: order.cook.response,
            instructions: includePickupInstructions
              ? order.cook.instructions
              : undefined,
          }
        : undefined,
      items: (order.items || []).map((i: any) => ({
        dishId: i.dish?.slug || i.dishId,
        qty: i.qty,
        unitPrice: toEuros(i.unitPriceCents),
        name: i.name,
      })),
      status: order.status.toLowerCase(),
      paymentStatus: order.paymentStatus,
      pickup: order.pickup,
      pickupTime: order.pickupTime,
      subtotal: toEuros(order.subtotalCents),
      serviceFee: toEuros(order.serviceFeeCents),
      total: toEuros(order.totalCents),
      note: order.note,
      reviewed: order.reviewed,
      refunded: order.refundedCents > 0,
      paid,
      placed: {
        nl: new Date(order.createdAt).toLocaleDateString("nl-NL"),
        en: new Date(order.createdAt).toLocaleDateString("en-GB"),
        ar: new Date(order.createdAt).toLocaleDateString("ar"),
      },
      createdAt: order.createdAt,
    };
  }
}
