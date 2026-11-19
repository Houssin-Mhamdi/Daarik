import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayloadUser } from "./current-user.decorator";

/**
 * Safe, loggable identity of the admin performing a mutation.
 * Never contains tokens, cookies or request bodies.
 */
export interface AdminAuditActor {
  actorId?: string;
  actorRole?: string;
  ip?: string;
  userAgent?: string;
}

/** Extracts the authenticated actor plus non-sensitive request context. */
export const AuditActor = createParamDecorator(
  (_data: undefined, ctx: ExecutionContext): AdminAuditActor => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayloadUser | undefined;
    return {
      actorId: user?.sub,
      actorRole: user?.role,
      ip: request.ip ?? request.socket?.remoteAddress,
      userAgent: request.headers?.["user-agent"],
    };
  },
);
