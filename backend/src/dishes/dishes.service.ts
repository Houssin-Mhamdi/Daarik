import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DishStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildDishSearchText } from "../common/dish-search";
import { CreateDishDto, ReportDishDto, UpdateDishDto } from "./dto/dish.dto";
import { applyDishFilters } from "./filters/dish-filters";

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(query: {
    cuisine?: string;
    dietary?: string;
    pickup?: string;
    cookId?: string;
    city?: string;
    q?: string;
    featured?: string;
    weekend?: string;
    family?: string;
    availableOnly?: string;
    sameDay?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);

    const rawLimit = query.limit ? Number(query.limit) : 0;
    const limit = rawLimit > 0 ? Math.min(100, rawLimit) : 0;
    const usePaging = limit > 0;

    const where: Record<string, any> = { status: DishStatus.LIVE };
    applyDishFilters(query as any, where);

    const orderBy =
      query.sort === "priceLow"
        ? [{ price: "asc" as const }]
        : query.sort === "priceHigh"
          ? [{ price: "desc" as const }]
          : query.sort === "rating"
            ? [{ rating: "desc" as const }]
            : [{ featured: "desc" as const }, { rating: "desc" as const }];

    const [total, dishes] = await this.prisma.$transaction([
      this.prisma.dish.count({ where: where as any }),
      this.prisma.dish.findMany({
        where: where as any,
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
        orderBy,
        ...(usePaging ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
    ]);

    return {
      items: dishes.map((d) => this.mapPublicDish(d)),
      total,
      page: usePaging ? page : 1,
      limit: usePaging ? limit : total,
    };
  }

  async autocomplete(q: string, limit = 8) {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return { items: [] };
    const dishes = await this.prisma.dish.findMany({
      where: {
        status: DishStatus.LIVE,
        searchText: { contains: term },
      },
      select: { id: true, slug: true, name: true, price: true, image: true, cook: { select: { name: true, slug: true } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
      take: Math.min(20, Math.max(1, limit)),
    });
    return {
      items: dishes.map((d) => ({
        id: d.slug || d.id,
        name: d.name,
        price: d.price,
        image: d.image,
        cook: d.cook?.name,
        cookSlug: d.cook?.slug,
      })),
    };
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
    // Content moderation: auto-flag offensive text.
    const OFFENSIVE = ["fuck", "shit", "damn", "bitch", "asshole"];
    const haystack = `${dto.name?.nl ?? ""} ${dto.name?.en ?? ""} ${dto.name?.ar ?? ""} ${dto.desc?.nl ?? ""} ${dto.desc?.en ?? ""} ${dto.desc?.ar ?? ""}`.toLowerCase();
    const flagged = OFFENSIVE.some((w) => haystack.includes(w));
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
        category: dto.category ?? "Mains",
        serves: dto.serves ?? 1,
        portions: dto.portions ?? 8,
        portionsLeft: dto.portionsLeft ?? dto.portions ?? 8,
        allergens: dto.allergens ?? [],
        dietary: dto.dietary ?? [],
        ingredients: (dto.ingredients ?? []).map((i) => ({ ...i })),
        pickup: dto.pickup ?? ["fri", "sat"],
        pickupWindows: dto.pickupWindows ?? {},
        sameDayPickup: dto.sameDayPickup ?? false,
        sameDayRadiusKm: dto.sameDayRadiusKm ?? 5,
        nextDayPickup: dto.nextDayPickup ?? true,
        featured: dto.featured ?? false,
        weekend: dto.weekend ?? false,
        family: dto.family ?? false,
        badge: dto.badge,
        prepTime: dto.prepTime ?? { nl: "1 uur", en: "1 hour", ar: "ساعة" },
        status: flagged ? DishStatus.DRAFT : (dto.status ?? DishStatus.LIVE),
        reported: flagged,
        reportReason: flagged ? "auto-flagged: offensive content" : undefined,
        searchText: buildDishSearchText(dto),
      },
    });

    return this.mapPublicDish(dish);
  }

  async updateDish(userId: string, idOrSlug: string, dto: UpdateDishDto) {
    const cook = await this.resolveCook(userId);
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }
    if (dish.cookId !== cook.id) {
      throw new ForbiddenException("This dish belongs to another kitchen");
    }

    const searchable =
      dto.name !== undefined || dto.desc !== undefined || dto.cuisineId !== undefined;
    const updated = await this.prisma.dish.update({
      where: { id: dish.id },
      data: {
        ...(dto as any),
        ...(dto.ingredients !== undefined
          ? { ingredients: dto.ingredients.map((i) => ({ ...i })) }
          : {}),
        ...(searchable
          ? {
              searchText: buildDishSearchText({
                name: dto.name ?? dish.name,
                desc: dto.desc ?? dish.desc,
                cuisineId: dto.cuisineId ?? dish.cuisineId,
              }),
            }
          : {}),
      },
    });
    return this.mapPublicDish(updated);
  }

  async deleteDish(userId: string, idOrSlug: string) {
    const cook = await this.resolveCook(userId);
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }
    if (dish.cookId !== cook.id) {
      throw new ForbiddenException("This dish belongs to another kitchen");
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

  /**
   * Strict cook lookup. No demo fallback: that would let any logged-in user
   * edit another kitchen's dishes.
   */
  private async resolveCook(userId: string) {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (!cook) {
      throw new ForbiddenException("No cook profile is linked to this account");
    }
    return cook;
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
