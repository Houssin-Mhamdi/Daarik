import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

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

export class UpdateCartDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  pickupSlot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  pickupTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class ReplaceCartLineDto {
  @IsString()
  dishId!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  qty!: number;
}

export class ReplaceCartDto extends UpdateCartDetailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReplaceCartLineDto)
  items!: ReplaceCartLineDto[];
}
