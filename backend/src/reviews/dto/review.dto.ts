import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateReviewDto {
  @IsString()
  cookId!: string;

  @IsOptional()
  @IsString()
  dishId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MaxLength(1000)
  text!: string;
}
