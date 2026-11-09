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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import { CreateDishDto } from "../dishes/dto/dish.dto";
import { UpdateAvailabilityDto } from "../cooks/dto/cook.dto";
import {
  ModerateDishDto,
  ResolveDisputeDto,
  ReviewApplicationDto,
  UpdateAdminOrderStatusDto,
  UpdateCookComplianceDto,
  UpdateCookStatusDto,
  UpdatePayoutStatusDto,
  UpdatePlatformSettingsDto,
} from "./dto/admin.dto";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

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
  getOrders(
    @Query("status") status?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getOrders({ status, q, page, limit });
  }

  @Patch("orders/:id/status")
  updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.adminService.updateOrderStatus(id, dto, user.sub);
  }

  @Post("orders/:id/refund")
  @ApiOperation({
    summary:
      "Refund an order through Stripe and reverse the cook's transfer share",
  })
  refundOrder(
    @Param("id") id: string,
    @Body() dto: { amount?: number; reason?: string },
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.adminService.refundOrder(id, dto, user.sub);
  }

  @Get("cooks")
  getCooks(
    @Query("status") status?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getCooks({ status, q, page, limit });
  }

  @Get("cooks/:id")
  getCookWorkspace(@Param("id") id: string) {
    return this.adminService.getCookWorkspace(id);
  }

  @Post("cooks/:id/dishes")
  createCookDish(@Param("id") id: string, @Body() dto: CreateDishDto) {
    return this.adminService.createCookDish(id, dto);
  }

  @Patch("cooks/:id/availability")
  updateCookAvailability(
    @Param("id") id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.adminService.updateCookAvailability(id, dto);
  }

  @Patch("cooks/:id/status")
  updateCookStatus(@Param("id") id: string, @Body() dto: UpdateCookStatusDto) {
    return this.adminService.updateCookStatus(id, dto);
  }

  @Patch("cooks/:id/compliance")
  @ApiOperation({
    summary:
      "Daarik compliance gate (KVK/NVWA/hygiene). Independent from Stripe KYC.",
  })
  updateCookCompliance(
    @Param("id") id: string,
    @Body() dto: UpdateCookComplianceDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.adminService.updateCookCompliance(id, dto, user.sub);
  }

  @Post("cooks/:id/sync-stripe")
  @ApiOperation({ summary: "Re-read the connected account from Stripe" })
  syncCookAccount(@Param("id") id: string) {
    return this.adminService.syncCookAccount(id);
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
  getDishes(
    @Query("filter") filter?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getDishes({ filter, q, page, limit });
  }

  @Patch("dishes/:id/status")
  moderateDish(@Param("id") id: string, @Body() dto: ModerateDishDto) {
    return this.adminService.moderateDish(id, dto);
  }

  @Delete("dishes/:id")
  removeDish(@Param("id") id: string) {
    return this.adminService.removeDish(id);
  }

  // ---------------------------------------------------------------------------
  // Stripe marketplace payments
  // ---------------------------------------------------------------------------

  @Get("marketplace")
  @ApiOperation({
    summary: "Stripe balance, transfers, payouts, webhook log and pricing",
  })
  getMarketplace() {
    return this.adminService.getMarketplace();
  }

  @Post("marketplace/release")
  @ApiOperation({ summary: "Release all eligible order earnings now" })
  releaseTransfers() {
    return this.adminService.releaseTransfers();
  }

  @Get("payouts")
  getPayouts() {
    return this.adminService.getPayouts();
  }

  @Post("payouts/:id/sync")
  @ApiOperation({ summary: "Re-read one bank payout from Stripe" })
  syncPayout(@Param("id") id: string) {
    return this.adminService.syncPayout(id);
  }

  @Patch("payouts/:id/status")
  updatePayoutStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.adminService.updatePayoutStatus(id, dto);
  }

  @Post("payouts/run")
  @ApiOperation({
    summary: "Deprecated alias of /admin/marketplace/release",
  })
  runScheduledPayouts() {
    return this.adminService.releaseTransfers();
  }

  @Get("disputes")
  getDisputes(
    @Query("status") status: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getDisputes(status, page, limit);
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
