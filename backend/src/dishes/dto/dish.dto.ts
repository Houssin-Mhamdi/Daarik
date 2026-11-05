import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { DishStatus } from "@prisma/client";

export class IngredientDto {
  @IsString()
  @MaxLength(120)
  nl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ar?: string;
}

export class CreateDishDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsObject()
  name!: Record<string, string>;

  @IsObject()
  desc!: Record<string, string>;

  @IsString()
  image!: string;

  @IsNumber()
  @Min(1)
  @Max(500)
  price!: number;

  @IsString()
  cuisineId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  serves?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  portions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  portionsLeft?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickup?: string[];

  @IsOptional()
  @IsObject()
  pickupWindows?: Record<string, string[]>;

  @IsOptional()
  @IsBoolean()
  sameDayPickup?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  sameDayRadiusKm?: number;

  @IsOptional()
  @IsBoolean()
  nextDayPickup?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  weekend?: boolean;

  @IsOptional()
  @IsBoolean()
  family?: boolean;

  @IsOptional()
  @IsObject()
  badge?: Record<string, string>;

  @IsOptional()
  @IsObject()
  prepTime?: Record<string, string>;

  @IsOptional()
  @IsEnum(DishStatus)
  status?: DishStatus;
}

export class UpdateDishDto {
  @IsOptional()
  @IsObject()
  name?: Record<string, string>;

  @IsOptional()
  @IsObject()
  desc?: Record<string, string>;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  price?: number;

  @IsOptional()
  @IsString()
  cuisineId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  serves?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  portions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  portionsLeft?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickup?: string[];

  @IsOptional()
  @IsObject()
  pickupWindows?: Record<string, string[]>;

  @IsOptional()
  @IsBoolean()
  sameDayPickup?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  sameDayRadiusKm?: number;

  @IsOptional()
  @IsBoolean()
  nextDayPickup?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  weekend?: boolean;

  @IsOptional()
  @IsBoolean()
  family?: boolean;

  @IsOptional()
  @IsObject()
  prepTime?: Record<string, string>;

  @IsOptional()
  @IsEnum(DishStatus)
  status?: DishStatus;
}

export class ReportDishDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
