import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 27.8, description: "Total amount in EUR" })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: "rana", description: "Cook ID or slug" })
  @IsString()
  cookId!: string;

  @ApiProperty({
    example: "ideal",
    enum: ["ideal", "card", "bancontact"],
    description: "Selected payment method (Dutch iDEAL, Card, or Bancontact)",
  })
  @IsIn(["ideal", "card", "bancontact"])
  paymentMethod!: "ideal" | "card" | "bancontact";

  @ApiPropertyOptional({
    example: "ing",
    description: "Optional iDEAL Dutch bank code (e.g. abn_amro, ing, rabobank, sns_bank)",
  })
  @IsOptional()
  @IsString()
  idealBank?: string;

  @ApiPropertyOptional({ description: "Cart items snapshot" })
  @IsOptional()
  @IsArray()
  items?: { dishId: string; qty: number }[];
}

export class ConnectCookStripeDto {
  @ApiPropertyOptional({
    example: "acct_1QN0ATC00EGdQssf",
    description: "Existing Stripe Account ID (optional — if omitted, creates or generates onboarding)",
  })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}

export class UpdateCookPayoutPreferenceDto {
  @ApiProperty({
    enum: ["STRIPE", "BANK_TRANSFER"],
    example: "BANK_TRANSFER",
    description: "STRIPE for direct Stripe Connect payouts, or BANK_TRANSFER to store balance in Daarik app and transfer via IBAN",
  })
  @IsIn(["STRIPE", "BANK_TRANSFER"])
  payoutPreference!: "STRIPE" | "BANK_TRANSFER";

  @ApiPropertyOptional({ example: "NL91 ABNA 0417 1643 00" })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ example: "Rana El Amri" })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: "acct_1QN0ATC00EGdQssf" })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}
