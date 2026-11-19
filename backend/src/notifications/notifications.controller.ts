import { Controller, Sse, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import type { Observable } from "rxjs";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

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
}
