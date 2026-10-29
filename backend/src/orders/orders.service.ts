import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
        message: "Darna only allows ordering from one home kitchen per checkout.",
      });
    }

    const cook = dishes[0].dish.cook;
    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
    });
    const serviceFee = settings?.serviceFee ?? 1.5;
    const commissionRate = settings?.commissionRate ?? 0.15;

    const subtotal = dishes.reduce(
      (sum, entry) => sum + entry.dish.price * entry.qty,
      0,
    );
    const commission = Number((subtotal * commissionRate).toFixed(2));
    const total = Number((subtotal + serviceFee).toFixed(2));
    const code = `DR-${Math.floor(2425 + Math.random() * 7500)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // Decrement portionsLeft
      for (const entry of dishes) {
        await tx.dish.update({
          where: { id: entry.dish.id },
          data: { portionsLeft: { decrement: entry.qty } },
        });
      }

      // Increment cook ordersCount & credit in-app wallet if cook doesn't use Stripe Connect
      const cookNet = Number((subtotal - commission).toFixed(2));
      const isStripeRouting =
        Boolean(cook.stripeAccountId) && cook.payoutPreference === "STRIPE";

      await tx.cookProfile.update({
        where: { id: cook.id },
        data: {
          ordersCount: { increment: 1 },
          ...(!isStripeRouting
            ? { walletBalance: { increment: cookNet } }
            : {}),
        },
      });

      const created = await tx.order.create({
        data: {
          code,
          customerId: userId,
          cookId: cook.id,
          status: OrderStatus.CONFIRMED,
          pickup: dto.pickup,
          pickupTime: dto.pickupTime,
          subtotal: Number(subtotal.toFixed(2)),
          serviceFee,
          commission,
          total,
          payoutRouting: isStripeRouting ? "STRIPE_CONNECT" : "BANK_TRANSFER",
          note: dto.note
            ? { nl: dto.note, en: dto.note, ar: dto.note }
            : undefined,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          paymentMethod: dto.paymentMethod ?? PaymentMethod.IDEAL,
          paid: true,
          items: {
            create: dishes.map((entry) => ({
              dishId: entry.dish.id,
              qty: entry.qty,
              unitPrice: entry.dish.price,
              name: entry.dish.name as any,
            })),
          },
        },
        include: {
          cook: true,
          items: { include: { dish: true } },
        },
      });

      // Clear customer cart after successful checkout
      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    return this.formatCustomerOrder(order, true);
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        cook: true,
        items: { include: { dish: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) =>
      this.formatCustomerOrder(o, o.paid && o.status !== "CANCELLED"),
    );
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
      order.paid && order.status !== OrderStatus.CANCELLED;
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

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException("This order can no longer be cancelled");
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
          refunded: order.paid,
        },
        include: {
          cook: true,
          items: { include: { dish: true } },
        },
      });
    });

    return this.formatCustomerOrder(updated, false);
  }

  async getCookOrders(userId: string, statusFilter?: string) {
    const cook = await this.resolveCook(userId);
    const orders = await this.prisma.order.findMany({
      where: {
        cookId: cook.id,
        ...(statusFilter && statusFilter !== "all"
          ? { status: statusFilter.toUpperCase() as OrderStatus }
          : {}),
      },
      include: {
        items: { include: { dish: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
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
        unitPrice: i.unitPrice,
      })),
      status:
        o.status === OrderStatus.CONFIRMED
          ? "incoming"
          : o.status.toLowerCase(),
      pickup: { nl: "Vandaag", en: "Today", ar: "اليوم" },
      pickupTime: o.pickupTime,
      total: o.total,
      note: o.note,
      phone: o.customerPhone,
      placed: { nl: "Zojuist", en: "Just now", ar: "الآن" },
      createdAt: o.createdAt,
    }));
  }

  async updateCookOrderStatus(
    userId: string,
    idOrCode: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: dto.status },
      include: { items: { include: { dish: true } } },
    });
  }

  private async resolveCook(userId: string) {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (cook) return cook;
    const demo = await this.prisma.cookProfile.findUnique({
      where: { slug: "rana" },
    });
    if (!demo) {
      throw new ForbiddenException("Cook profile not found");
    }
    return demo;
  }

  private formatCustomerOrder(order: any, includePickupInstructions: boolean) {
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
            // Only expose pickup instructions on active paid orders
            instructions: includePickupInstructions
              ? order.cook.instructions
              : undefined,
          }
        : undefined,
      items: (order.items || []).map((i: any) => ({
        dishId: i.dish?.slug || i.dishId,
        qty: i.qty,
        unitPrice: i.unitPrice,
        name: i.name,
      })),
      status: order.status.toLowerCase(),
      pickup: order.pickup,
      pickupTime: order.pickupTime,
      subtotal: order.subtotal,
      serviceFee: order.serviceFee,
      total: order.total,
      note: order.note,
      reviewed: order.reviewed,
      refunded: order.refunded,
      paid: order.paid,
      placed: {
        nl: new Date(order.createdAt).toLocaleDateString("nl-NL"),
        en: new Date(order.createdAt).toLocaleDateString("en-GB"),
        ar: new Date(order.createdAt).toLocaleDateString("ar"),
      },
      createdAt: order.createdAt,
    };
  }
}
