"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  Play,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  KpiCard,
  MoneyText,
  SectionHead,
  StatusPill,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  useAdminMarketplaceQuery,
  useAdminPayoutsQuery,
  useReleaseTransfersMutation,
  useSyncAdminPayoutMutation,
} from "@/lib/queries";
import { errorMessage, formatPrice } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";

export default function AdminPayoutsPage() {
  const { t, lang, toast } = useApp();
  const { data: payouts = [] } = useAdminPayoutsQuery();
  const payoutPagination = usePagination(payouts, 10);
  const { data: marketplace, refetch: refetchMarketplace } =
    useAdminMarketplaceQuery();
  const releaseMutation = useReleaseTransfersMutation();
  const syncPayoutMutation = useSyncAdminPayoutMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const totals = useMemo(() => {
    const gross = payouts.reduce((sum, p) => sum + (p.gross ?? 0), 0);
    const commission = payouts.reduce((sum, p) => sum + (p.commission ?? 0), 0);
    const net = payouts.reduce((sum, p) => sum + (p.net ?? 0), 0);
    const scheduled = payouts
      .filter((p) => (p.status as string) !== "paid")
      .reduce((sum, p) => sum + (p.net ?? 0), 0);
    return { gross, commission, net, scheduled };
  }, [payouts]);

  const selected = payouts.find((p) => p.id === selectedId) ?? null;
  const availableEuros = (marketplace?.balance?.availableCents ?? 0) / 100;
  const pendingEuros = (marketplace?.balance?.pendingCents ?? 0) / 100;

  const runRelease = async () => {
    try {
      const res = await releaseMutation.mutateAsync();
      setRunOpen(false);
      toast(t("payoutsProcessed"), {
        description: `Released: ${res.released} · Skipped: ${res.skipped} · Failed: ${res.failed}`,
      });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  const syncSelectedPayout = async (id: string) => {
    try {
      await syncPayoutMutation.mutateAsync(id);
      toast(t("stripeSynced"), { description: id });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("finance")}
        title="Stripe Marketplace Payments"
        subtitle={t("adminPayoutsSub")}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={() => refetchMarketplace()}
            >
              <RefreshCw className="size-4" />
              {t("syncStripe")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={() =>
                toast(t("statementReady"), {
                  description: t("statementReadyDesc"),
                })
              }
            >
              <Download className="size-4" />
              {t("downloadStatement")}
            </Button>
            <Button size="sm" className="h-9" onClick={() => setRunOpen(true)}>
              <Play className="size-3.5" />
              Release Eligible Earnings
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Platform Available (Stripe)"
          value={<MoneyText value={availableEuros} compact />}
          icon={<Wallet className="size-4" />}
          foot={`Pending: ${formatPrice(pendingEuros, lang)}`}
        />
        <KpiCard
          label={t("totalPayouts")}
          value={<MoneyText value={totals.net} compact />}
          icon={<CalendarClock className="size-4" />}
          accent="#d9a441"
          foot={`In transit: ${formatPrice(totals.scheduled, lang)}`}
        />
        <KpiCard
          label="Cook Onboarding Readiness"
          value={`${marketplace?.readiness.ready ?? 0} ready`}
          icon={<ShieldCheck className="size-4" />}
          accent="#697653"
          foot={`Blocked: ${marketplace?.readiness.blocked ?? 0} · Not started: ${marketplace?.readiness.notStarted ?? 0}`}
        />
        <KpiCard
          label={t("commissionRevenue")}
          value={
            <MoneyText
              value={
                marketplace?.pricing
                  ? marketplace.pricing.commissionRate * 100
                  : totals.commission
              }
              compact={false}
            />
          }
          icon={<Banknote className="size-4" />}
          accent="#b98a68"
          foot={`Commission ${Math.round((marketplace?.pricing.commissionRate ?? 0.15) * 100)}% + ${formatPrice(marketplace?.pricing.serviceFee ?? 1.5, lang)} fee`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          {/* Transfers (order earnings release) */}
          <AdminCard>
            <SectionHead
              title="Order Transfers (Separate Charges & Transfers)"
              subtitle={`Released after COMPLETED + ${marketplace?.payoutPolicy.holdDays ?? 7} hold days via source_transaction`}
              action={
                <Badge variant="olive">
                  {marketplace?.transfers.length ?? 0} transfers
                </Badge>
              }
            />
            <AdminTable className="mt-3">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>{t("cookCol")}</Th>
                  <Th>Stripe Transfer</Th>
                  <Th>Reversed</Th>
                  <Th>{t("netCol")}</Th>
                  <Th>{t("statusCol")}</Th>
                </tr>
              </thead>
              <tbody>
                {marketplace?.transfers.length ? (
                  marketplace.transfers.map((tr) => (
                    <tr key={tr.id} className="transition hover:bg-cream/40">
                      <Td className="font-semibold">{tr.orderCode}</Td>
                      <Td>{tr.cook}</Td>
                      <Td className="font-mono text-[12px] text-muted">
                        {tr.stripeTransferId ?? "—"}
                      </Td>
                      <Td className="text-muted">
                        {tr.reversed > 0 ? `−${formatPrice(tr.reversed, lang)}` : "—"}
                      </Td>
                      <Td>
                        <MoneyText value={tr.amount} />
                      </Td>
                      <Td>
                        <Badge
                          variant={
                            tr.status === "CREATED"
                              ? "olive"
                              : tr.status === "FAILED" || tr.status === "REVERSED"
                                ? "terracotta"
                                : "saffron"
                          }
                          size="sm"
                        >
                          {tr.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[13.5px] text-muted">
                      No transfers recorded yet. Complete a paid order to schedule a transfer.
                    </td>
                  </tr>
                )}
              </tbody>
            </AdminTable>
            {payouts.length > 10 ? (
              <Pagination
                page={payoutPagination.page}
                totalPages={payoutPagination.totalPages}
                onPage={payoutPagination.setPage}
                className="mt-4"
              />
            ) : null}
          </AdminCard>

          {/* Bank payouts */}
          <AdminCard>
            <SectionHead
              title={t("payoutBatch")}
              subtitle="Bank payouts are confirmed exclusively via Stripe webhooks (payout.paid / payout.failed)"
              action={
                <Badge variant="saffron">
                  {payouts.filter((p) => p.status !== "paid").length}{" "}
                  {t("pending")}
                </Badge>
              }
            />
            <AdminTable className="mt-3">
              <thead>
                <tr>
                  <Th>{t("payoutBatch")}</Th>
                  <Th>{t("cookCol")}</Th>
                  <Th className="hidden md:table-cell">{t("period")}</Th>
                  <Th>{t("netCol")}</Th>
                  <Th>{t("statusCol")}</Th>
                  <Th className="text-end">{t("actionCol")}</Th>
                </tr>
              </thead>
              <tbody>
                {payouts.length ? (
                  payoutPagination.pageItems.map((payout) => (
                    <tr key={payout.id} className="transition hover:bg-cream/40">
                      <Td className="font-semibold">{payout.id}</Td>
                      <Td>{payout.cook}</Td>
                      <Td className="hidden whitespace-nowrap text-muted md:table-cell">
                        {payout.period}
                      </Td>
                      <Td>
                        <MoneyText value={payout.net} />
                      </Td>
                      <Td>
                        <StatusPill status={payout.status} />
                      </Td>
                      <Td className="text-end">
                        <button
                          type="button"
                          onClick={() => setSelectedId(payout.id)}
                          className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-charcoal transition hover:bg-cream-100"
                        >
                          {t("viewDetails")}
                        </button>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[13.5px] text-muted">
                      {t("noPayouts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </AdminTable>
          </AdminCard>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <AdminCard className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                  Payout Policy & Architecture
                </p>
                <p className="mt-2 text-[22px] font-semibold leading-none text-charcoal">
                  {marketplace?.payoutPolicy.interval ?? "WEEKLY"} ·{" "}
                  {marketplace?.payoutPolicy.weeklyAnchor ?? "monday"}
                </p>
                <p className="mt-1.5 text-[13px] text-muted">
                  Hold after COMPLETED: {marketplace?.payoutPolicy.holdDays ?? 7}{" "}
                  days
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-olive-50 text-olive">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <div className="mt-4 space-y-2 text-[13.5px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Charge model</span>
                <span className="font-semibold text-charcoal">
                  Separate charges & transfers
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Merchant of record</span>
                <span className="font-semibold text-charcoal">
                  Cook (on_behalf_of)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Stripe fee bearer</span>
                <span className="font-semibold text-charcoal">
                  {marketplace?.pricing.stripeFeeBearer ?? "PLATFORM"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Commission base</span>
                <span className="font-semibold text-charcoal">
                  {marketplace?.pricing.commissionBase ?? "SUBTOTAL"}
                </span>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-4 md:p-5">
            <p className="text-[15px] font-semibold text-charcoal">
              Verified Webhook Log
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Idempotent Stripe events (signature-verified)
            </p>
            <div className="mt-3 divide-y divide-line/70">
              {marketplace?.webhookEvents.length ? (
                marketplace.webhookEvents.slice(0, 8).map((ev) => (
                  <div
                    key={ev.stripeEventId}
                    className="flex items-center justify-between gap-2 py-2 text-[12.5px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono font-semibold text-charcoal">
                        {ev.type}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted">
                        {ev.stripeEventId}
                      </p>
                    </div>
                    <Badge
                      variant={
                        ev.error
                          ? "terracotta"
                          : ev.processedAt
                            ? "olive"
                            : "saffron"
                      }
                      size="sm"
                    >
                      {ev.error ? "ERR" : ev.processedAt ? "OK" : "PENDING"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-[12.5px] text-muted">
                  No webhook events received yet.
                </p>
              )}
            </div>
          </AdminCard>

          <div className="rounded-2xl border border-dashed border-line-strong bg-white/50 p-4 text-[12.5px] leading-relaxed text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-charcoal">
              <Building2 className="size-3.5" />
              {t("marketplace")} · Daarik
            </span>
            <p className="mt-1.5">
              Customer funds are held in Stripe until release — never in a
              Daarik wallet or ordinary bank account.
            </p>
          </div>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={
          selected ? `${t("payoutBatch")} ${selected.id}` : t("payoutBatch")
        }
        description={
          selected ? `${selected.cook} · ${selected.period}` : undefined
        }
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                loading={syncPayoutMutation.isPending}
                onClick={() => syncSelectedPayout(selected.id)}
              >
                <RefreshCw className="size-4" />
                {t("syncStripe")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedId(null)}
              >
                {t("close")}
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    {t("netCol")}
                  </p>
                  <p className="mt-1 text-[28px] font-semibold leading-none text-charcoal">
                    {formatPrice(selected.net, lang)}
                  </p>
                </div>
                <StatusPill status={selected.status} />
              </div>
              <div className="mt-3 space-y-1.5 border-t border-line pt-2.5 text-[13.5px]">
                <div className="flex justify-between">
                  <span className="text-muted">{t("grossRevenue")}</span>
                  <span className="font-medium">
                    {formatPrice(selected.gross, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("commissionFee")}</span>
                  <span className="font-medium">
                    −{formatPrice(selected.commission, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-[14.5px] font-semibold">
                  <span>{t("netCol")}</span>
                  <span>{formatPrice(selected.net, lang)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-charcoal">
                    {selected.cook}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    Managed by Stripe Connect (no manual mark-paid)
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={runOpen}
        onClose={() => setRunOpen(false)}
        onConfirm={runRelease}
        title="Release Eligible Order Earnings"
        description="Creates Stripe Transfers (linked via source_transaction) for all completed orders whose hold period has elapsed."
        confirmLabel="Release Now"
        cancelLabel={t("cancel")}
        icon={<ArrowRight className="size-6" />}
      />
    </div>
  );
}
