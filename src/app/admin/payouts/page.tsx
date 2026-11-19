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
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  useAdminMarketplaceQuery,
  useAdminPayoutsQuery,
  useCancelAdminPayoutMutation,
  useReleaseTransfersMutation,
  useSyncAdminPayoutMutation,
} from "@/lib/queries";
import { errorMessage, formatPrice } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";

type TransferRecord = {
  id: string;
  orderCode: string;
  cook: string;
  cookId: string;
  amount: number;
  reversed: number;
  status: string;
  stripeTransferId: string | null;
  failureReason: string | null;
  createdAt: string;
};

const TRANSFER_PAGE_SIZE = 10;
const PAYOUT_PAGE_SIZE = 10;

/** Quote CSV cells and neutralise spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

function isInFlight(status: string): boolean {
  return status === "scheduled" || status === "in_transit" || status === "pending";
}

export default function AdminPayoutsPage() {
  const { t, lang, toast } = useApp();
  const { data: payouts = [] } = useAdminPayoutsQuery();
  const { data: marketplace, refetch: refetchMarketplace } =
    useAdminMarketplaceQuery();
  const releaseMutation = useReleaseTransfersMutation();
  const syncPayoutMutation = useSyncAdminPayoutMutation();
  const cancelPayoutMutation = useCancelAdminPayoutMutation();

  const transfers = (marketplace?.transfers ?? []) as TransferRecord[];
  const transferPagination = usePagination(transfers, TRANSFER_PAGE_SIZE);
  const payoutPagination = usePagination(payouts, PAYOUT_PAGE_SIZE);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const totals = useMemo(() => {
    const gross = payouts.reduce((sum, payout) => sum + (payout.gross ?? 0), 0);
    const commission = payouts.reduce(
      (sum, payout) => sum + (payout.commission ?? 0),
      0,
    );
    const net = payouts.reduce((sum, payout) => sum + (payout.net ?? 0), 0);
    const scheduled = payouts
      .filter((payout) => isInFlight(payout.status))
      .reduce((sum, payout) => sum + (payout.net ?? 0), 0);
    return { gross, commission, net, scheduled };
  }, [payouts]);

  const selected = payouts.find((payout) => payout.id === selectedId) ?? null;
  const canCancelSelected =
    Boolean(selected) &&
    selected?.status === "scheduled" &&
    !selected?.stripePayoutId;
  const pricing = marketplace?.pricing;
  const payoutPolicy = marketplace?.payoutPolicy;
  const webhookEvents = marketplace?.webhookEvents ?? [];
  const availableEuros = (marketplace?.balance?.availableCents ?? 0) / 100;
  const pendingEuros = (marketplace?.balance?.pendingCents ?? 0) / 100;
  const commissionRate = pricing
    ? Number(pricing.commissionRate ?? 0)
    : null;
  const fixedCommissionEuros = (pricing?.commissionFixedCents ?? 0) / 100;
  const serviceFeeEuros =
    pricing?.serviceFee ?? (pricing?.serviceFeeCents ?? 0) / 100;
  const inFlightCount = payouts.filter((payout) =>
    isInFlight(payout.status),
  ).length;
  const payoutInterval = payoutPolicy?.interval ?? "WEEKLY";
  const payoutAnchor =
    payoutInterval === "MONTHLY"
      ? `day ${payoutPolicy?.monthlyAnchor ?? 1}`
      : payoutInterval === "WEEKLY"
        ? payoutPolicy?.weeklyAnchor ?? "monday"
        : payoutInterval.toLowerCase();

  const runRelease = async () => {
    try {
      const result = await releaseMutation.mutateAsync();
      setRunOpen(false);
      toast(t("payoutsProcessed"), {
        description: `Released: ${result.released} · Skipped: ${result.skipped} · Failed: ${result.failed}`,
      });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  const syncSelectedPayout = async () => {
    if (!selected) return;
    try {
      await syncPayoutMutation.mutateAsync(selected.id);
      toast(t("dataRefreshed"), { description: selected.cook });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  const cancelPayout = async () => {
    if (!cancelId) return;
    try {
      await cancelPayoutMutation.mutateAsync(cancelId);
      setSelectedId(null);
      toast(t("payoutUpdated"));
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    } finally {
      setCancelId(null);
    }
  };

  const exportCsv = () => {
    const lines = [
      csvRow([
        "Payout batch",
        "Cook",
        "Period",
        "Gross",
        "Commission",
        "Net",
        "Status",
        "Stripe payout",
      ]),
      ...payouts.map((payout) =>
        csvRow([
          payout.id,
          payout.cook,
          payout.period,
          payout.gross,
          payout.commission,
          payout.net,
          payout.status,
          payout.stripePayoutId ?? "",
        ]),
      ),
      "",
      csvRow([
        "Transfer",
        "Order",
        "Cook",
        "Stripe transfer",
        "Amount",
        "Reversed",
        "Status",
      ]),
      ...transfers.map((transfer) =>
        csvRow([
          transfer.id,
          transfer.orderCode,
          transfer.cook,
          transfer.stripeTransferId ?? "",
          transfer.amount,
          transfer.reversed,
          transfer.status,
        ]),
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daarik-payouts.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(t("exportReady"));
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
              onClick={() => void refetchMarketplace()}
            >
              <RefreshCw className="size-4" />
              {t("syncStripe")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={exportCsv}
            >
              <Download className="size-4" />
              {t("exportCsv")}
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
          foot={`In transit: ${formatPrice(totals.scheduled, lang)} · ${inFlightCount} ${t("processingPayouts").toLowerCase()}`}
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
            commissionRate === null ? (
              <MoneyText value={totals.commission} compact />
            ) : (
              <span className="tabular-nums">
                {Math.round(commissionRate * 100)}%
              </span>
            )
          }
          icon={<Banknote className="size-4" />}
          accent="#b98a68"
          foot={`Earned ${formatPrice(totals.commission, lang)} · Fixed ${formatPrice(fixedCommissionEuros, lang)} · Fee ${formatPrice(serviceFeeEuros, lang)}`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <AdminCard>
            <SectionHead
              title="Order Transfers (Separate Charges & Transfers)"
              subtitle={`Released after COMPLETED + ${payoutPolicy?.holdDays ?? 7} hold days via source_transaction`}
              action={<Badge variant="olive">{transfers.length} transfers</Badge>}
            />
            <AdminTable className="mt-3">
              <TableHeader>
                <TableRow>
                  <Th>Order</Th>
                  <Th>{t("cookCol")}</Th>
                  <Th>Stripe Transfer</Th>
                  <Th>Reversed</Th>
                  <Th>{t("netCol")}</Th>
                  <Th>{t("statusCol")}</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferPagination.pageItems.length ? (
                  transferPagination.pageItems.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <Td className="font-semibold">{transfer.orderCode}</Td>
                      <Td>{transfer.cook}</Td>
                      <Td className="font-mono text-[12px] text-muted">
                        {transfer.stripeTransferId ?? "—"}
                      </Td>
                      <Td className="text-muted">
                        {transfer.reversed > 0
                          ? `−${formatPrice(transfer.reversed, lang)}`
                          : "—"}
                      </Td>
                      <Td>
                        <MoneyText value={transfer.amount} />
                      </Td>
                      <Td>
                        <Badge
                          variant={
                            transfer.status === "CREATED"
                              ? "olive"
                              : transfer.status === "FAILED" ||
                                  transfer.status === "REVERSED"
                                ? "terracotta"
                                : "saffron"
                          }
                          size="sm"
                        >
                          {transfer.status}
                        </Badge>
                      </Td>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <Td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[13.5px] text-muted"
                    >
                      No transfers recorded yet. Complete a paid order to
                      schedule a transfer.
                    </Td>
                  </TableRow>
                )}
              </TableBody>
            </AdminTable>
            {transferPagination.totalPages > 1 ? (
              <Pagination
                page={transferPagination.page}
                totalPages={transferPagination.totalPages}
                onPage={transferPagination.setPage}
                className="m-4"
              />
            ) : null}
          </AdminCard>

          <AdminCard>
            <SectionHead
              title={t("payoutBatch")}
              subtitle="Bank payouts are confirmed exclusively via Stripe webhooks (payout.paid / payout.failed)"
              action={
                <Badge variant="saffron">
                  {inFlightCount} {t("pending")}
                </Badge>
              }
            />
            <AdminTable className="mt-3">
              <TableHeader>
                <TableRow>
                  <Th>{t("payoutBatch")}</Th>
                  <Th>{t("cookCol")}</Th>
                  <Th className="hidden md:table-cell">{t("period")}</Th>
                  <Th>{t("netCol")}</Th>
                  <Th>{t("statusCol")}</Th>
                  <Th className="text-end">{t("actionCol")}</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutPagination.pageItems.length ? (
                  payoutPagination.pageItems.map((payout) => (
                    <TableRow key={payout.id}>
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <Td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[13.5px] text-muted"
                    >
                      {t("noPayouts")}
                    </Td>
                  </TableRow>
                )}
              </TableBody>
            </AdminTable>
            {payoutPagination.totalPages > 1 ? (
              <Pagination
                page={payoutPagination.page}
                totalPages={payoutPagination.totalPages}
                onPage={payoutPagination.setPage}
                className="m-4"
              />
            ) : null}
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
                  {payoutInterval} · {payoutAnchor}
                </p>
                <p className="mt-1.5 text-[13px] text-muted">
                  Hold after COMPLETED: {payoutPolicy?.holdDays ?? 7}{" "}
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
                  {pricing?.stripeFeeBearer ?? "PLATFORM"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Commission base</span>
                <span className="font-semibold text-charcoal">
                  {pricing?.commissionBase ?? "SUBTOTAL"}
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
              {webhookEvents.length ? (
                webhookEvents.slice(0, 8).map((event) => (
                  <div
                    key={event.stripeEventId}
                    className="flex items-center justify-between gap-2 py-2 text-[12.5px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono font-semibold text-charcoal">
                        {event.type}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted">
                        {event.stripeEventId}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.error
                          ? "terracotta"
                          : event.processedAt
                            ? "olive"
                            : "saffron"
                      }
                      size="sm"
                    >
                      {event.error ? "ERR" : event.processedAt ? "OK" : "PENDING"}
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
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                loading={syncPayoutMutation.isPending}
                onClick={() => void syncSelectedPayout()}
              >
                <RefreshCw className="size-4" />
                Pull Stripe status
              </Button>
              {canCancelSelected ? (
                <Button
                  variant="destructive"
                  loading={cancelPayoutMutation.isPending}
                  onClick={() => setCancelId(selected.id)}
                >
                  Cancel local payout
                </Button>
              ) : null}
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
                <div className="flex justify-between">
                  <span className="text-muted">Orders</span>
                  <span className="font-medium">{selected.ordersCount}</span>
                </div>
                {selected.arrivalDate ? (
                  <div className="flex justify-between">
                    <span className="text-muted">Arrival</span>
                    <span className="font-medium">
                      {new Date(selected.arrivalDate).toLocaleDateString(lang)}
                    </span>
                  </div>
                ) : null}
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
                    {selected.automatic
                      ? "Automatic Stripe payout"
                      : "Local scheduled payout"}{" "}
                    · no manual mark-paid
                  </p>
                  {selected.stripePayoutId ? (
                    <p className="mt-1 font-mono text-[11.5px] text-muted-soft">
                      {selected.stripePayoutId}
                    </p>
                  ) : null}
                  {selected.failureMessage ? (
                    <p className="mt-1 text-[12.5px] text-danger">
                      {selected.failureMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {canCancelSelected ? (
              <p className="rounded-xl border border-line bg-cream/60 p-3 text-[12.5px] leading-relaxed text-muted">
                This payout has not reached Stripe yet, so it can be cancelled
                locally. Cancelling is written to the audit log.
              </p>
            ) : null}
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
      <ConfirmDialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        onConfirm={cancelPayout}
        title="Cancel local payout?"
        description="This payout has no Stripe payout ID. The local schedule will be cancelled and recorded in the audit log."
        confirmLabel="Cancel payout"
        cancelLabel={t("cancel")}
        variant="destructive"
      />
    </div>
  );
}
