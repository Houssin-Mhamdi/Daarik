import { Body, Controller, Get, Post, Query } from "@nestjs/common";
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
}
