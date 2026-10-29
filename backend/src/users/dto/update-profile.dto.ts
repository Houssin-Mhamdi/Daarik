import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsIn(["nl", "en", "ar"])
  preferredLang?: "nl" | "en" | "ar";
}
