import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DishStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDishDto, ReportDishDto, UpdateDishDto } from "./dto/dish.dto";

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(query: {
    cuisine?: string;
    dietary?: string;
    pickup?: string;
    cookId?: string;
    q?: string;
    featured?: string;
    weekend?: string;
    family?: string;
    availableOnly?: string;
  }) {
    const dishes = await this.prisma.dish.findMany({
      where: {
        status: DishStatus.LIVE,
        ...(query.cuisine ? { cuisineId: query.cuisine } : {}),
        ...(query.dietary ? { dietary: { has: query.dietary } } : {}),
        ...(query.pickup ? { pickup: { has: query.pickup } } : {}),
        ...(query.featured === "true" ? { featured: true } : {}),
        ...(query.weekend === "true" ? { weekend: true } : {}),
        ...(query.family === "true" ? { family: true } : {}),
        ...(query.availableOnly === "true" ? { portionsLeft: { gt: 0 } } : {}),
        ...(query.cookId
          ? {
              cook: {
                OR: [{ id: query.cookId }, { slug: query.cookId }],
              },
            }
          : {}),
      },
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
            rating: true,
            reviewCount: true,
            verified: true,
          },
        },
      },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    });

    const q = query.q?.trim().toLowerCase();
    const filtered = q
      ? dishes.filter((d) => {
          const nameObj = (d.name ?? {}) as Record<string, string>;
          const descObj = (d.desc ?? {}) as Record<string, string>;
          const haystack = [
            nameObj.nl,
            nameObj.en,
            nameObj.ar,
            descObj.nl,
            descObj.en,
            descObj.ar,
            d.cook?.name,
            d.cuisineId,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : dishes;

    return filtered.map((d) => this.mapPublicDish(d));
  }

  async findOnePublic(idOrSlug: string) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        cook: {
          select: {
            id: true,
            slug: true,
            name: true,
            avatar: true,
            cover: true,
            city: true,
            area: true,
            pickupArea: true,
            rating: true,
            reviewCount: true,
            verified: true,
            response: true,
            specialties: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    const moreFromCook = await this.prisma.dish.findMany({
      where: {
        cookId: dish.cookId,
        id: { not: dish.id },
        status: DishStatus.LIVE,
      },
      take: 6,
    });

    return {
      ...this.mapPublicDish(dish),
      reviews: dish.reviews,
      moreFromCook: moreFromCook.map((m) => this.mapPublicDish(m)),
    };
  }

  async getMyDishes(userId: string) {
    const cook = await this.resolveCook(userId);
    const dishes = await this.prisma.dish.findMany({
      where: { cookId: cook.id },
      orderBy: { updatedAt: "desc" },
    });
    return dishes.map((d) => this.mapPublicDish(d));
  }

  async createDish(userId: string, dto: CreateDishDto) {
    const cook = await this.resolveCook(userId);
    const baseSlug =
      dto.slug ||
      (dto.name.en || dto.name.nl || "dish")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36).slice(-4);

    const dish = await this.prisma.dish.create({
      data: {
        slug: baseSlug,
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
        ingredients: dto.ingredients ?? [],
        pickup: dto.pickup ?? ["fri-30", "sat-31"],
        featured: dto.featured ?? false,
        weekend: dto.weekend ?? false,
        family: dto.family ?? false,
        badge: dto.badge,
        prepTime: dto.prepTime ?? { nl: "1 uur", en: "1 hour", ar: "ساعة" },
        status: dto.status ?? DishStatus.LIVE,
      },
    });

    return this.mapPublicDish(dish);
  }

  async updateDish(userId: string, idOrSlug: string, dto: UpdateDishDto) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    const updated = await this.prisma.dish.update({
      where: { id: dish.id },
      data: dto as any,
    });
    return this.mapPublicDish(updated);
  }

  async deleteDish(userId: string, idOrSlug: string) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }
    await this.prisma.dish.delete({ where: { id: dish.id } });
    return { deleted: true, id: dish.slug };
  }

  async reportDish(idOrSlug: string, dto: ReportDishDto) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    await this.prisma.dish.update({
      where: { id: dish.id },
      data: {
        reported: true,
        reportReason: dto.reason,
      },
    });

    return { reported: true };
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
      throw new ForbiddenException("Cook profile required");
    }
    return demo;
  }

  private mapPublicDish(dish: any) {
    return {
      ...dish,
      id: dish.slug || dish.id,
      dbId: dish.id,
      cookId: dish.cook?.slug ?? dish.cookId,
    };
  }
}
