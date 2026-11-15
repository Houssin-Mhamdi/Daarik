import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import { AuditService } from "../audit/audit.service";
import { R2StorageService } from "../uploads/r2-storage.service";
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
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
    private readonly r2: R2StorageService,
  ) {}

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

  @Get("audit")
  getAudit(
    @Query("entity") entity?: string,
    @Query("actorId") actorId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditService.list({ entity, actorId, page, limit });
  }

  @Get("analytics")
  getAnalytics(@Query("range") range?: string) {
    return this.adminService.getAnalytics(range);
  }

  @Post("cooks/bulk-status")
  bulkCookStatus(@Body() dto: { ids: string[]; status: string }) {
    return this.adminService.bulkCookStatus(dto.ids, dto.status);
  }

  @Post("dishes/bulk-status")
  bulkDishStatus(@Body() dto: { ids: string[]; status: string }) {
    return this.adminService.bulkDishStatus(dto.ids, dto.status);
  }

  @Post("disputes/:id/evidence")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDisputeEvidence(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new Error("No file");
    const origin = `${req.protocol}://${req.get("host")}`;
    const result = await this.r2.uploadImage(file, origin, "documents");
    const updated = await this.adminService.appendDisputeEvidence(id, result.url);
    return { url: result.url, dispute: updated };
  }
}
