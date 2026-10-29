import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post()
  createOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get()
  getMyOrders(@CurrentUser() user: JwtPayloadUser) {
    return this.ordersService.getMyOrders(user.sub);
  }

  @Get("cook/me")
  getCookOrders(
    @CurrentUser() user: JwtPayloadUser,
    @Query("status") status?: string,
  ) {
    return this.ordersService.getCookOrders(user.sub, status);
  }

  @Patch("cook/:id/status")
  updateCookOrderStatus(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateCookOrderStatus(user.sub, id, dto);
  }

  @Get(":id")
  getOrderById(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.ordersService.getOrderById(user.sub, id);
  }

  @Post(":id/cancel")
  cancelOrder(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.ordersService.cancelOrder(user.sub, id);
  }
}
