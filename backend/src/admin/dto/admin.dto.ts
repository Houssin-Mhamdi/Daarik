import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import {
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
  platformName?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(25)
  serviceFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.5)
  commissionRate?: number;

  @IsOptional()
  @IsBoolean()
  requireVerification?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApproveCooks?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  supportEmail?: string;
}
