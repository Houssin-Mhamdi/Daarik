import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export class OrderItemInputDto {
  @IsString()
  dishId!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  qty!: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];

  @IsString()
  pickup!: string;

  @IsString()
  pickupTime!: string;

  @IsString()
  @MaxLength(80)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  @MaxLength(30)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
