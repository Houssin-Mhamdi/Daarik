import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { WebhookService } from "./webhook.service";
import { StripeService } from "./stripe.service";
import {
  CreateCheckoutSessionDto,
  UpdatePayoutScheduleDto,
} from "./dto/payment.dto";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Payments (Stripe Connect)")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly webhook: WebhookService,
    private readonly stripe: StripeService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public
  // ---------------------------------------------------------------------------

  @Public()
  @Get("config")
  @ApiOperation({ summary: "Stripe publishable key and supported methods" })
  getConfig() {
    return this.payments.getPublicConfig();
  }

  // ---------------------------------------------------------------------------
  // Webhook (raw body, signature verified, no auth)
  // ---------------------------------------------------------------------------

  @Public()
  @Post("webhook")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Stripe webhook endpoint. Verifies the signature and processes events idempotently.",
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string,
  ) {
    if (!this.stripe.webhookSecret) {
      // Refuse rather than accept unsigned events.
      throw new BadRequestException("Webhook secret is not configured");
    }
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }
    if (!req.rawBody) {
      throw new BadRequestException("Raw body unavailable");
    }

    const event = this.stripe.client.webhooks.constructEvent(
      req.rawBody,
      signature,
      this.stripe.webhookSecret,
    );

    await this.webhook.handle(event);
    return { received: true };
  }

  // ---------------------------------------------------------------------------
  // Customer
  // ---------------------------------------------------------------------------

  @ApiBearerAuth()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post("checkout-session")
  @ApiOperation({
    summary:
      "Create a Stripe-hosted Checkout Session for an existing order (amounts are server-side only)",
  })
  createCheckoutSession(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.payments.createCheckoutSession(user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // Cook
  // ---------------------------------------------------------------------------

  @ApiBearerAuth()
  @Roles(Role.COOK, Role.ADMIN)
  @Post("cook/onboarding-link")
  @ApiOperation({
    summary: "Create or resume Stripe-hosted onboarding for the cook",
  })
  createOnboardingLink(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.createOnboardingLink(user.sub);
  }

  @ApiBearerAuth()
  @Roles(Role.COOK, Role.ADMIN)
  @Get("cook/payout-settings")
  @ApiOperation({ summary: "Cook Stripe status, balance and payout schedule" })
  getPayoutSettings(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.getCookPayoutSettings(user.sub);
  }

  @ApiBearerAuth()
  @Roles(Role.COOK, Role.ADMIN)
  @Post("cook/payout-settings/sync")
  @ApiOperation({ summary: "Re-read the connected account from Stripe" })
  syncAccount(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.refreshCookAccount(user.sub);
  }

  @ApiBearerAuth()
  @Roles(Role.COOK, Role.ADMIN)
  @Post("cook/payout-schedule")
  @ApiOperation({ summary: "Update the cook's bank payout schedule" })
  updatePayoutSchedule(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdatePayoutScheduleDto,
  ) {
    return this.payments.updatePayoutSchedule(user.sub, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.COOK, Role.ADMIN)
  @Get("cook/earnings")
  @ApiOperation({ summary: "Cook earnings: pending, released and per-order" })
  getEarnings(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.getCookEarnings(user.sub);
  }
}
