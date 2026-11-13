import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddCartItemDto, ReplaceCartDto, UpdateCartDetailsDto, UpdateCartItemDto } from "./dto/cart.dto";
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

  @Post("merge")
  mergeCart(@CurrentUser() user: JwtPayloadUser, @Body() dto: ReplaceCartDto) {
    return this.cartService.mergeCart(user.sub, dto);
  }

  @Put()
  replaceAll(@CurrentUser() user: JwtPayloadUser, @Body() dto: ReplaceCartDto) {
    return this.cartService.replaceAll(user.sub, dto);
  }

  @Patch("items/:dishId")
  updateItemQty(
    @CurrentUser() user: JwtPayloadUser,
    @Param("dishId") dishId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQty(user.sub, dishId, dto);
  }

  @Patch("details")
  updateDetails(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateCartDetailsDto,
  ) {
    return this.cartService.updateDetails(user.sub, dto);
  }

  @Delete()
  clearCart(@CurrentUser() user: JwtPayloadUser) {
    return this.cartService.clearCart(user.sub);
  }
}
