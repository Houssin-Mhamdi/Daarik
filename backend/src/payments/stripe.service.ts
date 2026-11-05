import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

/**
 * Thin wrapper around the official Stripe SDK.
 *
 * The secret key never leaves the server. Nothing else in the codebase should
 * construct its own Stripe client.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  readonly client: Stripe;
  readonly publishableKey: string;
  readonly webhookSecret: string | null;
  readonly frontendOrigin: string;

  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>("STRIPE_SECRET_KEY") ?? "";
    this.publishableKey =
      this.config.get<string>("STRIPE_PUBLISHABLE_KEY") ?? "";
    this.webhookSecret =
      this.config.get<string>("STRIPE_WEBHOOK_SECRET") || null;
    this.frontendOrigin =
      this.config.get<string>("FRONTEND_ORIGIN") || "http://localhost:3000";

    this.client = new Stripe(this.secretKey || "sk_test_placeholder", {
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: { name: "Daarik", version: "1.0.0" },
    });

    if (!this.secretKey) {
      this.logger.error(
        "STRIPE_SECRET_KEY is missing. Stripe calls will fail until it is set.",
      );
    }
    if (!this.webhookSecret) {
      this.logger.warn(
        "STRIPE_WEBHOOK_SECRET is missing. Webhook requests will be rejected.",
      );
    }
  }

  get isConfigured(): boolean {
    return this.secretKey.startsWith("sk_");
  }

  get isTestMode(): boolean {
    return this.secretKey.startsWith("sk_test_");
  }
}
