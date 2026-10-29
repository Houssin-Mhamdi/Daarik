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
import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import {
  ModerateDishDto,
  ResolveDisputeDto,
  ReviewApplicationDto,
  UpdateAdminOrderStatusDto,
  UpdateCookStatusDto,
  UpdatePayoutStatusDto,
  UpdatePlatformSettingsDto,
} from "./dto/admin.dto";
import { Roles } from "../common/decorators/roles.decorator";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("overview")
  getOverview(@Query("range") range?: string) {
    return this.adminService.getOverview(range);
  }

  @Get("orders")
  getOrders(@Query("status") status?: string, @Query("q") q?: string) {
    return this.adminService.getOrders({ status, q });
  }

  @Patch("orders/:id/status")
  updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  @Get("cooks")
  getCooks(@Query("status") status?: string, @Query("q") q?: string) {
    return this.adminService.getCooks({ status, q });
  }

  @Patch("cooks/:id/status")
  updateCookStatus(@Param("id") id: string, @Body() dto: UpdateCookStatusDto) {
    return this.adminService.updateCookStatus(id, dto);
  }

  @Post("verifications/:id/approve")
  approveApplication(
    @Param("id") id: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.adminService.approveApplication(id, dto);
  }

  @Post("verifications/:id/request-changes")
  requestApplicationChanges(
    @Param("id") id: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.adminService.requestApplicationChanges(id, dto);
  }

  @Get("dishes")
  getDishes(@Query("filter") filter?: string, @Query("q") q?: string) {
    return this.adminService.getDishes({ filter, q });
  }

  @Patch("dishes/:id/status")
  moderateDish(@Param("id") id: string, @Body() dto: ModerateDishDto) {
    return this.adminService.moderateDish(id, dto);
  }

  @Delete("dishes/:id")
  removeDish(@Param("id") id: string) {
    return this.adminService.removeDish(id);
  }

  @Get("payouts")
  getPayouts() {
    return this.adminService.getPayouts();
  }

  @Patch("payouts/:id/status")
  updatePayoutStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.adminService.updatePayoutStatus(id, dto);
  }

  @Post("payouts/run")
  runScheduledPayouts() {
    return this.adminService.runScheduledPayouts();
  }

  @Get("disputes")
  getDisputes(@Query("status") status?: string) {
    return this.adminService.getDisputes(status);
  }

  @Post("disputes/:id/resolve")
  resolveDispute(@Param("id") id: string, @Body() dto: ResolveDisputeDto) {
    return this.adminService.resolveDispute(id, dto);
  }

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch("settings")
  updateSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.adminService.updateSettings(dto);
  }
}
