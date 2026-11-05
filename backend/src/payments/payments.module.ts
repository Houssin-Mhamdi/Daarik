import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { WebhookService } from "./webhook.service";

@Module({
  controllers: [PaymentsController],
  providers: [StripeService, PaymentsService, WebhookService],
  exports: [PaymentsService, StripeService, WebhookService],
})
export class PaymentsModule {}
