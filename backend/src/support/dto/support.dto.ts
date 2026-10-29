import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateSupportTicketDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  orderCode?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message!: string;
}
