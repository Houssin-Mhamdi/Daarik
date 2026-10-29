import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ApplyCookDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsString()
  @MaxLength(60)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  area?: string;

  @IsString()
  @MaxLength(40)
  cuisine!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialties?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  yearsCooking?: number;

  @IsOptional()
  @IsBoolean()
  hygieneCertificate?: boolean;

  @IsOptional()
  @IsBoolean()
  idVerified?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kitchenPhotos?: string[];
}

export class UpdateCookProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsObject()
  kitchenName?: Record<string, string>;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsObject()
  area?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsObject()
  bio?: Record<string, string>;

  @IsOptional()
  @IsObject()
  pickupArea?: Record<string, string>;

  @IsOptional()
  @IsObject()
  specialties?: Record<string, string>;

  @IsOptional()
  @IsObject()
  instructions?: Record<string, string>;

  @IsOptional()
  @IsString()
  privateAddress?: string;

  @IsOptional()
  @IsBoolean()
  kitchenOpen?: boolean;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  payoutDay?: string;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsBoolean()
  kitchenOpen?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxPortionsPerDay?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableSlots?: string[];
}
