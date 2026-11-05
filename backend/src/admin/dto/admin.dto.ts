import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import {
  ComplianceStatus,
  CookStatus,
  DishStatus,
  DisputeStatus,
  OrderStatus,
  PayoutStatus,
} from "@prisma/client";

export class UpdateAdminOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class UpdateCookStatusDto {
  @IsEnum(CookStatus)
  status!: CookStatus;
}

/**
 * Daarik's own compliance gate. Deliberately separate from Stripe KYC: a
 * Stripe-verified account says nothing about KVK, NVWA, food hygiene, allergens
 * or VAT.
 */
export class UpdateCookComplianceDto {
  @IsEnum(ComplianceStatus)
  status!: ComplianceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kvkNumber?: string;

  @IsOptional()
  @IsBoolean()
  nvwaRegistered?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  payoutHoldDays?: number;
}

export class ReviewApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ModerateDishDto {
  @IsEnum(DishStatus)
  status!: DishStatus;
}

export class UpdatePayoutStatusDto {
  @IsEnum(PayoutStatus)
  status!: PayoutStatus;
}

export class ResolveDisputeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;

  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}

export class UpdatePlatformSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  platformName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  /** Customer service fee in EUR. Mirror of `serviceFeeCents`. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(25)
  serviceFee?: number;

  /** Customer service fee in euro cents. Takes precedence when both are sent. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2500)
  serviceFeeCents?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(0.5)
  commissionRate?: number;

  /** Optional fixed commission on top of the percentage, in euro cents. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  commissionFixedCents?: number;

  /** `SUBTOTAL` = food only (default); `TOTAL` = food + service fee. */
  @IsOptional()
  @IsIn(["SUBTOTAL", "TOTAL"])
  commissionBase?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  minOrderCents?: number;

  @IsOptional()
  @IsIn(["PLATFORM", "COOK"])
  stripeFeeBearer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  payoutHoldDays?: number;

  @IsOptional()
  @IsIn(["DAILY", "WEEKLY", "MONTHLY", "MANUAL"])
  payoutInterval?: string;

  @IsOptional()
  @IsIn(["monday", "tuesday", "wednesday", "thursday", "friday"])
  payoutWeeklyAnchor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  payoutMonthlyAnchor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30_000)
  vatRateBps?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kvkNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supportEmail?: string;

  @IsOptional()
  @IsBoolean()
  requireVerification?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApproveCooks?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}
