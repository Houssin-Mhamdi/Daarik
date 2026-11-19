import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import webpush from "web-push";
import { PrismaService } from "../prisma/prisma.service";
import type { PushSubscriptionDto } from "./dto/push-subscription.dto";

export interface NewOrderPushPayload {
  orderId: string;
  code: string;
  url: string;
}

const STALE_STATUSES = new Set([404, 410]);

const MESSAGES: Record<string, { title: string; body: (code: string) => string }> = {
  nl: { title: "Daarik", body: (code) => `Nieuwe bestelling · ${code}` },
  ar: { title: "دارك", body: (code) => `طلب جديد · ${code}` },
  en: { title: "Daarik", body: (code) => `New order · ${code}` },
};

/**
 * Owns VAPID configuration, subscription storage and delivery.
 *
 * The private key never leaves this service. Subscription endpoints are
 * capability URLs, so they are never logged and are only queryable by their
 * owning user.
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private readonly enabled: boolean;
  private readonly publicKey: string | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = this.config.get<string>("WEB_PUSH_PUBLIC_KEY");
    const privateKey = this.config.get<string>("WEB_PUSH_PRIVATE_KEY");
    const subject =
      this.config.get<string>("WEB_PUSH_SUBJECT") || "mailto:admin@darna.nl";

    this.enabled = Boolean(publicKey && privateKey);
    this.publicKey = publicKey || null;

    if (this.enabled) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    } else {
      this.logger.warn(
        "Web Push is not configured (WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY missing)",
      );
    }
  }

  getPublicKey(): string | null {
    return this.publicKey;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async subscribe(userId: string, dto: PushSubscriptionDto): Promise<void> {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
      select: { userId: true },
    });
    if (existing && existing.userId !== userId) {
      // Endpoints are capability URLs: never let another account take one over.
      throw new ForbiddenException("Subscription belongs to another account");
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dhKey: dto.keys.p256dh,
        authKey: dto.keys.auth,
        userAgent: dto.userAgent || null,
      },
      update: {
        userId,
        p256dhKey: dto.keys.p256dh,
        authKey: dto.keys.auth,
        userAgent: dto.userAgent || null,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    // Ownership is part of the filter: a cook can never remove another user's
    // subscription, even if they know the endpoint.
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /** Best-effort delivery; never allowed to fail the payment/order flow. */
  async sendToUser(userId: string, payload: NewOrderPushPayload): Promise<void> {
    if (!this.enabled) return;

    const [subscriptions, user] = await Promise.all([
      this.prisma.pushSubscription.findMany({
        where: { userId },
        select: { id: true, endpoint: true, p256dhKey: true, authKey: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferredLang: true },
      }),
    ]);
    if (subscriptions.length === 0) return;

    const message = MESSAGES[user?.preferredLang ?? "en"] ?? MESSAGES.en;
    const body = JSON.stringify({
      title: message.title,
      body: message.body(payload.code),
      orderId: payload.orderId,
      url: payload.url,
    });
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dhKey,
                auth: subscription.authKey,
              },
            },
            body,
            { TTL: 60, urgency: "high", topic: payload.orderId },
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode && STALE_STATUSES.has(statusCode)) {
            await this.prisma.pushSubscription.deleteMany({
              where: { id: subscription.id },
            });
            return;
          }
          // Deliberately log only the status code, never the endpoint/token.
          this.logger.warn(`Push delivery failed (status ${statusCode ?? "unknown"})`);
        }
      }),
    );
  }
}
