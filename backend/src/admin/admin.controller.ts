import {
  BadRequestException,
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
  BulkCookStatusDto,
  BulkDishStatusDto,
  ModerateDishDto,
  ResolveDisputeDto,
  ReviewApplicationDto,
  UpdateAdminOrderStatusDto,
  UpdateCookComplianceDto,
  UpdateCookPricingDto,
  UpdateCookStatusDto,
  UpdatePayoutStatusDto,
  UpdatePlatformSettingsDto,
} from "./dto/admin.dto";
import { Roles } from "../common/decorators/roles.decorator";
import {
  AdminAuditActor,
  AuditActor,
} from "../common/decorators/audit-actor.decorator";

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

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
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateOrderStatus(id, dto, actor.actorId, actor);
  }

  @Post("orders/:id/refund")
  @ApiOperation({
    summary:
      "Refund an order through Stripe and reverse the cook's transfer share",
  })
  refundOrder(
    @Param("id") id: string,
    @Body() dto: { amount?: number; reason?: string },
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.refundOrder(id, dto, actor.actorId, actor);
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
  createCookDish(
    @Param("id") id: string,
    @Body() dto: CreateDishDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.createCookDish(id, dto, actor);
  }

  @Patch("cooks/:id/availability")
  updateCookAvailability(
    @Param("id") id: string,
    @Body() dto: UpdateAvailabilityDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateCookAvailability(id, dto, actor);
  }

  @Patch("cooks/:id/status")
  updateCookStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCookStatusDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateCookStatus(id, dto, actor);
  }

  @Patch("cooks/:id/compliance")
  @ApiOperation({
    summary:
      "Daarik compliance gate (KVK/NVWA/hygiene). Independent from Stripe KYC.",
  })
  updateCookCompliance(
    @Param("id") id: string,
    @Body() dto: UpdateCookComplianceDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateCookCompliance(id, dto, actor.actorId, actor);
  }

  @Post("cooks/:id/sync-stripe")
  @ApiOperation({ summary: "Re-read the connected account from Stripe" })
  syncCookAccount(
    @Param("id") id: string,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.syncCookAccount(id, actor);
  }

  @Post("verifications/:id/approve")
  approveApplication(
    @Param("id") id: string,
    @Body() dto: ReviewApplicationDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.approveApplication(id, dto, actor);
  }

  @Post("verifications/:id/request-changes")
  requestApplicationChanges(
    @Param("id") id: string,
    @Body() dto: ReviewApplicationDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.requestApplicationChanges(id, dto, actor);
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
  moderateDish(
    @Param("id") id: string,
    @Body() dto: ModerateDishDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.moderateDish(id, dto, actor);
  }

  @Delete("dishes/:id")
  removeDish(
    @Param("id") id: string,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.removeDish(id, actor);
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
  releaseTransfers(@AuditActor() actor: AdminAuditActor) {
    return this.adminService.releaseTransfers(actor);
  }

  @Get("payouts")
  getPayouts() {
    return this.adminService.getPayouts();
  }

  @Post("payouts/:id/sync")
  @ApiOperation({ summary: "Re-read one bank payout from Stripe" })
  syncPayout(
    @Param("id") id: string,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.syncPayout(id, actor);
  }

  @Patch("payouts/:id/status")
  updatePayoutStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePayoutStatusDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updatePayoutStatus(id, dto, actor);
  }

  @Post("payouts/run")
  @ApiOperation({
    summary: "Deprecated alias of /admin/marketplace/release",
  })
  runScheduledPayouts(@AuditActor() actor: AdminAuditActor) {
    return this.adminService.releaseTransfers(actor);
  }

  @Get("disputes")
  getDisputes(
    @Query("status") status: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getDisputes(status, page, limit);
  }

  @Get("disputes/:id")
  @ApiOperation({ summary: "Full dispute detail including evidence and timeline" })
  getDispute(@Param("id") id: string) {
    return this.adminService.getDisputeView(id);
  }

  @Post("disputes/:id/resolve")
  resolveDispute(
    @Param("id") id: string,
    @Body() dto: ResolveDisputeDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.resolveDispute(id, dto, actor);
  }

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch("settings")
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateSettings(dto, actor);
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
  bulkCookStatus(
    @Body() dto: BulkCookStatusDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.bulkCookStatus(dto.ids, dto.status, actor);
  }

  /** Per-cook commission and meet fee; accepts database ids or public slugs. */
  @Patch("cooks/pricing")
  updateCookPricing(
    @Body() dto: UpdateCookPricingDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.updateCookPricing(dto, actor);
  }

  @Post("dishes/bulk-status")
  bulkDishStatus(
    @Body() dto: BulkDishStatusDto,
    @AuditActor() actor: AdminAuditActor,
  ) {
    return this.adminService.bulkDishStatus(dto.ids, dto.status, actor);
  }

  @Post("disputes/:id/evidence")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDisputeEvidence(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @AuditActor() actor: AdminAuditActor,
  ) {
    if (!file) {
      throw new BadRequestException("No evidence file was uploaded");
    }
    if (!ALLOWED_EVIDENCE_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        "Unsupported evidence file type. Use JPG, PNG, WEBP, AVIF or PDF.",
      );
    }
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
      throw new BadRequestException(
        "Evidence file must be non-empty and at most 10 MB.",
      );
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const result = await this.r2.uploadImage(file, origin, "documents");
    const updated = await this.adminService.appendDisputeEvidence(
      id,
      result.url,
      actor,
    );
    return { url: result.url, dispute: updated };
  }
}
