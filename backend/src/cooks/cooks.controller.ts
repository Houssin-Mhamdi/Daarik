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
import { CooksService } from "./cooks.service";
import {
  ApplyCookDto,
  UpdateAvailabilityDto,
  UpdateCookProfileDto,
} from "./dto/cook.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Cooks")
@ApiBearerAuth()
@Controller("cooks")
export class CooksController {
  constructor(private readonly cooksService: CooksService) {}

  @Public()
  @Get()
  findAll(
    @Query("city") city?: string,
    @Query("cuisine") cuisine?: string,
    @Query("q") q?: string,
  ) {
    return this.cooksService.findAllPublic({ city, cuisine, q });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("apply")
  apply(
    @CurrentUser() user: JwtPayloadUser | undefined,
    @Body() dto: ApplyCookDto,
  ) {
    return this.cooksService.submitApplication(user?.sub, dto);
  }

  @Get("me/dashboard")
  getMyDashboard(@CurrentUser() user: JwtPayloadUser) {
    return this.cooksService.getMyDashboard(user.sub);
  }

  @Get("me/profile")
  getMyProfile(@CurrentUser() user: JwtPayloadUser) {
    return this.cooksService.getMyProfile(user.sub);
  }

  @Patch("me/profile")
  updateMyProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateCookProfileDto,
  ) {
    return this.cooksService.updateMyProfile(user.sub, dto);
  }

  @Get("me/availability")
  getMyAvailability(@CurrentUser() user: JwtPayloadUser) {
    return this.cooksService.getMyAvailability(user.sub);
  }

  @Patch("me/availability")
  updateMyAvailability(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.cooksService.updateMyAvailability(user.sub, dto);
  }

  @Get("me/earnings")
  getMyEarnings(@CurrentUser() user: JwtPayloadUser) {
    return this.cooksService.getMyEarnings(user.sub);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.cooksService.findOnePublic(id);
  }
}
