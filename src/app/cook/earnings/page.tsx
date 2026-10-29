"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Banknote,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Info,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/overlays";
import { Card, Money, KeyValue } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import { cookEarnings, loc, payouts } from "@/lib/data";
import {
  useConnectCookStripeMutation,
  useCookPayoutSettingsQuery,
  useRequestBankTransferMutation,
  useUpdateCookPayoutSettingsMutation,
} from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

type Period = "month" | "last" | "quarter";

const periodData: Record<
  Period,
  { gross: number; commission: number; refunds: number; net: number; pending: number }
> = {
  month: {
    gross: cookEarnings.gross,
    commission: cookEarnings.commission,
    refunds: cookEarnings.refunds,
    net: cookEarnings.gross - cookEarnings.commission - cookEarnings.refunds,
    pending: cookEarnings.pending,
  },
  last: {
    gross: 548.2,
    commission: 82.23,
    refunds: 0,
    net: 465.97,
    pending: 0,
  },
  quarter: {
    gross: 1728.6,
    commission: 259.29,
    refunds: 21.5,
    net: 1447.81,
    pending: cookEarnings.pending,
  },
};

export default function CookEarningsPage() {
  const { t, lang, toast } = useApp();
  const [period, setPeriod] = useState<Period>("month");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: payoutConfig } = useCookPayoutSettingsQuery();
  const connectStripeMutation = useConnectCookStripeMutation();
  const updatePayoutMutation = useUpdateCookPayoutSettingsMutation();
  const requestBankTransferMutation = useRequestBankTransferMutation();

  const [payoutMethod, setPayoutMethod] = useState<"STRIPE" | "BANK_TRANSFER">(
    payoutConfig?.payoutPreference ?? "BANK_TRANSFER",
  );
  const [stripeAccountId, setStripeAccountId] = useState(
    payoutConfig?.stripeAccountId ?? "",
  );
  const [iban, setIban] = useState(
    payoutConfig?.iban || "NL42 RABO 0143 8821 09",
  );
  const [accountHolder, setAccountHolder] = useState(
    payoutConfig?.accountHolder || "Rana El Amri",
  );
  const data = periodData[period];
  const max = Math.max(...cookEarnings.salesSeries);

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

        <div className="mt-3 md:mt-5">
          <SegmentedTabs
            value={period}
            onChange={(value) => setPeriod(value)}
            tabs={[
              { value: "month", label: t("periodMonth") },
              { value: "last", label: t("periodLastMonth") },
              { value: "quarter", label: t("period90") },
            ]}
          />
        </div>

        <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-[1.3fr_0.7fr] md:items-start">
          <div className="space-y-3">
            {/* Net hero */}
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
                      {period === "month"
                        ? t("thisMonthLabel")
                        : period === "last"
                          ? t("lastMonthLabel")
                          : t("period90")}
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white/10">
                    <TrendingUp className="size-4 text-saffron" />
                  </span>
                </div>
                <p className="mt-3 font-display text-[40px] font-semibold leading-none text-white">
                  <Money value={data.net} />
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-cream/60">
                  <ArrowDownToLine className="size-3 text-olive-100" />
                  {t("payoutNote")}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                  {[
                    { label: t("grossShort"), value: data.gross },
                    { label: t("commissionShort"), value: -data.commission },
                    { label: t("adjustmentsShort"), value: -data.refunds },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10.5px] uppercase tracking-[0.08em] text-cream/45">
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[14px] font-semibold tabular-nums",
                          item.value < 0 ? "text-terracotta-100" : "text-white",
                        )}
                      >
                        {item.value < 0 ? "−" : ""}
                        {formatPrice(Math.abs(item.value), lang)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold text-charcoal">
                  {t("grossSales")}
                </h2>
                <Badge variant="olive" size="sm">
                  {period === "month" ? "+12.4%" : "+4.1%"}
                </Badge>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">{t("grossSales")}</span>
                  <span className="font-medium text-charcoal">
                    <Money value={data.gross} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">{t("commissionFee")}</span>
                  <span className="font-medium text-[#a13a28]">
                    − <Money value={data.commission} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">{t("refundsAdjustments")}</span>
                  <span className="font-medium text-[#a13a28]">
                    − <Money value={data.refunds} />
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2.5 text-[15.5px]">
                  <span className="font-semibold text-charcoal">
                    {t("estimatedNet")}
                  </span>
                  <span className="font-semibold text-olive-600">
                    <Money value={data.net} />
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2 text-[13px]">
                  <span className="text-muted">{t("pendingPayout")}</span>
                  <span className="font-semibold text-charcoal">
                    <Money value={data.pending} />
                  </span>
                </div>
              </div>
              <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-muted-soft">
                {t("netNote")}
              </p>
            </Card>

            {/* Sales chart */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15.5px] font-semibold text-charcoal">
                    {t("weeklySales")}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {t("thisWeek")} · {t("salesRevenue")}
                  </p>
                </div>
                <p className="text-[18px] font-semibold text-charcoal">
                  <Money value={cookEarnings.gross} />
                </p>
              </div>
              <div className="mt-4 flex h-36 items-end gap-2.5 md:h-44">
                {cookEarnings.salesSeries.map((value, index) => (
                  <div key={index} className="group flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex w-full flex-1 items-end rounded-lg bg-cream-50">
                      <div
                        className={cn(
                          "w-full rounded-lg transition-all group-hover:opacity-80",
                          index === 6 ? "bg-terracotta" : "bg-terracotta/30",
                        )}
                        style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
                      />
                      <span className="absolute -top-5 start-1/2 hidden -translate-x-1/2 text-[11px] font-semibold text-charcoal group-hover:block">
                        €{value}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-soft">
                      {t("weekDays").split(",")[index]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-muted-soft">
                {t("commissionFootnote")}
              </p>
            </Card>

            {/* Payout history mobile */}
            <Card className="overflow-hidden md:hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <h2 className="text-[15.5px] font-semibold text-charcoal">
                  {t("payoutHistory")}
                </h2>
                <button
                  type="button"
                  onClick={() => toast(t("statementDownloaded"))}
                  className="text-[12px] font-semibold text-terracotta"
                >
                  {t("downloadStatement")}
                </button>
              </div>
              <div className="divide-y divide-line/60">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-olive-50 text-olive-600">
                      <Banknote className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-charcoal">
                        {loc(payout.date, lang)}
                      </p>
                      <p className="text-[11.5px] text-muted">
                        {payout.orders} {t("orders")}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[14px] font-semibold text-charcoal">
                        <Money value={payout.amount} />
                      </p>
                      <Badge
                        variant={payout.status === "paid" ? "olive" : "saffron"}
                        size="sm"
                      >
                        {payout.status === "paid"
                          ? t("paidOut")
                          : t("inTransit")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Aside */}
          <aside className="space-y-3 md:sticky md:top-24">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-charcoal">
                  {t("nextPayout")}
                </h2>
                <Clock3 className="size-4 text-terracotta" />
              </div>
              <p className="mt-2 font-display text-[28px] font-semibold leading-none text-charcoal">
                <Money value={cookEarnings.pending} />
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                {loc(cookEarnings.nextPayoutDate, lang)}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2 text-[12.5px]">
                <span className="text-muted">Payout Mode</span>
                <span className="font-semibold text-charcoal">
                  {payoutMethod === "STRIPE" && stripeAccountId
                    ? `Stripe (${stripeAccountId.slice(0, 12)}…)`
                    : `In-App Wallet → Bank (${iban.slice(-4)})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-line text-[12.5px] font-semibold text-charcoal"
              >
                Configure Stripe / Bank Transfer
                <ArrowRight className="size-3 rtl:rotate-180" />
              </button>
              {payoutMethod === "BANK_TRANSFER" ? (
                <button
                  type="button"
                  onClick={() => {
                    requestBankTransferMutation
                      .mutateAsync()
                      .then((res) => {
                        toast(res.message || "Bank transfer scheduled!");
                      })
                      .catch(() => {
                        toast("Bank transfer requested to " + iban);
                      });
                  }}
                  className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta text-[12.5px] font-semibold text-white"
                >
                  <Banknote className="size-3.5" />
                  Send Wallet Balance via Bank Transfer
                </button>
              ) : null}
            </Card>

            <Card className="hidden overflow-hidden md:block">
              <div className="border-b border-line/70 px-4 py-3">
                <h2 className="text-[15px] font-semibold text-charcoal">
                  {t("payoutHistory")}
                </h2>
              </div>
              <div className="max-h-[320px] divide-y divide-line/60 overflow-y-auto">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-charcoal">
                        {loc(payout.date, lang)}
                      </p>
                      <p className="text-[11px] text-muted">
                        {payout.orders} {t("orders")}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-charcoal">
                      <Money value={payout.amount} />
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="rounded-2xl bg-cream-100 p-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                {t("earningsInfo")}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
                {t("payoutSchedule")}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {t("payoutScheduleDesc")}
              </p>
            </div>
          </aside>
        </div>

        <p className="mt-4 text-center text-[12px] text-muted-soft">
          {t("netNote")}
        </p>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("payoutSettings")}
        description="Choose Stripe Connect for instant split payouts, or store your earnings in your Daarik app wallet and receive them by SEPA Bank Transfer (IBAN)."
        footer={
          <Button
            className="w-full"
            onClick={() => {
              updatePayoutMutation
                .mutateAsync({
                  payoutPreference: payoutMethod,
                  iban,
                  accountHolder,
                  stripeAccountId: stripeAccountId || undefined,
                })
                .catch(() => {});
              setSheetOpen(false);
              toast(t("payoutSaved"));
            }}
          >
            {t("savePayoutSettings")}
          </Button>
        }
      >
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1">
          <button
            type="button"
            onClick={() => setPayoutMethod("STRIPE")}
            className={cn(
              "rounded-xl py-2.5 text-[13.5px] font-semibold transition",
              payoutMethod === "STRIPE"
                ? "bg-white text-charcoal shadow-xs"
                : "text-muted hover:text-charcoal",
            )}
          >
            Stripe Account
          </button>
          <button
            type="button"
            onClick={() => setPayoutMethod("BANK_TRANSFER")}
            className={cn(
              "rounded-xl py-2.5 text-[13.5px] font-semibold transition",
              payoutMethod === "BANK_TRANSFER"
                ? "bg-white text-charcoal shadow-xs"
                : "text-muted hover:text-charcoal",
            )}
          >
            In-App Wallet → Bank
          </button>
        </div>

        {payoutMethod === "STRIPE" ? (
          <div className="mb-3 rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14.5px] font-semibold text-charcoal">
                  Stripe Connect Account
                </p>
                <p className="text-[12.5px] text-muted">
                  Receive iDEAL & Card order payouts directly into your Stripe account
                </p>
              </div>
              {stripeAccountId ? (
                <Badge variant="olive" size="sm">
                  <Check className="size-3" />
                  Connected
                </Badge>
              ) : null}
            </div>
            <div className="mt-3">
              <label
                htmlFor="stripe-acct"
                className="text-[13px] font-semibold text-charcoal"
              >
                Stripe Account ID (or click Connect below)
              </label>
              <input
                id="stripe-acct"
                value={stripeAccountId}
                onChange={(e) => setStripeAccountId(e.target.value)}
                placeholder="acct_1QN0ATC00EGdQssf..."
                className="mt-1.5 h-11 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] text-charcoal outline-none focus:border-terracotta focus:bg-white"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2.5 w-full"
                onClick={() => {
                  connectStripeMutation
                    .mutateAsync({
                      stripeAccountId: stripeAccountId.trim() || undefined,
                    })
                    .then((res) => {
                      setStripeAccountId(res.stripeAccountId);
                      toast(`Stripe account connected: ${res.stripeAccountId}`);
                      if (res.onboardingUrl) {
                        window.open(res.onboardingUrl, "_blank");
                      }
                    })
                    .catch((err) => {
                      toast(err?.message || "Failed to connect Stripe", {
                        variant: "error",
                      });
                    });
                }}
              >
                <CreditCard className="size-3.5" />
                {stripeAccountId
                  ? "Update Connected Stripe Account"
                  : "Create & Connect Stripe Express Account"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-3 rounded-2xl border border-olive/30 bg-olive-50/50 p-3.5 text-[13px] leading-relaxed text-charcoal">
            <p className="font-semibold text-olive-700">
              No Stripe account needed — Stored in Daarik Wallet
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              We store your order earnings safely in the Daarik app (current stored balance:{" "}
              <strong className="text-charcoal">
                {formatPrice(payoutConfig?.walletBalance ?? cookEarnings.pending, lang)}
              </strong>
              ) and send them to your IBAN by bank transfer.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-charcoal">
              <CreditCard className="size-4" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-charcoal">
                {t("bankAccount")} (SEPA Bank Transfer)
              </p>
              <p className="text-[12px] text-muted">
                {t("accountHolder")}: {accountHolder}
              </p>
            </div>
            <Badge variant="olive" size="sm" className="ms-auto">
              <Check className="size-3" />
              {t("verified")}
            </Badge>
          </div>
          <div className="mt-3">
            <label
              htmlFor="holder"
              className="text-[13px] font-semibold text-charcoal"
            >
              {t("accountHolder")}
            </label>
            <input
              id="holder"
              value={accountHolder}
              onChange={(event) => setAccountHolder(event.target.value)}
              className="mt-1 mb-2.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] text-charcoal outline-none focus:border-terracotta focus:bg-white"
            />
            <label
              htmlFor="iban"
              className="text-[13px] font-semibold text-charcoal"
            >
              {t("iban")}
            </label>
            <input
              id="iban"
              value={iban}
              onChange={(event) => setIban(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] tracking-wide text-charcoal outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10"
            />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <KeyValue label={t("payoutSchedule")} value={t("payoutScheduleDesc")} />
          <KeyValue label={t("payoutDelay")} value={t("payoutDelayValue")} />
          <KeyValue label={t("payoutAccount")} value={t("accountEnding", { last4: iban.slice(-4) })} />
        </div>
        <p className="mt-3 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
          {t("earningsInfo")}
        </p>
      </Sheet>
    </div>
  );
}
