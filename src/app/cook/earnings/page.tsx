"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/overlays";
import { Card, Money, KeyValue } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import {
  useCookEarningsQuery,
  useCookPayoutSettingsQuery,
  useStripeOnboardingMutation,
  useSyncCookPayoutSettingsMutation,
} from "@/lib/queries";
import { errorMessage, formatPrice } from "@/lib/utils";

type Lang = "nl" | "en" | "ar";

const centsToEuros = (cents?: number | null) => (cents ?? 0) / 100;

function formatDate(value: string | null | undefined, lang: Lang) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = lang === "ar" ? "ar-NL" : lang === "nl" ? "nl-NL" : "en-GB";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CookEarningsPage() {
  const { t, lang, toast } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: earnings, isLoading: earningsLoading } = useCookEarningsQuery();
  const { data: settings } = useCookPayoutSettingsQuery();
  const onboarding = useStripeOnboardingMutation();
  const sync = useSyncCookPayoutSettingsMutation();

  const [busy, setBusy] = useState(false);

  const stripe = settings?.stripe;
  const compliance = settings?.compliance;
  const connected = Boolean(stripe?.connected);
  const canReceive = Boolean(settings?.canReceiveOrders);

  const totals = earnings?.totals;
  const balance = earnings?.balance ?? settings?.balance;
  const holdDays = earnings?.holdDays ?? settings?.holdDays ?? 7;
  const interval = earnings?.payoutPolicy.interval ?? "WEEKLY";

  const stripeLabel = (status?: string) => {
    switch (status) {
      case "ENABLED":
        return t("stripeEnabled");
      case "REQUIREMENTS_DUE":
        return t("stripeRequirementsDue");
      case "PENDING":
        return t("stripePending");
      case "RESTRICTED":
        return t("stripeRestricted");
      case "DISABLED":
        return t("stripeDisabled");
      default:
        return t("stripeNotConnected");
    }
  };

  const complianceLabel = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return t("complianceApproved");
      case "PENDING":
        return t("compliancePending");
      case "REJECTED":
        return t("complianceRejected");
      case "SUSPENDED":
        return t("complianceSuspended");
      case "BLOCKED":
        return t("complianceBlocked");
      default:
        return t("complianceNotStarted");
    }
  };

  const payoutStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return t("paidOut");
      case "IN_TRANSIT":
      case "SCHEDULED":
      case "PENDING":
        return t("inTransit");
      case "FAILED":
        return t("payoutFailure");
      case "CANCELED":
        return t("cancelled");
      default:
        return status;
    }
  };

  const payoutStatusVariant = (status: string) => {
    if (status === "PAID") return "olive" as const;
    if (status === "FAILED" || status === "CANCELED") return "terracotta" as const;
    return "saffron" as const;
  };

  const startOnboarding = async () => {
    setBusy(true);
    try {
      const link = await onboarding.mutateAsync();
      window.location.assign(link.url);
    } catch (err) {
      setBusy(false);
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await sync.mutateAsync();
      toast(t("stripeSynced"));
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const scheduleLabel =
    interval === "DAILY"
      ? "Daily"
      : interval === "MONTHLY"
        ? "Monthly"
        : interval === "MANUAL"
          ? "Manual"
          : "Weekly";

  return (
    <div className="pb-8 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1120px] md:px-8 md:pt-10">
        <CookMobileHeader title={t("earningsTitle")} subtitle={t("earningsSub")} />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("earningsTitle")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">{t("earningsSub")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast(t("statementDownloaded"))}
            >
              <ArrowDownToLine className="size-3.5" />
              {t("downloadStatement")}
            </Button>
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <CreditCard className="size-3.5" />
              {t("payoutSettings")}
            </Button>
          </div>
        </div>

        {/* Payout readiness */}
        <div className="mt-3 space-y-3 md:mt-5">
          {!canReceive ? (
            <Card className="border-terracotta/25 bg-terracotta-50/40 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-terracotta text-white">
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15.5px] font-semibold text-charcoal">
                    {connected ? t("cannotReceiveOrders") : t("payoutSetupTitle")}
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    {connected ? t("complianceGateNote") : t("payoutSetupDesc")}
                  </p>

                  {stripe?.requirementsDue?.length ? (
                    <div className="mt-2.5 rounded-2xl border border-line bg-white/70 p-3">
                      <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted">
                        {t("requirementsDue")}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {stripe.requirementsDue.slice(0, 5).map((req) => (
                          <li
                            key={req}
                            className="flex items-start gap-1.5 text-[12.5px] text-charcoal"
                          >
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-terracotta" />
                            {req.replaceAll("_", " ")}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-[11.5px] text-muted">
                        {t("requirementsDueHint")}
                      </p>
                    </div>
                  ) : null}

                  <Button
                    className="mt-3 w-full sm:w-auto"
                    size="sm"
                    loading={busy || onboarding.isPending}
                    onClick={startOnboarding}
                  >
                    <ShieldCheck className="size-3.5" />
                    {connected ? t("continueOnboarding") : t("startOnboarding")}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-olive/25 bg-olive-50/50 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white">
                  <CheckCircle2 className="size-4" />
                </span>
                <p className="text-[13.5px] font-semibold text-olive-700">
                  {t("canReceiveOrders")}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ms-auto"
                  loading={busy || sync.isPending}
                  onClick={refresh}
                >
                  <RefreshCw className="size-3.5" />
                  {t("syncStripe")}
                </Button>
              </div>
            </Card>
          )}

          {/* Status chips */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 text-start shadow-card transition hover:border-line-strong"
            >
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                  {t("stripeStatus")}
                </p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-charcoal">
                  {stripeLabel(stripe?.status)}
                </p>
              </div>
              <Badge
                variant={
                  stripe?.status === "ENABLED"
                    ? "olive"
                    : stripe?.status === "NONE"
                      ? "default"
                      : "saffron"
                }
                size="sm"
              >
                {stripe?.status === "ENABLED" ? "✓" : "•"}
              </Badge>
            </button>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 shadow-card">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                  {t("complianceStatus")}
                </p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-charcoal">
                  {complianceLabel(compliance?.status)}
                </p>
              </div>
              <Badge
                variant={
                  compliance?.status === "APPROVED"
                    ? "olive"
                    : compliance?.status === "REJECTED" ||
                        compliance?.status === "SUSPENDED"
                      ? "terracotta"
                      : "saffron"
                }
                size="sm"
              >
                {compliance?.status === "APPROVED" ? "✓" : "•"}
              </Badge>
            </div>
          </div>
        </div>

        {earningsLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-44 animate-pulse rounded-[26px] bg-charcoal/10" />
            <div className="h-24 animate-pulse rounded-[22px] bg-cream-100" />
          </div>
        ) : (
          <>
            {/* Net hero */}
            <div className="mt-4 grid gap-3 md:grid-cols-[1.3fr_0.7fr] md:items-start">
              <div className="relative overflow-hidden rounded-[26px] bg-charcoal p-5 text-cream shadow-card">
                <div
                  aria-hidden
                  className="absolute -end-10 -top-12 size-44 rounded-full border-[26px] border-white/5"
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-saffron">
                        {t("estimatedNet")}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-cream/55">
                        {t("thisMonthLabel")}
                      </p>
                    </div>
                    <span className="grid size-9 place-items-center rounded-full bg-white/10">
                      <TrendingUp className="size-4 text-saffron" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-[40px] font-semibold leading-none text-white">
                    <Money value={centsToEuros(totals?.thisMonthNetCents)} />
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[12px] text-cream/60">
                    <ArrowDownToLine className="size-3 text-olive-100" />
                    {t("releaseAfterDays", { days: holdDays })}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                    {[
                      {
                        label: t("grossShort"),
                        value: centsToEuros(totals?.thisMonthGrossCents),
                      },
                      {
                        label: t("commissionShort"),
                        value: -centsToEuros(totals?.thisMonthCommissionCents),
                      },
                      {
                        label: t("netShort"),
                        value: centsToEuros(totals?.thisMonthNetCents),
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[10.5px] uppercase tracking-[0.08em] text-cream/45">
                          {item.label}
                        </p>
                        <p
                          className={
                            item.value < 0
                              ? "mt-0.5 text-[14px] font-semibold tabular-nums text-terracotta-100"
                              : "mt-0.5 text-[14px] font-semibold tabular-nums text-white"
                          }
                        >
                          {item.value < 0 ? "−" : ""}
                          {formatPrice(Math.abs(item.value), lang)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Card className="p-4">
                  <div className="space-y-2.5">
                    <KeyValue
                      label={t("awaitingRelease")}
                      value={<Money value={centsToEuros(totals?.pendingCents)} />}
                    />
                    <KeyValue
                      label={t("releasedToStripe")}
                      value={<Money value={centsToEuros(totals?.releasedCents)} />}
                    />
                    <div className="border-t border-line/70 pt-2.5">
                      <KeyValue
                        label={t("availableBalance")}
                        value={
                          balance ? (
                            <Money value={centsToEuros(balance.availableCents)} />
                          ) : (
                            <span className="text-muted">—</span>
                          )
                        }
                      />
                    </div>
                    <KeyValue
                      label={t("pendingBalance")}
                      value={
                        balance ? (
                          <Money value={centsToEuros(balance.pendingCents)} />
                        ) : (
                          <span className="text-muted">—</span>
                        )
                      }
                    />
                  </div>
                </Card>

                <div className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-olive" />
                  {t("netNote")}
                </div>
              </div>
            </div>

            {/* Orders */}
            <Card className="mt-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold text-charcoal">
                  {t("orderEarnings")}
                </h2>
                <span className="text-[12px] font-semibold text-muted">
                  {t("orders")}: {totals?.ordersCount ?? 0}
                </span>
              </div>

              {earnings?.orders.length ? (
                <div className="mt-3 divide-y divide-line/70">
                  {earnings.orders.slice(0, 12).map((order) => {
                    const release = order.release;
                    const releaseVariant =
                      release?.status === "CREATED"
                        ? "olive"
                        : release?.status === "FAILED" ||
                            release?.status === "REVERSED"
                          ? "terracotta"
                          : "saffron";
                    const releaseText =
                      release?.status === "CREATED"
                        ? t("releasedToStripe")
                        : release?.status === "FAILED"
                          ? t("releaseFailed")
                          : release?.status === "REVERSED"
                            ? t("releaseReversed")
                            : order.eligibleAt
                              ? t("releaseOn", {
                                  date: formatDate(order.eligibleAt, lang),
                                })
                              : t("releasePending");

                    return (
                      <div
                        key={order.id}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-charcoal">
                            {order.code}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-muted">
                            {formatDate(order.createdAt, lang)} ·{" "}
                            {order.itemsCount} {t("items")}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-muted">
                            {t("grossShort")}{" "}
                            {formatPrice(order.subtotal, lang)} ·{" "}
                            {t("commissionShort")}{" "}
                            {formatPrice(order.commission, lang)}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="text-[14px] font-semibold text-charcoal">
                            <Money value={order.cookNet} />
                          </p>
                          <Badge variant={releaseVariant} size="sm" className="mt-1">
                            {releaseText}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-cream/60 p-4 text-center">
                  <Banknote className="mx-auto size-5 text-muted-soft" />
                  <p className="mt-1.5 text-[13px] text-muted">{t("noOrdersYet")}</p>
                </div>
              )}
            </Card>

            {/* Payout history */}
            <Card className="mt-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold text-charcoal">
                  {t("payoutHistory")}
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="text-[12.5px] font-semibold text-terracotta"
                >
                  {t("payoutSettings")}
                </button>
              </div>

              {earnings?.payouts.length ? (
                <div className="mt-3 divide-y divide-line/70">
                  {earnings.payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-charcoal">
                          {payout.id}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          {formatDate(payout.paidAt ?? payout.arrivalDate, lang)}
                          {payout.failureMessage ? (
                            <span className="block text-terracotta-700">
                              {payout.failureMessage}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-[14px] font-semibold text-charcoal">
                          <Money value={payout.amount} />
                        </p>
                        <Badge
                          variant={payoutStatusVariant(payout.status)}
                          size="sm"
                          className="mt-1"
                        >
                          {payoutStatusLabel(payout.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-cream/60 p-4 text-center">
                  <Clock3 className="mx-auto size-5 text-muted-soft" />
                  <p className="mt-1.5 text-[13px] text-muted">{t("noPayouts")}</p>
                </div>
              )}
            </Card>

            <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-muted">
              {t("earningsInfo")} {t("commissionFootnote")}
            </p>
          </>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("payoutSettings")}
        description={t("payoutSetupDesc")}
        footer={
          <Button
            className="w-full"
            loading={busy || onboarding.isPending}
            onClick={startOnboarding}
          >
            <ShieldCheck className="size-4" />
            {connected ? t("continueOnboarding") : t("startOnboarding")}
          </Button>
        }
      >
        <div className="space-y-3">
          <Card className="p-3.5">
            <div className="space-y-2.5">
              <KeyValue
                label={t("stripeStatus")}
                value={
                  <Badge
                    variant={
                      stripe?.status === "ENABLED"
                        ? "olive"
                        : stripe?.status === "NONE"
                          ? "default"
                          : "saffron"
                    }
                    size="sm"
                  >
                    {stripeLabel(stripe?.status)}
                  </Badge>
                }
              />
              <KeyValue
                label={t("complianceStatus")}
                value={
                  <Badge
                    variant={
                      compliance?.status === "APPROVED"
                        ? "olive"
                        : compliance?.status === "REJECTED" ||
                            compliance?.status === "SUSPENDED"
                          ? "terracotta"
                          : "saffron"
                    }
                    size="sm"
                  >
                    {complianceLabel(compliance?.status)}
                  </Badge>
                }
              />
              <KeyValue
                label={t("bankAccount")}
                value={
                  settings?.bank?.ibanLast4
                    ? t("bankLast4", { last4: settings.bank.ibanLast4 })
                    : <span className="text-muted">—</span>
                }
              />
              <KeyValue
                label={t("payoutSchedule")}
                value={<span>{scheduleLabel}</span>}
              />
              <KeyValue
                label={t("nextPayout")}
                value={
                  <span>
                    {t("releaseAfterDays", { days: holdDays })}
                  </span>
                }
              />
            </div>
          </Card>

          {stripe?.requirementsDue?.length ? (
            <Card className="p-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted">
                {t("requirementsDue")}
              </p>
              <ul className="mt-2 space-y-1">
                {stripe.requirementsDue.map((req) => (
                  <li
                    key={req}
                    className="flex items-start gap-1.5 text-[13px] text-charcoal"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-terracotta" />
                    {req.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                {t("requirementsDueHint")}
              </p>
            </Card>
          ) : null}

          <div className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-olive" />
            {t("payoutPolicyNote")}
          </div>

          <Button
            variant="outline"
            className="w-full"
            loading={busy || sync.isPending}
            onClick={refresh}
          >
            <RefreshCw className="size-4" />
            {t("syncStripe")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
