import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        dish: {
          include: {
            cook: {
              select: {
                id: true,
                slug: true,
                name: true,
                avatar: true,
                city: true,
                area: true,
                pickupArea: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
    });
    const serviceFee = settings?.serviceFee ?? 1.5;

    const subtotal = items.reduce(
      (sum, item) => sum + item.dish.price * item.qty,
      0,
    );
    const total = items.length > 0 ? subtotal + serviceFee : 0;
    const cook = items[0]?.dish.cook ?? null;

    return {
      cook,
      items: items.map((item) => ({
        id: item.id,
        dishId: item.dish.slug || item.dish.id,
        qty: item.qty,
        pickupSlot: item.pickupSlot,
        pickupTime: item.pickupTime,
        note: item.note,
        dish: {
          ...item.dish,
          id: item.dish.slug || item.dish.id,
        },
      })),
      subtotal: Number(subtotal.toFixed(2)),
      serviceFee: items.length > 0 ? serviceFee : 0,
      total: Number(total.toFixed(2)),
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: dto.dishId }, { slug: dto.dishId }] },
      include: { cook: true },
    });

    if (!dish || dish.status !== "LIVE") {
      throw new NotFoundException("Dish is not available");
    }

    if (dish.portionsLeft <= 0) {
      throw new BadRequestException("This dish is sold out");
    }

    const currentItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { dish: { include: { cook: true } } },
    });

    const currentCook = currentItems[0]?.dish.cook;
    if (currentCook && currentCook.id !== dish.cookId) {
      if (!dto.replace) {
        throw new ConflictException({
          statusCode: 409,
          code: "DIFFERENT_COOK",
          message:
            "Your cart currently contains dishes from another kitchen. Replace cart items?",
          currentCook: {
            id: currentCook.slug,
            name: currentCook.name,
          },
          newCook: {
            id: dish.cook.slug,
            name: dish.cook.name,
          },
          dialog: {
            ar: {
              title: "استبدال عناصر السلة؟",
              description: `تحتوي سلتك حاليًا على أطباق من مطبخ آخر. هل تريد إفراغ السلة وبدء طلب جديد من "${dish.cook.name}"؟`,
              confirmLabel: "إفراغ وبدء الطلب",
              cancelLabel: "إلغاء",
            },
            nl: {
              title: "Winkelwagen vervangen?",
              description: `Je winkelwagen bevat momenteel gerechten van een andere keuken. Wil je de winkelwagen legen en een nieuwe bestelling starten bij "${dish.cook.name}"?`,
              confirmLabel: "Legen en bestellen",
              cancelLabel: "Annuleren",
            },
            en: {
              title: "Replace cart items?",
              description: `Your cart currently contains dishes from another kitchen. Do you want to empty the cart and start a new order from "${dish.cook.name}"?`,
              confirmLabel: "Empty and start order",
              cancelLabel: "Cancel",
            },
          },
        });
      }

      // Replace cart with new cook's dish
      await this.prisma.cartItem.deleteMany({ where: { userId } });
    }

    const qty = Math.min(dto.qty ?? 1, dish.portionsLeft);
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_dishId: { userId, dishId: dish.id } },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          qty: Math.min(existing.qty + qty, dish.portionsLeft),
          pickupSlot: dto.pickupSlot ?? existing.pickupSlot,
          pickupTime: dto.pickupTime ?? existing.pickupTime,
          note: dto.note ?? existing.note,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          userId,
          dishId: dish.id,
          qty,
          pickupSlot: dto.pickupSlot,
          pickupTime: dto.pickupTime,
          note: dto.note,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQty(
    userId: string,
    dishIdOrSlug: string,
    dto: UpdateCartItemDto,
  ) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: dishIdOrSlug }, { slug: dishIdOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    if (dto.qty <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { userId, dishId: dish.id },
      });
      return this.getCart(userId);
    }

    await this.prisma.cartItem.updateMany({
      where: { userId, dishId: dish.id },
      data: { qty: Math.min(dto.qty, dish.portionsLeft) },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return this.getCart(userId);
  }
}
