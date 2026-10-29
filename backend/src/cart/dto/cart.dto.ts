import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class AddCartItemDto {
  @IsString()
  dishId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  qty?: number;

  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  @IsOptional()
  @IsString()
  pickupSlot?: string;

  @IsOptional()
  @IsString()
  pickupTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  @Max(50)
  qty!: number;
}
