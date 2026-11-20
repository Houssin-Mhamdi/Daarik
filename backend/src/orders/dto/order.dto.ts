import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
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

/** The customer may only reference an existing point, never inject a new one. */
export class PickupPointDto {
  @IsString()
  @MaxLength(80)
  id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
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
  @IsIn(["home", "meet", "courier"])
  pickupMethod?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PickupPointDto)
  pickupPoint?: PickupPointDto;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
