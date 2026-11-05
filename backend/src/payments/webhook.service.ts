import { Injectable, Logger } from "@nestjs/common";
import {
  DisputeStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  TransferStatus,
} from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { PaymentsService } from "./payments.service";
import { CURRENCY } from "./money";

/**
 * All Stripe webhook side effects live here.
 *
 * Invariants:
 *  - An event is processed at most once (dedupe on `stripeEventId`).
 *  - Money state is only ever changed from Stripe-confirmed events, never from
 *    a client request.
 *  - A failure is recorded and re-thrown so Stripe retries.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly payments: PaymentsService,
  ) {}

  async handle(event: Stripe.Event): Promise<void> {
    // Claim the event. A duplicate delivery hits the unique index and is a no-op.
    try {
      await this.prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          payload: event as unknown as object,
          attempts: 1,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        this.logger.debug(`Duplicate webhook ${event.id} (${event.type})`);
        return;
      }
      throw err;
    }

    try {
      await this.dispatch(event);
      await this.prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { processedAt: new Date() },
      });
    } catch (err: any) {
      await this.prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { error: String(err?.message ?? err) },
      });
      this.logger.error(`Webhook ${event.type} failed: ${err?.message}`);
      throw err;
    }
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "account.updated":
        await this.onAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "checkout.session.completed":
        await this.onCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "payment_intent.succeeded":
        await this.onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await this.onPaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await this.onChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "charge.dispute.created":
        await this.onDisputeCreated(
          event.data.object as Stripe.Dispute,
          event.account,
        );
        break;

      case "charge.dispute.closed":
        await this.onDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      case "transfer.created":
      case "transfer.updated":
        await this.onTransferChanged(event.data.object as Stripe.Transfer);
        break;

      case "transfer.reversed":
        await this.onTransferReversed(event.data.object as Stripe.Transfer);
        break;

      case "payout.paid":
      case "payout.failed":
        await this.onPayout(event.data.object as Stripe.Payout, event.account);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event ${event.type}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Connected account
  // ---------------------------------------------------------------------------

  private async onAccountUpdated(account: Stripe.Account) {
    await this.payments.syncAccount(account.id);
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    // `payment_intent.succeeded` is the source of truth for money. This handler
    // only links the session to the order and marks it as processing.
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId) return;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await this.prisma.order.updateMany({
      where: { id: orderId },
      data: {
        stripeCheckoutSessionId: session.id,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      },
    });
  }

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { stripePaymentIntentId: intent.id },
          ...(intent.metadata?.orderId
            ? [{ id: intent.metadata.orderId }]
            : []),
        ],
      },
    });
    if (!order) {
      this.logger.warn(`No order for payment intent ${intent.id}`);
      return;
    }

    // Idempotent: Stripe retries and can deliver succeeded more than once.
    if (
      order.paymentStatus === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      return;
    }

    const chargeId =
      typeof intent.latest_charge === "string"
        ? intent.latest_charge
        : intent.latest_charge?.id ?? null;

    let feeCents = 0;
    if (chargeId) {
      try {
        const charge = await this.stripe.client.charges.retrieve(chargeId, {
          expand: ["balance_transaction"],
        });
        const tx = charge.balance_transaction;
        if (tx && typeof tx !== "string") feeCents = tx.fee ?? 0;
      } catch (err: any) {
        this.logger.warn(`Fee lookup failed for ${chargeId}: ${err?.message}`);
      }
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        stripePaymentIntentId: intent.id,
        stripeChargeId: chargeId,
        stripeFeeCents: feeCents,
        paidAt: new Date(),
        failedReason: null,
        status:
          order.status === OrderStatus.CANCELLED
            ? OrderStatus.CONFIRMED
            : order.status,
      },
    });

    this.logger.log(`Order ${order.code} paid (${intent.id})`);
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { stripePaymentIntentId: intent.id },
          ...(intent.metadata?.orderId
            ? [{ id: intent.metadata.orderId }]
            : []),
        ],
      },
    });
    if (!order) return;
    if (order.paymentStatus === PaymentStatus.PAID) return;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        failedReason:
          intent.last_payment_error?.message ?? "Payment was not completed",
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  private async onChargeRefunded(charge: Stripe.Charge) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { stripeChargeId: charge.id },
          ...(typeof charge.payment_intent === "string"
            ? [{ stripePaymentIntentId: charge.payment_intent }]
            : []),
        ],
      },
    });
    if (!order) return;

    // Refunds issued outside Daarik (Stripe dashboard) still need reconciling.
    const refunded = charge.amount_refunded ?? 0;
    const total = order.totalCents;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        refundedCents: refunded,
        stripeFeeCents: order.stripeFeeCents,
        paymentStatus:
          refunded >= total
            ? PaymentStatus.REFUNDED
            : refunded > 0
              ? PaymentStatus.PARTIALLY_REFUNDED
              : PaymentStatus.PAID,
        status:
          refunded >= total ? OrderStatus.CANCELLED : order.status,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------

  private async onDisputeCreated(dispute: Stripe.Dispute, account?: string) {
    const paymentIntentId =
      typeof dispute.payment_intent === "string"
        ? dispute.payment_intent
        : dispute.payment_intent?.id ?? null;

    const order = paymentIntentId
      ? await this.prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
          include: { cook: true },
        })
      : null;

    if (!order) {
      this.logger.warn(`Dispute ${dispute.id} has no matching order`);
      return;
    }

    const evidenceDueBy = dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000)
      : null;

    await this.prisma.$transaction([
      this.prisma.dispute.upsert({
        where: { stripeDisputeId: dispute.id },
        create: {
          code: `DSP-${dispute.id.slice(-8)}`,
          orderId: order.id,
          orderCode: order.code,
          cookId: order.cookId,
          customerName: order.customerName,
          cookName: order.cook.name,
          reason: dispute.reason ?? "unknown",
          customerNote: dispute.reason ?? null,
          amountCents: dispute.amount ?? 0,
          stripeDisputeId: dispute.id,
          stripeChargeId:
            typeof dispute.charge === "string" ? dispute.charge : null,
          stripePaymentIntentId: paymentIntentId,
          stripeStatus: dispute.status,
          evidenceDueBy,
          status: DisputeStatus.OPEN,
        },
        update: {
          stripeStatus: dispute.status,
          evidenceDueBy,
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          disputeBlocked: true,
          paymentStatus: PaymentStatus.DISPUTED,
        },
      }),
    ]);

    this.logger.warn(
      `Dispute opened on ${order.code} (${dispute.id}); earnings release blocked`,
    );
  }

  private async onDisputeClosed(dispute: Stripe.Dispute) {
    const local = await this.prisma.dispute.findUnique({
      where: { stripeDisputeId: dispute.id },
    });
    if (!local) return;

    const won = dispute.status === "won";

    await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id: local.id },
        data: {
          status: won ? DisputeStatus.WON : DisputeStatus.LOST,
          stripeStatus: dispute.status,
          resolvedAt: new Date(),
        },
      }),
      ...(local.orderId
        ? [
            this.prisma.order.update({
              where: { id: local.orderId },
              data: {
                disputeBlocked: !won,
                paymentStatus: won
                  ? PaymentStatus.PAID
                  : PaymentStatus.REFUNDED,
              },
            }),
          ]
        : []),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Transfers
  // ---------------------------------------------------------------------------

  private async onTransferChanged(transfer: Stripe.Transfer) {
    await this.prisma.transfer.updateMany({
      where: { stripeTransferId: transfer.id },
      data: {
        status: TransferStatus.CREATED,
        stripeSourceChargeId:
          typeof transfer.source_transaction === "string"
            ? transfer.source_transaction
            : undefined,
      },
    });
  }

  private async onTransferReversed(transfer: Stripe.Transfer) {
    const amountReversed = transfer.amount_reversed ?? 0;
    await this.prisma.transfer.updateMany({
      where: { stripeTransferId: transfer.id },
      data: {
        status:
          amountReversed >= transfer.amount
            ? TransferStatus.REVERSED
            : TransferStatus.CREATED,
        reversedCents: amountReversed,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Bank payouts
  // ---------------------------------------------------------------------------

  private async onPayout(payout: Stripe.Payout, account?: string) {
    if (!account) {
      this.logger.debug(`Payout ${payout.id} has no connected account`);
      return;
    }

    const cook = await this.prisma.cookProfile.findFirst({
      where: { stripeAccountId: account },
    });
    if (!cook) {
      this.logger.warn(`Payout ${payout.id} for unknown account ${account}`);
      return;
    }

    const paid = payout.status === "paid";
    const failed = payout.status === "failed" || payout.status === "canceled";

    const status: PayoutStatus = paid
      ? PayoutStatus.PAID
      : failed
        ? PayoutStatus.FAILED
        : PayoutStatus.IN_TRANSIT;

    await this.prisma.payout.upsert({
      where: { stripePayoutId: payout.id },
      create: {
        code: `PAY-${payout.id.slice(-8)}`,
        cookId: cook.id,
        stripePayoutId: payout.id,
        amountCents: payout.amount,
        currency: payout.currency ?? CURRENCY,
        period: new Date(payout.created * 1000).toLocaleDateString("nl-NL", {
          month: "short",
          year: "numeric",
        }),
        status,
        automatic: payout.automatic ?? true,
        arrivalDate: payout.arrival_date
          ? new Date(payout.arrival_date * 1000)
          : null,
        failureCode: payout.failure_code ?? null,
        failureMessage: payout.failure_message ?? null,
        paidAt: paid ? new Date() : null,
      },
      update: {
        status,
        amountCents: payout.amount,
        arrivalDate: payout.arrival_date
          ? new Date(payout.arrival_date * 1000)
          : null,
        failureCode: payout.failure_code ?? null,
        failureMessage: payout.failure_message ?? null,
        paidAt: paid ? new Date() : null,
      },
    });

    if (failed) {
      this.logger.error(
        `Payout ${payout.id} failed for ${cook.slug}: ${payout.failure_message ?? payout.failure_code}`,
      );
    }
  }
}
