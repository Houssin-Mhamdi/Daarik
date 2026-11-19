import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { WebhookService } from "./webhook.service";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [StripeService, PaymentsService, WebhookService],
  exports: [PaymentsService, StripeService, WebhookService],
})
export class PaymentsModule {}
