import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Sse,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import type { Observable } from "rxjs";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import {
  PushSubscriptionDto,
  RemovePushSubscriptionDto,
} from "./dto/push-subscription.dto";
import { NotificationsService } from "./notifications.service";
import { WebPushService } from "./web-push.service";

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly webPush: WebPushService,
  ) {}

  /** Server-sent events: one authenticated, cook-scoped stream per dashboard. */
  @Roles(Role.COOK)
  @Sse("stream")
  stream(
    @CurrentUser("cookId") cookId?: string | null,
  ): Observable<MessageEvent> {
    if (!cookId) {
      throw new UnauthorizedException("Cook profile required");
    }
    return this.notifications.subscribe(cookId);
  }

  /** The VAPID public key is safe to expose; the private key never leaves the API. */
  @Public()
  @Get("push/key")
  pushKey(): { publicKey: string | null; enabled: boolean } {
    return {
      publicKey: this.webPush.getPublicKey(),
      enabled: this.webPush.isEnabled(),
    };
  }

  @Roles(Role.COOK)
  @Post("push/subscribe")
  async subscribe(
    @CurrentUser("sub") userId: string,
    @Body() dto: PushSubscriptionDto,
  ): Promise<{ success: true }> {
    await this.webPush.subscribe(userId, dto);
    return { success: true };
  }

  @Roles(Role.COOK)
  @HttpCode(200)
  @Delete("push/subscribe")
  async unsubscribe(
    @CurrentUser("sub") userId: string,
    @Body() dto: RemovePushSubscriptionDto,
  ): Promise<{ success: true }> {
    await this.webPush.unsubscribe(userId, dto.endpoint);
    return { success: true };
  }
}
