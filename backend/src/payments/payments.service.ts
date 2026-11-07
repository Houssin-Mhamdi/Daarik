import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  ComplianceStatus,
  CookProfile,
  OrderStatus,
  PaymentStatus,
  Prisma,
  TransferStatus,
} from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { CURRENCY, computeOrderMoney, toCents, toEuros } from "./money";
import {
  CreateCheckoutSessionDto,
  RefundOrderDto,
  UpdatePayoutScheduleDto,
} from "./dto/payment.dto";

/** How often the earnings-release job runs. */
const RELEASE_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onModuleInit() {
    if (!this.stripe.isConfigured) {
      this.logger.warn("Payments disabled: Stripe is not configured.");
      return;
    }
    this.timer = setInterval(() => {
      this.releaseEligibleTransfers().catch((err) =>
        this.logger.error(`Release job failed: ${err?.message}`),
      );
    }, RELEASE_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------------------------------------------------------------------------
  // Public config
  // ---------------------------------------------------------------------------

  getPublicConfig() {
    return {
      publishableKey: this.stripe.publishableKey,
      currency: "EUR",
      country: "NL",
      testMode: this.stripe.isTestMode,
      supportedMethods: ["ideal", "card", "bancontact"],
      idealBanks: [
        { id: "abn_amro", name: "ABN AMRO" },
        { id: "asn_bank", name: "ASN Bank" },
        { id: "bunq", name: "bunq" },
        { id: "ing", name: "ING" },
        { id: "knab", name: "Knab" },
        { id: "n26", name: "N26" },
        { id: "nn", name: "Nationale-Nederlanden" },
        { id: "rabobank", name: "Rabobank" },
        { id: "regiobank", name: "RegioBank" },
        { id: "revolut", name: "Revolut" },
        { id: "sns_bank", name: "SNS Bank" },
        { id: "triodos_bank", name: "Triodos Bank" },
        { id: "van_lanschot", name: "Van Lanschot" },
        { id: "yoursafe", name: "Yoursafe" },
      ],
    };
  }

  private async getSettings() {
    const settings = await this.prisma.platformSetting.findUnique({
      where: { id: "singleton" },
    });
    if (settings) return settings;
    return this.prisma.platformSetting.create({ data: { id: "singleton" } });
  }

  // ---------------------------------------------------------------------------
  // Cook identity resolution (strict: no demo fallback)
  // ---------------------------------------------------------------------------

  /**
   * Resolve the cook that belongs to the authenticated user.
   * Never falls back to another cook: that would let one cook read or change
   * another cook's payout data.
   */
  private async requireCook(userId: string): Promise<CookProfile> {
    const cook = await this.prisma.cookProfile.findUnique({
      where: { userId },
    });
    if (!cook) {
      throw new NotFoundException("No cook profile is linked to this account");
    }
    return cook;
  }

  private async requireCookReady(cook: CookProfile): Promise<string> {
    if (!cook.stripeAccountId) {
      throw new ConflictException(
        "This cook has not started Stripe onboarding yet",
      );
    }
    if (
      cook.stripeAccountStatus !== "ENABLED" ||
      !cook.stripeChargesEnabled ||
      !cook.stripePayoutsEnabled
    ) {
      throw new ConflictException(
        "This cook cannot receive orders yet: Stripe onboarding is incomplete",
      );
    }
    if (cook.complianceStatus !== ComplianceStatus.APPROVED) {
      throw new ConflictException(
        "This cook is not approved by Daarik compliance yet",
      );
    }
    return cook.stripeAccountId;
  }

  // ---------------------------------------------------------------------------
  // Connected accounts (Accounts v2) + onboarding
  // ---------------------------------------------------------------------------

  /**
   * Creates the connected account once, with the configuration we committed to:
   * no Stripe dashboard, Stripe collects requirements, the platform pays the
   * fees and carries the losses. `dashboard` is immutable, so this only runs
   * when the cook has no account yet.
   */
  private async createConnectedAccount(cook: CookProfile) {
    const user = await this.prisma.user.findUnique({
      where: { id: cook.userId },
    });

    const account = await this.stripe.client.v2.core.accounts.create({
      display_name: cook.name,
      contact_email: user?.email,
      dashboard: "none",
      identity: {
        country: "NL",
        entity_type: "individual",
        individual: {
          email: user?.email,
          phone: user?.phone ?? undefined,
        },
      },
      defaults: {
        currency: CURRENCY,
        locales: ["nl", "en"],
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        merchant: {
          capabilities: {
            card_payments: { requested: true },
            ideal_payments: { requested: true },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      metadata: {
        cookId: cook.id,
        cookSlug: cook.slug,
        platform: "Daarik",
      },
      include: [
        "configuration.merchant",
        "configuration.recipient",
        "requirements",
      ],
    });

    const updated = await this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: "PENDING",
        stripeSyncedAt: new Date(),
      },
    });

    this.logger.log(`Created connected account ${account.id} for ${cook.slug}`);
    return updated;
  }

  /**
   * Returns a fresh Stripe-hosted onboarding URL. The cook never sees a Stripe
   * dashboard and Daarik never touches their identity documents.
   */
  async createOnboardingLink(userId: string) {
    let cook = await this.requireCook(userId);
    if (!cook.stripeAccountId) {
      cook = await this.createConnectedAccount(cook);
    }

    const accountId = cook.stripeAccountId!;
    const refreshUrl = `${this.stripe.frontendOrigin}/cook/earnings?stripe=refresh`;
    const returnUrl = `${this.stripe.frontendOrigin}/cook/earnings?stripe=return`;

    // Stripe's v1 AccountLinks API works on v2 accounts in both legacy testmode
    // and live mode (whereas v2.core.accountLinks rejects auto-attached
    // `stripe_balance.payouts` capabilities outside a Stripe Sandbox).
    const link = await this.stripe.client.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
      collection_options: {
        fields: "eventually_due",
        future_requirements: "include",
      },
    });

    return {
      url: link.url,
      expiresAt: link.expires_at,
      accountId,
    };
  }

  /**
   * Pulls the authoritative account status from Stripe (v1 view of a v2
   * account) and mirrors it locally. Called on onboarding return and on every
   * `account.updated` webhook.
   */
  async syncAccount(accountId: string) {
    const account = await this.stripe.client.accounts.retrieve(accountId);
    const due = account.requirements?.currently_due ?? [];

    let status: "PENDING" | "REQUIREMENTS_DUE" | "RESTRICTED" | "ENABLED" =
      "PENDING";
    if (account.charges_enabled && account.payouts_enabled) {
      status = "ENABLED";
    } else if (account.requirements?.disabled_reason) {
      status = "RESTRICTED";
    } else if (due.length > 0) {
      status = "REQUIREMENTS_DUE";
    }

    let bankName: string | null = null;
    let ibanLast4: string | null = null;
    try {
      const banks = await this.stripe.client.accounts.listExternalAccounts(
        accountId,
        { object: "bank_account", limit: 1 },
      );
      const bank = banks.data[0] as Stripe.BankAccount | undefined;
      bankName = bank?.bank_name ?? null;
      ibanLast4 = bank?.last4 ?? null;
    } catch (err: any) {
      this.logger.debug(`Could not read bank account: ${err?.message}`);
    }

    const cook = await this.prisma.cookProfile.findFirst({
      where: { stripeAccountId: accountId },
    });
    if (!cook) return null;

    return this.prisma.cookProfile.update({
      where: { id: cook.id },
      data: {
        stripeAccountStatus: status,
        stripeChargesEnabled: Boolean(account.charges_enabled),
        stripePayoutsEnabled: Boolean(account.payouts_enabled),
        stripeRequirementsDue: due,
        stripeDisabledReason: account.requirements?.disabled_reason ?? null,
        bankName,
        ibanLast4,
        stripeSyncedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Cook-facing payout settings
  // ---------------------------------------------------------------------------

  async getCookPayoutSettings(userId: string) {
    const cook = await this.requireCook(userId);
    const settings = await this.getSettings();

    let schedule: unknown = null;
    let stripeBalance: { availableCents: number; pendingCents: number } | null =
      null;

    if (cook.stripeAccountId) {
      try {
        const account = await this.stripe.client.accounts.retrieve(
          cook.stripeAccountId,
        );
        schedule = account.settings?.payouts?.schedule ?? null;
        const balance = await this.stripe.client.balance.retrieve(
          {},
          { stripeAccount: cook.stripeAccountId },
        );
        stripeBalance = {
          availableCents:
            balance.available.find((b) => b.currency === CURRENCY)?.amount ?? 0,
          pendingCents:
            balance.pending.find((b) => b.currency === CURRENCY)?.amount ?? 0,
        };
      } catch (err: any) {
        this.logger.warn(`Balance lookup failed: ${err?.message}`);
      }
    }

    return {
      cookId: cook.slug,
      name: cook.name,
      stripe: {
        connected: Boolean(cook.stripeAccountId),
        accountId: cook.stripeAccountId,
        status: cook.stripeAccountStatus,
        chargesEnabled: cook.stripeChargesEnabled,
        payoutsEnabled: cook.stripePayoutsEnabled,
        requirementsDue: cook.stripeRequirementsDue,
        disabledReason: cook.stripeDisabledReason,
        syncedAt: cook.stripeSyncedAt,
      },
      compliance: {
        status: cook.complianceStatus,
        note: cook.complianceNote,
        checkedAt: cook.complianceCheckedAt,
      },
      bank: {
        bankName: cook.bankName,
        ibanLast4: cook.ibanLast4,
      },
      balance: stripeBalance,
      schedule,
      holdDays: cook.payoutHoldDays ?? settings.payoutHoldDays,
      canReceiveOrders:
        cook.stripePayoutsEnabled &&
        cook.complianceStatus === ComplianceStatus.APPROVED,
    };
  }

  /** Re-reads the connected account from Stripe, then returns the fresh view. */
  async refreshCookAccount(userId: string) {
    const cook = await this.requireCook(userId);
    if (cook.stripeAccountId) {
      await this.syncAccount(cook.stripeAccountId);
    }
    return this.getCookPayoutSettings(userId);
  }

  async updatePayoutSchedule(userId: string, dto: UpdatePayoutScheduleDto) {
    const cook = await this.requireCook(userId);
    if (!cook.stripeAccountId) {
      throw new ConflictException("Start Stripe onboarding first");
    }

    // Payout settings are only available on the Accounts v1 API, even for a v2
    // account.
    const schedule: Stripe.AccountUpdateParams.Settings.Payouts.Schedule =
      dto.interval === "MANUAL"
        ? { interval: "manual" }
        : dto.interval === "WEEKLY"
          ? {
              interval: "weekly",
              weekly_anchor: dto.weeklyAnchor ?? "monday",
            }
          : dto.interval === "MONTHLY"
            ? {
                interval: "monthly",
                monthly_anchor: dto.monthlyAnchor ?? 1,
              }
            : { interval: "daily" };

    await this.stripe.client.accounts.update(cook.stripeAccountId, {
      settings: { payouts: { schedule } },
    });

    return { interval: dto.interval, schedule };
  }

  /**
   * Mirrors the platform payout policy onto every connected account. Bank
   * payouts are Stripe's own schedule; the platform only decides the cadence.
   */
  async applyPayoutPolicyToCooks() {
    const settings = await this.getSettings();
    const schedule = this.toStripeSchedule(settings);

    const cooks = await this.prisma.cookProfile.findMany({
      where: { stripeAccountId: { not: null } },
      select: { stripeAccountId: true, slug: true },
    });

    let updated = 0;
    for (const cook of cooks) {
      try {
        await this.stripe.client.accounts.update(cook.stripeAccountId!, {
          settings: { payouts: { schedule } },
        });
        updated += 1;
      } catch (err: any) {
        this.logger.warn(
          `Could not update payout schedule for ${cook.slug}: ${err?.message}`,
        );
      }
    }

    return { updated, total: cooks.length, schedule };
  }

  private toStripeSchedule(settings: {
    payoutInterval: string;
    payoutWeeklyAnchor: string;
    payoutMonthlyAnchor: number;
  }): Stripe.AccountUpdateParams.Settings.Payouts.Schedule {
    switch (settings.payoutInterval) {
      case "MANUAL":
        return { interval: "manual" };
      case "DAILY":
        return { interval: "daily" };
      case "MONTHLY":
        return {
          interval: "monthly",
          monthly_anchor: settings.payoutMonthlyAnchor ?? 1,
        };
      default:
        return {
          interval: "weekly",
          weekly_anchor: (settings.payoutWeeklyAnchor ??
            "monday") as Stripe.AccountUpdateParams.Settings.Payouts.Schedule.WeeklyAnchor,
        };
    }
  }

  /**
   * Re-reads one bank payout from Stripe. Used by admins when a webhook was
   * missed; a payout is still only PAID if Stripe says `paid`.
   */
  async syncPayout(idOrCode: string) {
    const payout = await this.prisma.payout.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
      include: { cook: true },
    });
    if (!payout) throw new NotFoundException("Payout not found");
    if (!payout.stripePayoutId || !payout.cook.stripeAccountId) {
      throw new ConflictException("This payout does not exist at Stripe yet");
    }

    const remote = await this.stripe.client.payouts.retrieve(
      payout.stripePayoutId,
      {},
      { stripeAccount: payout.cook.stripeAccountId },
    );

    const paid = remote.status === "paid";
    const failed =
      remote.status === "failed" || remote.status === "canceled";

    return this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: paid
          ? "PAID"
          : failed
            ? "FAILED"
            : "IN_TRANSIT",
        amountCents: remote.amount,
        arrivalDate: remote.arrival_date
          ? new Date(remote.arrival_date * 1000)
          : null,
        failureCode: remote.failure_code ?? null,
        failureMessage: remote.failure_message ?? null,
        paidAt: paid ? (payout.paidAt ?? new Date()) : null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------------------------

  /**
   * Creates a Stripe-hosted Checkout Session for an existing order.
   *
   * `on_behalf_of` makes the cook the settlement merchant (merchant of record),
   * which is the model we committed to. Money still lands on the platform
   * balance, and the cook is paid later by the release job.
   */
  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const order = await this.prisma.order.findUnique({
      where: { code: dto.orderCode },
      include: { cook: true, items: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.customerId !== userId) {
      throw new ForbiddenException("This order belongs to another customer");
    }
    if (
      order.paymentStatus === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new ConflictException("This order is already paid");
    }
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new ConflictException("This order has been refunded");
    }

    const accountId = await this.requireCookReady(order.cook);
    if (!order.cook.kitchenOpen) {
      throw new ConflictException(
        "This kitchen is on a break and is not accepting orders right now.",
      );
    }
    const settings = await this.getSettings();

    if (order.totalCents < settings.minOrderCents) {
      throw new BadRequestException(
        `Minimum order value is €${toEuros(settings.minOrderCents).toFixed(2)}`,
      );
    }

    // Reuse an open session instead of creating a second payable one.
    if (order.stripeCheckoutSessionId) {
      try {
        const existing = await this.stripe.client.checkout.sessions.retrieve(
          order.stripeCheckoutSessionId,
        );
        if (existing.status === "open" && existing.url) {
          return {
            sessionId: existing.id,
            url: existing.url,
            amountCents: order.totalCents,
            currency: "EUR",
          };
        }
      } catch {
        // Session expired or was deleted: fall through and create a new one.
      }
    }

    const methods =
      dto.paymentMethod === "bancontact"
        ? ["bancontact"]
        : dto.paymentMethod === "card"
          ? ["card"]
          : dto.paymentMethod === "ideal"
            ? ["ideal"]
            : ["ideal", "card"];

    const session = await this.stripe.client.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customerEmail,
      client_reference_id: order.id,
      locale: "nl",
      allowed_payment_method_types: methods as Array<
        Stripe.Checkout.SessionCreateParams.AllowedPaymentMethodType
      >,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: order.totalCents,
            product_data: {
              name: `${order.cook.name} · Daarik ${order.code}`,
              description: `${order.items.length} item(s) · pickup ${order.pickupTime}`,
            },
          },
        },
      ],
      payment_intent_data: {
        on_behalf_of: accountId,
        transfer_group: order.id,
        description: `Daarik ${order.code}`,
        metadata: {
          orderId: order.id,
          orderCode: order.code,
          cookId: order.cookId,
          platform: "Daarik",
        },
      },
      metadata: {
        orderId: order.id,
        orderCode: order.code,
        cookId: order.cookId,
      },
      success_url: `${this.stripe.frontendOrigin}/orders/${order.code}?payment=success`,
      cancel_url: `${this.stripe.frontendOrigin}/checkout?payment=cancelled&order=${order.code}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        paymentStatus: PaymentStatus.PROCESSING,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
      amountCents: order.totalCents,
      currency: "EUR",
    };
  }

  // ---------------------------------------------------------------------------
  // Earnings release
  // ---------------------------------------------------------------------------

  /**
   * Releases every order that has become eligible: paid, completed, past the
   * hold period, not disputed, not refunded, cook fully enabled and compliant.
   */
  async releaseEligibleTransfers(limit = 50) {
    if (!this.stripe.isConfigured) return { released: 0, failed: 0, skipped: 0 };

    const settings = await this.getSettings();
    const now = new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        disputeBlocked: false,
        refundedCents: 0,
        transferEligibleAt: { lte: now },
        transfers: { none: { status: { in: ["CREATED", "PENDING"] } } },
        cook: {
          stripeAccountStatus: "ENABLED",
          stripePayoutsEnabled: true,
          complianceStatus: ComplianceStatus.APPROVED,
        },
      },
      include: { cook: true },
      orderBy: { transferEligibleAt: "asc" },
      take: limit,
    });

    let released = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        const result = await this.releaseOrder(order);
        if (result === "created") released += 1;
      } catch (err: any) {
        failed += 1;
        this.logger.error(
          `Transfer failed for ${order.code}: ${err?.message}`,
        );
      }
    }

    if (released || failed) {
      this.logger.log(
        `Release job: ${released} transferred, ${failed} failed, ${orders.length} considered (hold ${settings.payoutHoldDays}d)`,
      );
    }

    return { released, failed, skipped: orders.length - released - failed };
  }

  private async releaseOrder(order: {
    id: string;
    code: string;
    cookId: string;
    cookNetCents: number;
    stripeChargeId: string | null;
    cook: CookProfile;
  }): Promise<"created" | "skipped"> {
    const accountId = order.cook.stripeAccountId;
    if (!accountId) return "skipped";
    if (order.cookNetCents <= 0) return "skipped";

    const idempotencyKey = `transfer:${order.id}`;

    const existing = await this.prisma.transfer.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.status === TransferStatus.CREATED) return "skipped";

    await this.prisma.transfer.upsert({
      where: { idempotencyKey },
      create: {
        orderId: order.id,
        cookId: order.cookId,
        amountCents: order.cookNetCents,
        currency: CURRENCY,
        status: TransferStatus.PENDING,
        idempotencyKey,
        stripeSourceChargeId: order.stripeChargeId,
        createdBy: "system:release-job",
      },
      update: {
        status: TransferStatus.PENDING,
        failureReason: null,
      },
    });

    try {
      const transfer = await this.stripe.client.transfers.create(
        {
          amount: order.cookNetCents,
          currency: CURRENCY,
          destination: accountId,
          transfer_group: order.id,
          source_transaction: order.stripeChargeId ?? undefined,
          metadata: {
            orderId: order.id,
            orderCode: order.code,
            cookId: order.cookId,
          },
        },
        { idempotencyKey },
      );

      await this.prisma.transfer.update({
        where: { idempotencyKey },
        data: {
          status: TransferStatus.CREATED,
          stripeTransferId: transfer.id,
          failureReason: null,
        },
      });
      return "created";
    } catch (err: any) {
      await this.prisma.transfer.update({
        where: { idempotencyKey },
        data: {
          status: TransferStatus.FAILED,
          failureReason: err?.message ?? "Unknown Stripe error",
        },
      });
      throw err;
    }
  }

  /** Manual trigger from the admin dashboard. */
  async releaseNow() {
    return this.releaseEligibleTransfers(200);
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  async refundOrder(orderId: string, dto: RefundOrderDto, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { transfers: true, refunds: true, cook: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!order.stripePaymentIntentId) {
      throw new BadRequestException("This order has no Stripe payment");
    }

    const refundable = order.totalCents - order.refundedCents;
    if (refundable <= 0) {
      throw new ConflictException("This order is fully refunded already");
    }

    const amountCents = dto.amount ? toCents(dto.amount) : refundable;
    if (amountCents <= 0 || amountCents > refundable) {
      throw new BadRequestException(
        `Refund amount must be between €0.01 and €${toEuros(refundable).toFixed(2)}`,
      );
    }

    const refund = await this.stripe.client.refunds.create(
      {
        payment_intent: order.stripePaymentIntentId,
        amount: amountCents,
        reason: "requested_by_customer",
        metadata: {
          orderId: order.id,
          orderCode: order.code,
          note: dto.reason ?? "",
          adminId,
        },
      },
      {
        idempotencyKey: `refund:${order.id}:${order.refundedCents}:${amountCents}`,
      },
    );

    const reversedCents = await this.reverseTransferShare(order, amountCents);

    const totalRefunded = order.refundedCents + amountCents;

    await this.prisma.$transaction([
      this.prisma.refund.create({
        data: {
          orderId: order.id,
          stripeRefundId: refund.id,
          amountCents,
          reason: dto.reason,
          status: refund.status ?? "succeeded",
          reversedTransferCents: reversedCents,
          createdBy: adminId,
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          refundedCents: totalRefunded,
          paymentStatus:
            totalRefunded >= order.totalCents
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
          status:
            totalRefunded >= order.totalCents
              ? OrderStatus.CANCELLED
              : order.status,
        },
      }),
    ]);

    return {
      refundId: refund.id,
      amountCents,
      reversedTransferCents: reversedCents,
      totalRefundedCents: totalRefunded,
    };
  }

  /**
   * Refunding a platform charge does not touch the transfer. We reverse the
   * cook's proportional share so they don't keep money for food that was
   * refunded.
   */
  private async reverseTransferShare(
    order: {
      id: string;
      totalCents: number;
      cookNetCents: number;
      transfers: { stripeTransferId: string | null; status: string; amountCents: number; reversedCents: number }[];
    },
    refundCents: number,
  ): Promise<number> {
    const transfer = order.transfers.find(
      (t) => t.status === TransferStatus.CREATED && t.stripeTransferId,
    );
    if (!transfer?.stripeTransferId || order.totalCents <= 0) return 0;

    const share = Math.round(
      (refundCents * order.cookNetCents) / order.totalCents,
    );
    const alreadyReversed = transfer.reversedCents ?? 0;
    const reversible = Math.min(
      share,
      transfer.amountCents - alreadyReversed,
    );
    if (reversible <= 0) return 0;

    try {
      await this.stripe.client.transfers.createReversal(
        transfer.stripeTransferId,
        {
          amount: reversible,
          metadata: { orderId: order.id, reason: "order_refund" },
        },
        { idempotencyKey: `reversal:${order.id}:${alreadyReversed}:${reversible}` },
      );

      await this.prisma.transfer.updateMany({
        where: { stripeTransferId: transfer.stripeTransferId },
        data: { reversedCents: { increment: reversible } },
      });

      return reversible;
    } catch (err: any) {
      // The cook may already have withdrawn the money. Surface it to admins
      // instead of failing the customer's refund.
      this.logger.error(
        `Could not reverse transfer for ${order.id}: ${err?.message}`,
      );
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Cook earnings
  // ---------------------------------------------------------------------------

  async getCookEarnings(userId: string) {
    const cook = await this.requireCook(userId);

    const [orders, transfers, payouts, settings] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          cookId: cook.id,
          paymentStatus: {
            in: [
              PaymentStatus.PAID,
              PaymentStatus.PARTIALLY_REFUNDED,
              PaymentStatus.REFUNDED,
              PaymentStatus.DISPUTED,
            ],
          },
        },
        include: {
          transfers: true,
          items: { select: { qty: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.transfer.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.payout.findMany({
        where: { cookId: cook.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.getSettings(),
    ]);

    const pending = orders.filter(
      (o) =>
        o.paymentStatus === PaymentStatus.PAID &&
        !o.transfers.some((t) => t.status === TransferStatus.CREATED),
    );
    const released = transfers.filter(
      (t) => t.status === TransferStatus.CREATED,
    );

    const sum = (rows: { cookNetCents: number }[]) =>
      rows.reduce((s, r) => s + r.cookNetCents, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = orders.filter((o) => o.createdAt >= monthStart);

    return {
      cookId: cook.slug,
      canReceiveOrders:
        cook.stripePayoutsEnabled &&
        cook.complianceStatus === ComplianceStatus.APPROVED,
      status: {
        stripe: cook.stripeAccountStatus,
        compliance: cook.complianceStatus,
      },
      totals: {
        thisMonthGrossCents: thisMonth.reduce(
          (s, o) => s + o.subtotalCents,
          0,
        ),
        thisMonthCommissionCents: thisMonth.reduce(
          (s, o) => s + o.commissionCents,
          0,
        ),
        thisMonthNetCents: thisMonth.reduce(
          (s, o) => s + o.cookNetCents,
          0,
        ),
        pendingCents: sum(pending),
        releasedCents: released.reduce(
          (s, t) => s + t.amountCents - t.reversedCents,
          0,
        ),
        ordersCount: orders.length,
      },
      orders: orders.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        subtotal: toEuros(o.subtotalCents),
        commission: toEuros(o.commissionCents),
        cookNet: toEuros(o.cookNetCents),
        itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
        release: o.transfers[0]
          ? {
              status: o.transfers[0].status,
              amount: toEuros(o.transfers[0].amountCents),
              reversed: toEuros(o.transfers[0].reversedCents),
              createdAt: o.transfers[0].createdAt,
            }
          : null,
        eligibleAt: o.transferEligibleAt,
      })),
      payouts: payouts.map((p) => ({
        id: p.code,
        amount: toEuros(p.amountCents),
        currency: p.currency.toUpperCase(),
        status: p.status,
        automatic: p.automatic,
        arrivalDate: p.arrivalDate,
        failureMessage: p.failureMessage,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      holdDays: cook.payoutHoldDays ?? settings.payoutHoldDays,
      payoutPolicy: {
        interval: settings.payoutInterval,
        weeklyAnchor: settings.payoutWeeklyAnchor,
        monthlyAnchor: settings.payoutMonthlyAnchor,
      },
      balance: await this.getCookStripeBalance(cook.stripeAccountId),
    };
  }

  private async getCookStripeBalance(accountId: string | null) {
    if (!accountId || !this.stripe.isConfigured) return null;
    try {
      const balance = await this.stripe.client.balance.retrieve(
        {},
        { stripeAccount: accountId },
      );
      return {
        availableCents:
          balance.available.find((b) => b.currency === CURRENCY)?.amount ?? 0,
        pendingCents:
          balance.pending.find((b) => b.currency === CURRENCY)?.amount ?? 0,
      };
    } catch (err: any) {
      this.logger.warn(`Cook balance unavailable: ${err?.message}`);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Shared helpers used by orders / webhooks
  // ---------------------------------------------------------------------------

  async priceOrder(
    subtotalCents: number,
  ): Promise<ReturnType<typeof computeOrderMoney>> {
    const settings = await this.getSettings();
    return computeOrderMoney(subtotalCents, settings);
  }

  /** Called by the orders service when an order is marked completed. */
  async scheduleEarningsRelease(orderId: string, completedAt: Date) {
    const settings = await this.getSettings();
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { cook: true },
    });
    if (!order) return null;

    const holdDays = order.cook.payoutHoldDays ?? settings.payoutHoldDays;
    const eligibleAt = new Date(
      completedAt.getTime() + holdDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.order.update({
      where: { id: orderId },
      data: { completedAt, transferEligibleAt: eligibleAt },
    });
  }

  /** Small helper for the admin marketplace panel. */
  async getPlatformBalance() {
    if (!this.stripe.isConfigured) return null;
    try {
      const balance = await this.stripe.client.balance.retrieve();
      return {
        availableCents:
          balance.available.find((b) => b.currency === CURRENCY)?.amount ?? 0,
        pendingCents:
          balance.pending.find((b) => b.currency === CURRENCY)?.amount ?? 0,
      };
    } catch (err: any) {
      this.logger.warn(`Platform balance unavailable: ${err?.message}`);
      return null;
    }
  }
}
