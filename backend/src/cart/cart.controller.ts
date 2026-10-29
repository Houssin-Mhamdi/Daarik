import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Cart")
@ApiBearerAuth()
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayloadUser) {
    return this.cartService.getCart(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtPayloadUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Post("replace")
  replaceCart(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.sub, { ...dto, replace: true });
  }

  @Patch("items/:dishId")
  updateItemQty(
    @CurrentUser() user: JwtPayloadUser,
    @Param("dishId") dishId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQty(user.sub, dishId, dto);
  }

  @Delete()
  clearCart(@CurrentUser() user: JwtPayloadUser) {
    return this.cartService.clearCart(user.sub);
  }
}
