import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
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

  async refresh(dto: RefreshTokenDto) {
    try {
      const secret =
        this.config.get<string>("JWT_REFRESH_SECRET") ||
        "darna-super-secret-refresh-key-change-in-production-2026";
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: Role;
      }>(dto.refreshToken, { secret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { cookProfile: true },
      });

      if (!user || !user.isActive || !user.refreshTokenHash) {
        throw new ForbiddenException("Access denied");
      }

      const matches = await bcrypt.compare(
        dto.refreshToken,
        user.refreshTokenHash,
      );
      if (!matches) {
        throw new ForbiddenException("Invalid refresh token");
      }

      return this.issueTokens(
        user.id,
        user.email,
        user.role,
        user.cookProfile?.id ?? null,
      );
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });

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
  ) {
    const payload = { sub: userId, email, role, cookId };
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
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
