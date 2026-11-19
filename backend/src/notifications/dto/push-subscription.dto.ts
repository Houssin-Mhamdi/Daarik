import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";

export class PushSubscriptionKeysDto {
  @IsString()
  @Length(40, 200)
  p256dh!: string;

  @IsString()
  @Length(10, 100)
  auth!: string;
}

export class PushSubscriptionDto {
  /** Browser push endpoints are always HTTPS and contain a capability token. */
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @Matches(/^https:/)
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  userAgent?: string;
}

export class RemovePushSubscriptionDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @Matches(/^https:/)
  endpoint!: string;
}
