import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cookProfile: true,
        favoriteDishes: {
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
                    verified: true,
                  },
                },
              },
            },
          },
        },
        favoriteCooks: {
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
                cuisineIds: true,
                rating: true,
                reviewCount: true,
                verified: true,
                pickupArea: true,
                specialties: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            favoriteDishes: true,
            favoriteCooks: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        firstName:
          dto.firstName ??
          (dto.name ? dto.name.trim().split(/\s+/)[0] : undefined),
      },
    });
    const { passwordHash, refreshTokenHash, ...safe } = updated;
    return safe;
  }

  async getFavorites(userId: string) {
    const [dishes, cooks] = await Promise.all([
      this.prisma.favoriteDish.findMany({
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
                  verified: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.favoriteCook.findMany({
        where: { userId },
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
              cuisineIds: true,
              rating: true,
              reviewCount: true,
              verified: true,
              pickupArea: true,
              specialties: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      dishes: dishes.map((f) => f.dish),
      cooks: cooks.map((f) => f.cook),
    };
  }

  async toggleFavoriteDish(userId: string, dishIdOrSlug: string) {
    const dish = await this.prisma.dish.findFirst({
      where: { OR: [{ id: dishIdOrSlug }, { slug: dishIdOrSlug }] },
    });
    if (!dish) {
      throw new NotFoundException("Dish not found");
    }

    const existing = await this.prisma.favoriteDish.findUnique({
      where: { userId_dishId: { userId, dishId: dish.id } },
    });

    if (existing) {
      await this.prisma.favoriteDish.delete({ where: { id: existing.id } });
      return { favorited: false, dishId: dish.id, slug: dish.slug };
    }

    await this.prisma.favoriteDish.create({
      data: { userId, dishId: dish.id },
    });
    return { favorited: true, dishId: dish.id, slug: dish.slug };
  }

  async toggleFavoriteCook(userId: string, cookIdOrSlug: string) {
    const cook = await this.prisma.cookProfile.findFirst({
      where: { OR: [{ id: cookIdOrSlug }, { slug: cookIdOrSlug }] },
    });
    if (!cook) {
      throw new NotFoundException("Cook not found");
    }

    const existing = await this.prisma.favoriteCook.findUnique({
      where: { userId_cookId: { userId, cookId: cook.id } },
    });

    if (existing) {
      await this.prisma.favoriteCook.delete({ where: { id: existing.id } });
      return { favorited: false, cookId: cook.id, slug: cook.slug };
    }

    await this.prisma.favoriteCook.create({
      data: { userId, cookId: cook.id },
    });
    return { favorited: true, cookId: cook.id, slug: cook.slug };
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async markNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], unread: true },
      data: { unread: false },
    });
    return { success: true };
  }
}
