"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  CreditCard,
  Download,
  Landmark,
  Play,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
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
import { adminKpis, adminPayouts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

type Payout = (typeof adminPayouts)[number];
type PayoutStatus = Payout["status"];

export default function AdminPayoutsPage() {
  const { t, lang, toast } = useApp();
  const [payouts, setPayouts] = useState<Payout[]>(adminPayouts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [iban, setIban] = useState("NL91 ABNA 0417 1643 00");
  const [payoutDay, setPayoutDay] = useState("tuesday");

  const totals = useMemo(() => {
    const gross = payouts.reduce((sum, payout) => sum + payout.gross, 0);
    const commission = payouts.reduce((sum, payout) => sum + payout.commission, 0);
    const net = payouts.reduce((sum, payout) => sum + payout.net, 0);
    const scheduled = payouts
      .filter((payout) => payout.status === "scheduled")
      .reduce((sum, payout) => sum + payout.net, 0);
    const processing = payouts
      .filter((payout) => payout.status === "processing")
      .reduce((sum, payout) => sum + payout.net, 0);
    return { gross, commission, net, scheduled, processing };
  }, [payouts]);

  const selected = payouts.find((payout) => payout.id === selectedId) ?? null;

  const setStatus = (id: string, status: PayoutStatus) => {
    setPayouts((prev) =>
      prev.map((payout) => (payout.id === id ? { ...payout, status } : payout)),
    );
    toast(t("payoutUpdated"), { description: id });
    setSelectedId(null);
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("finance")}
        title={t("adminNavPayouts")}
        subtitle={t("adminPayoutsSub")}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={() =>
                toast(t("statementReady"), { description: t("statementReadyDesc") })
              }
            >
              <Download className="size-4" />
              {t("downloadStatement")}
            </Button>
            <Button size="sm" className="h-9" onClick={() => setRunOpen(true)}>
              <Play className="size-3.5" />
              {t("runPayouts")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("totalPayouts")}
          value={<MoneyText value={totals.net} compact />}
          delta="+14.2%"
          deltaLabel={t("vsLastMonth")}
          icon={<Wallet className="size-4" />}
          series={[320, 360, 340, 410, 390, 450, 430, 470]}
        />
        <KpiCard
          label={t("scheduled")}
          value={<MoneyText value={totals.scheduled} compact />}
          icon={<CalendarClock className="size-4" />}
          accent="#d9a441"
          foot={`3 ${t("cooksLabel").toLowerCase()}`}
        />
        <KpiCard
          label={t("processingPayouts")}
          value={<MoneyText value={totals.processing} compact />}
          icon={<Clock3 className="size-4" />}
          accent="#b98a68"
          foot={t("payoutDelayValue")}
        />
        <KpiCard
          label={t("commissionRevenue")}
          value={<MoneyText value={totals.commission} compact />}
          icon={<Banknote className="size-4" />}
          accent="#697653"
          delta="+9.8%"
          deltaLabel={t("vsLastMonth")}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <AdminCard className="xl:col-span-8">
          <SectionHead
            title={t("payoutBatch")}
            subtitle={t("payoutScheduleDesc")}
            action={
              <Badge variant="saffron">
                {payouts.filter((payout) => payout.status !== "paid").length} {t("pending")}
              </Badge>
            }
          />
          <AdminTable className="mt-3">
            <thead>
              <tr>
                <Th>{t("payoutBatch")}</Th>
                <Th>{t("cookCol")}</Th>
                <Th className="hidden md:table-cell">{t("period")}</Th>
                <Th className="hidden lg:table-cell">{t("grossCol")}</Th>
                <Th className="hidden lg:table-cell">{t("commissionCol")}</Th>
                <Th>{t("netCol")}</Th>
                <Th>{t("statusCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="transition hover:bg-cream/40">
                  <Td className="font-semibold">{payout.id}</Td>
                  <Td>{payout.cook}</Td>
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">
                    {payout.period}
                  </Td>
                  <Td className="hidden text-muted lg:table-cell">
                    {formatPrice(payout.gross, lang)}
                  </Td>
                  <Td className="hidden text-muted lg:table-cell">
                    −{formatPrice(payout.commission, lang)}
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
              ))}
            </tbody>
          </AdminTable>
          <div className="flex flex-col items-start justify-between gap-1 px-4 py-3 text-[12.5px] text-muted md:flex-row md:items-center md:px-5">
            <span>{t("payoutNote")}</span>
            <span className="font-semibold text-charcoal">
              {t("pendingTotal")}: {formatPrice(totals.scheduled + totals.processing, lang)}
            </span>
          </div>
        </AdminCard>

        <div className="space-y-4 xl:col-span-4">
          <AdminCard className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                  {t("nextPayout")}
                </p>
                <p className="mt-2 text-[26px] font-semibold leading-none text-charcoal">
                  {formatPrice(totals.scheduled, lang)}
                </p>
                <p className="mt-1.5 text-[13px] text-muted">
                  {t("payoutDay")}: {t("tuesday")} · 3 Nov 2026
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-olive-50 text-olive">
                <CalendarClock className="size-4" />
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: t("grossRevenue"), value: formatPrice(totals.gross, lang) },
                { label: t("commissionEarned"), value: formatPrice(totals.commission, lang) },
                { label: t("payoutDelay"), value: t("payoutDelayValue") },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-[13.5px]">
                  <span className="text-muted">{row.label}</span>
                  <span className="font-semibold text-charcoal">{row.value}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-charcoal">{t("payoutSettings")}</p>
              <Landmark className="size-4 text-muted" />
            </div>
            <label className="mt-3 block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
              {t("iban")}
            </label>
            <input
              value={iban}
              onChange={(event) => setIban(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-cream/50 px-2.5 text-[13.5px] outline-none focus:border-terracotta/50 focus:bg-white"
            />
            <label className="mt-3 block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
              {t("payoutDay")}
            </label>
            <select
              value={payoutDay}
              onChange={(event) => setPayoutDay(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-cream/50 px-2.5 text-[13.5px] outline-none focus:border-terracotta/50 focus:bg-white"
            >
              <option value="monday">{t("monday")}</option>
              <option value="tuesday">{t("tuesday")}</option>
              <option value="wednesday">{t("wednesday")}</option>
              <option value="thursday">{t("thursday")}</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => toast(t("payoutSettingsSaved"))}
            >
              {t("savePayoutSettings")}
            </Button>
          </AdminCard>

          <div className="rounded-2xl border border-dashed border-line-strong bg-white/50 p-4 text-[12.5px] leading-relaxed text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-charcoal">
              <Building2 className="size-3.5" />
              {t("marketplace")} · Daarik B.V.
            </span>
            <p className="mt-1.5">
              {t("supportEmail")}: finance@daarik.nl · {t("activeCooks")}:{" "}
              {adminKpis.activeCooks}
            </p>
          </div>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `${t("payoutBatch")} ${selected.id}` : t("payoutBatch")}
        description={selected ? `${selected.cook} · ${selected.period}` : undefined}
        footer={
          selected ? (
            <div className="flex gap-2">
              {selected.status === "scheduled" ? (
                <Button
                  className="flex-1"
                  onClick={() => setStatus(selected.id, "processing")}
                >
                  <Clock3 className="size-4" />
                  {t("markProcessing")}
                </Button>
              ) : selected.status === "processing" ? (
                <Button className="flex-1" onClick={() => setStatus(selected.id, "paid")}>
                  <Check className="size-4" />
                  {t("markPaid")}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setSelectedId(null)}
                >
                  {t("close")}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  toast(t("statementReady"), { description: selected.id });
                }}
              >
                <Download className="size-4" />
                {t("downloadStatement")}
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
                  <span className="font-medium">{formatPrice(selected.gross, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("commissionFee")}</span>
                  <span className="font-medium">−{formatPrice(selected.commission, lang)}</span>
                </div>
                <div className="flex justify-between text-[14.5px] font-semibold">
                  <span>{t("netCol")}</span>
                  <span>{formatPrice(selected.net, lang)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("bankDetails")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-charcoal">
                    {selected.cook}
                  </p>
                  <p className="text-[12.5px] tracking-wide text-muted">NL•• •••• •••• 4821</p>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-[13.5px]">
                <div className="flex justify-between">
                  <span className="text-muted">{t("accountHolder")}</span>
                  <span className="font-medium">{selected.cook}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("payoutDate")}</span>
                  <span className="font-medium">Tue 3 Nov 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("payoutDelay")}</span>
                  <span className="font-medium">{t("payoutDelayValue")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-cream/70 p-3 text-[12.5px] leading-relaxed text-muted">
              {t("payoutNote")}
            </div>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={runOpen}
        onClose={() => setRunOpen(false)}
        onConfirm={() => {
          setPayouts((prev) =>
            prev.map((payout) =>
              payout.status === "scheduled" ? { ...payout, status: "processing" } : payout,
            ),
          );
          setRunOpen(false);
          toast(t("payoutsProcessed"), {
            description: formatPrice(totals.scheduled, lang),
          });
        }}
        title={t("runPayoutsTitle")}
        description={t("runPayoutsDesc", {
          count: payouts.filter((payout) => payout.status === "scheduled").length,
          amount: formatPrice(totals.scheduled, lang),
        })}
        confirmLabel={t("runPayouts")}
        cancelLabel={t("cancel")}
        icon={<ArrowRight className="size-6" />}
      />
    </div>
  );
}
