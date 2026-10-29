import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { DishesService } from "./dishes.service";
import { CreateDishDto, ReportDishDto, UpdateDishDto } from "./dto/dish.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Dishes")
@ApiBearerAuth()
@Controller("dishes")
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Public()
  @Get()
  findAll(
    @Query("cuisine") cuisine?: string,
    @Query("dietary") dietary?: string,
    @Query("pickup") pickup?: string,
    @Query("cookId") cookId?: string,
    @Query("q") q?: string,
    @Query("featured") featured?: string,
    @Query("weekend") weekend?: string,
    @Query("family") family?: string,
    @Query("availableOnly") availableOnly?: string,
  ) {
    return this.dishesService.findAllPublic({
      cuisine,
      dietary,
      pickup,
      cookId,
      q,
      featured,
      weekend,
      family,
      availableOnly,
    });
  }

  @Get("cook/me")
  getMyDishes(@CurrentUser() user: JwtPayloadUser) {
    return this.dishesService.getMyDishes(user.sub);
  }

  @Post()
  createDish(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateDishDto,
  ) {
    return this.dishesService.createDish(user.sub, dto);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.dishesService.findOnePublic(id);
  }

  @Patch(":id")
  updateDish(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: UpdateDishDto,
  ) {
    return this.dishesService.updateDish(user.sub, id, dto);
  }

  @Delete(":id")
  deleteDish(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.dishesService.deleteDish(user.sub, id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(":id/report")
  reportDish(@Param("id") id: string, @Body() dto: ReportDishDto) {
    return this.dishesService.reportDish(id, dto);
  }
}
