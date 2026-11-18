import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Users & Favorites")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getProfile(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch("me")
  updateProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get("me/favorites")
  getFavorites(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.getFavorites(user.sub);
  }

  @Post("me/favorites/dishes/:dishId")
  toggleFavoriteDish(
    @CurrentUser() user: JwtPayloadUser,
    @Param("dishId") dishId: string,
  ) {
    return this.usersService.toggleFavoriteDish(user.sub, dishId);
  }

  @Post("me/favorites/cooks/:cookId")
  toggleFavoriteCook(
    @CurrentUser() user: JwtPayloadUser,
    @Param("cookId") cookId: string,
  ) {
    return this.usersService.toggleFavoriteCook(user.sub, cookId);
  }

  @Get("me/notifications")
  getNotifications(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.getNotifications(user.sub);
  }

  @Get("me/addresses")
  getAddresses(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.getSavedAddresses(user.sub);
  }

  @Post("me/addresses")
  createAddress(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: { label?: string; address: string; lat?: number; lng?: number; radiusKm?: number },
  ) {
    return this.usersService.createSavedAddress(user.sub, dto);
  }

  @Delete("me/addresses/:id")
  deleteAddress(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.usersService.deleteSavedAddress(user.sub, id);
  }

  @Post("me/notifications/read-all")
  markNotificationsRead(@CurrentUser() user: JwtPayloadUser) {
    return this.usersService.markNotificationsRead(user.sub);
  }
}
