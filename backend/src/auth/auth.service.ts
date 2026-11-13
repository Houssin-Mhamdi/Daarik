import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    // Prevent self-assigning ADMIN via public registration
    const role = dto.role === Role.COOK ? Role.COOK : Role.CUSTOMER;
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const firstName = dto.name.trim().split(/\s+/)[0] || dto.name.trim();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        firstName,
        phone: dto.phone,
        city: dto.city ?? "Rotterdam",
        preferredLang: dto.preferredLang ?? "nl",
        role,
      },
      include: { cookProfile: true },
    });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.cookProfile?.id ?? null,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { cookProfile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.cookProfile?.id ?? null,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException("Invalid or expired refresh token");
    const secret =
      this.config.get<string>("JWT_REFRESH_SECRET") ||
      "darna-super-secret-refresh-key-change-in-production-2026";
    let payload: { sub: string; sessionId?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    if (!payload.sessionId) throw new UnauthorizedException("Please sign in again");

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { cookProfile: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException("Access denied");

    return this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.cookProfile?.id ?? null,
      { id: payload.sessionId, tokenHash: this.hashRefreshToken(refreshToken) },
    );
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.prisma.authSession.deleteMany({ where: { id: sessionId, userId } });
    } else {
      await this.prisma.user.updateMany({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });
    }
    return { success: true };
  }

  async logoutWithRefreshToken(refreshToken: string | null) {
    if (!refreshToken) return { success: true };
    let payload: { sub: string; sessionId?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET") ||
          "darna-super-secret-refresh-key-change-in-production-2026",
      });
    } catch {
      return { success: true };
    }
    if (payload.sessionId) {
      await this.prisma.authSession.deleteMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          tokenHash: this.hashRefreshToken(refreshToken),
        },
      });
    }
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.authSession.deleteMany({ where: { userId } }),
    ]);

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cookProfile: true,
        _count: {
          select: {
            orders: true,
            favoriteDishes: true,
            favoriteCooks: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.sanitizeUser(user);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
    cookId: string | null,
    previous?: { id: string; tokenHash: string },
  ) {
    const sessionId = previous?.id ?? randomUUID();
    const payload = { sub: userId, email, role, cookId, sessionId };
    const accessSecret =
      this.config.get<string>("JWT_ACCESS_SECRET") ||
      "darna-super-secret-access-key-change-in-production-2026";
    const refreshSecret =
      this.config.get<string>("JWT_REFRESH_SECRET") ||
      "darna-super-secret-refresh-key-change-in-production-2026";

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: accessSecret,
        expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") || "15m") as any,
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: (this.config.get<string>("JWT_REFRESH_TTL") || "7d") as any,
        jwtid: randomUUID(),
      }),
    ]);

    const decoded = this.jwt.decode(refreshToken);
    if (!decoded || typeof decoded === "string" || !decoded.exp) {
      throw new Error("Refresh token has no expiration");
    }
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    if (previous) {
      const updated = await this.prisma.authSession.updateMany({
        where: {
          id: sessionId,
          userId,
          tokenHash: previous.tokenHash,
          expiresAt: { gt: new Date() },
        },
        data: { tokenHash, expiresAt },
      });
      if (updated.count !== 1) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }
    } else {
      await this.prisma.authSession.create({
        data: { id: sessionId, userId, tokenHash, expiresAt },
      });
    }

    return { accessToken, refreshToken };
  }

  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
