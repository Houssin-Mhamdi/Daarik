import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/review.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Reviews")
@ApiBearerAuth()
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  findAll(
    @Query("cookId") cookId?: string,
    @Query("dishId") dishId?: string,
  ) {
    return this.reviewsService.findAll({ cookId, dishId });
  }

  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Patch(":id/reply")
  reply(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: { text: string },
  ) {
    return this.reviewsService.reply(id, user.sub, dto.text);
  }
}
