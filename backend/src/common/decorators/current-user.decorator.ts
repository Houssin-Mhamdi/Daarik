import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface JwtPayloadUser {
  sub: string;
  email: string;
  role: "CUSTOMER" | "COOK" | "ADMIN";
  cookId?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayloadUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayloadUser | undefined;
    return data ? user?.[data] : user;
  },
);
