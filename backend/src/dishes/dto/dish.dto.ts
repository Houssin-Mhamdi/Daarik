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
} from "class-validator";
import { DishStatus } from "@prisma/client";

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
  ingredients?: Record<string, string>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickup?: string[];

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
  ingredients?: Record<string, string>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickup?: string[];

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
