import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayloadUser } from "../../common/decorators/current-user.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>("JWT_ACCESS_SECRET") ||
        "darna-super-secret-access-key-change-in-production-2026",
    });
  }

  async validate(payload: JwtPayloadUser): Promise<JwtPayloadUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        cookProfile: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account is inactive or not found");
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      cookId: user.cookProfile?.id ?? null,
    };
  }
}
