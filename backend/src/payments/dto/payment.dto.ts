import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/**
 * The client may only reference an existing order. Amounts are always
 * recomputed server-side; there is deliberately no `amount` field here.
 */
export class CreateCheckoutSessionDto {
  @ApiProperty({ example: "ORD-2481", description: "Order code to pay for" })
  @IsString()
  @MaxLength(40)
  orderCode!: string;

  @ApiPropertyOptional({
    example: "ideal",
    enum: ["ideal", "card", "bancontact"],
    description: "Preferred method. Omit to let Stripe decide.",
  })
  @IsOptional()
  @IsIn(["ideal", "card", "bancontact"])
  paymentMethod?: "ideal" | "card" | "bancontact";
}

export class UpdatePayoutScheduleDto {
  @ApiProperty({ enum: ["DAILY", "WEEKLY", "MONTHLY", "MANUAL"] })
  @IsIn(["DAILY", "WEEKLY", "MONTHLY", "MANUAL"])
  interval!: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";

  @ApiPropertyOptional({
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  })
  @IsOptional()
  @IsIn(["monday", "tuesday", "wednesday", "thursday", "friday"])
  weeklyAnchor?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

  @ApiPropertyOptional({ minimum: 1, maximum: 28 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  monthlyAnchor?: number;
}

export class RefundOrderDto {
  @ApiPropertyOptional({
    example: 12.5,
    description:
      "Amount in EUR. Omit to refund the remaining refundable balance.",
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: "Order never picked up" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
