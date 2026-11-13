import type { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";

export const ACCESS_COOKIE = "darna_at";
export const REFRESH_COOKIE = "darna_rt";

const UNITS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function ttlToMs(ttl: string | undefined, fallbackMs: number): number {
  const match = /^(\d+)\s*([smhd])?$/.exec((ttl ?? "").trim());
  if (!match) return fallbackMs;
  return Number(match[1]) * (match[2] ? UNITS[match[2]] : 1000);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers?.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function accessTokenFromRequest(req: Request): string | null {
  const header = req.headers?.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return readCookie(req, ACCESS_COOKIE);
}

function baseOptions(config: ConfigService): CookieOptions {
  const production = config.get<string>("NODE_ENV") === "production";
  // The deployed frontend lives on another site, so cross-site cookies need
  // SameSite=None (which browsers only accept together with Secure).
  const sameSite =
    (config.get<string>("COOKIE_SAMESITE") as CookieOptions["sameSite"]) ||
    (production ? "none" : "lax");
  return {
    httpOnly: true,
    secure: production || sameSite === "none",
    sameSite,
    domain: config.get<string>("COOKIE_DOMAIN") || undefined,
  };
}

export function setAuthCookies(
  res: Response,
  config: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
) {
  const base = baseOptions(config);
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    path: "/",
    maxAge: ttlToMs(config.get<string>("JWT_ACCESS_TTL"), 15 * 60_000),
  });
  // The refresh token is only ever sent to the auth endpoints.
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    path: "/api/auth",
    maxAge: ttlToMs(config.get<string>("JWT_REFRESH_TTL"), 7 * 86_400_000),
  });
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  const base = baseOptions(config);
  res.clearCookie(ACCESS_COOKIE, { ...base, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: "/api/auth" });
}
