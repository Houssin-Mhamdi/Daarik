import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PaymentsService } from "./payments.service";
import {
  ConnectCookStripeDto,
  CreatePaymentIntentDto,
  UpdateCookPayoutPreferenceDto,
} from "./dto/payment.dto";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  JwtPayloadUser,
} from "../common/decorators/current-user.decorator";

@ApiTags("Payments & Stripe (iDEAL / Connect / Bank Transfer)")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get("config")
  @ApiOperation({
    summary: "Get Stripe publishable key, supported payment methods, and Dutch iDEAL banks",
  })
  getConfig() {
    return this.paymentsService.getPublicConfig();
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("create-intent")
  @ApiOperation({
    summary:
      "Create a live Stripe PaymentIntent (supports Dutch iDEAL, Card, Bancontact) with automatic Cook Stripe Connect or In-App Wallet routing",
  })
  @ApiResponse({ status: 201, description: "PaymentIntent created with clientSecret" })
  createPaymentIntent(
    @CurrentUser() user: JwtPayloadUser | undefined,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(user?.sub, dto);
  }

  @ApiBearerAuth()
  @Get("cook/payout-settings")
  @ApiOperation({
    summary:
      "Get cook's current payout method (Stripe Connect vs In-App Wallet Bank Transfer), wallet balance, and IBAN",
  })
  getCookPayoutSettings(@CurrentUser() user: JwtPayloadUser) {
    return this.paymentsService.getCookPayoutSettings(user.sub);
  }

  @ApiBearerAuth()
  @Post("cook/connect-stripe")
  @ApiOperation({
    summary:
      "Connect or onboard cook's Stripe account to receive order payouts directly",
  })
  connectCookStripe(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ConnectCookStripeDto,
  ) {
    return this.paymentsService.connectCookStripeAccount(user.sub, dto);
  }

  @ApiBearerAuth()
  @Patch("cook/payout-settings")
  @ApiOperation({
    summary:
      "Switch cook between Stripe Connect payouts and In-App Wallet → Bank Transfer (IBAN)",
  })
  updateCookPayoutPreference(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateCookPayoutPreferenceDto,
  ) {
    return this.paymentsService.updateCookPayoutPreference(user.sub, dto);
  }

  @ApiBearerAuth()
  @Post("cook/request-bank-transfer")
  @ApiOperation({
    summary:
      "Request SEPA bank transfer of cook's stored in-app wallet balance to their IBAN",
  })
  requestBankTransferPayout(@CurrentUser() user: JwtPayloadUser) {
    return this.paymentsService.requestBankTransferPayout(user.sub);
  }
}
