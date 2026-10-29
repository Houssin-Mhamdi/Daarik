import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewDto } from "./dto/review.dto";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { cookId?: string; dishId?: string }) {
    return this.prisma.review.findMany({
      where: {
        ...(query.cookId
          ? {
              cook: {
                OR: [{ id: query.cookId }, { slug: query.cookId }],
              },
            }
          : {}),
        ...(query.dishId
          ? {
              dish: {
                OR: [{ id: query.dishId }, { slug: query.dishId }],
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const cook = await this.prisma.cookProfile.findFirst({
      where: { OR: [{ id: dto.cookId }, { slug: dto.cookId }] },
    });

    if (!cook) {
      throw new NotFoundException("Cook not found");
    }

    const dish = dto.dishId
      ? await this.prisma.dish.findFirst({
          where: { OR: [{ id: dto.dishId }, { slug: dto.dishId }] },
        })
      : null;

    const author = user?.name || "Customer";
    const initials = author
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: dto.orderId,
          customerId: userId,
          cookId: cook.id,
          dishId: dish?.id,
          author,
          initials,
          rating: dto.rating,
          date: { nl: "Zojuist", en: "Just now", ar: "الآن" },
          text: { nl: dto.text, en: dto.text, ar: dto.text },
        },
      });

      if (dto.orderId) {
        await tx.order.updateMany({
          where: { OR: [{ id: dto.orderId }, { code: dto.orderId }] },
          data: { reviewed: true },
        });
      }

      const cookStats = await tx.review.aggregate({
        where: { cookId: cook.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.cookProfile.update({
        where: { id: cook.id },
        data: {
          rating: Number((cookStats._avg.rating ?? 5).toFixed(1)),
          reviewCount: cookStats._count.rating,
        },
      });

      if (dish) {
        const dishStats = await tx.review.aggregate({
          where: { dishId: dish.id },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.dish.update({
          where: { id: dish.id },
          data: {
            rating: Number((dishStats._avg.rating ?? 5).toFixed(1)),
            reviewCount: dishStats._count.rating,
          },
        });
      }

      return created;
    });

    return review;
  }
}
