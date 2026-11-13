import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  readCookie,
  setAuthCookies,
} from "./auth-cookies";
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from "./dto/auth.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.register(dto);
    setAuthCookies(res, this.config, tokens);
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.login(dto);
    setAuthCookies(res, this.config, tokens);
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(
      readCookie(req, REFRESH_COOKIE) ?? dto.refreshToken,
    );
    setAuthCookies(res, this.config, tokens);
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(
    @CurrentUser() user: JwtPayloadUser | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    clearAuthCookies(res, this.config);
    return user
      ? this.authService.logout(user.sub, user.sessionId)
      : this.authService.logoutWithRefreshToken(refreshToken);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post("change-password")
  changePassword(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }

  @Get("me")
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.getMe(user.sub);
  }
}
