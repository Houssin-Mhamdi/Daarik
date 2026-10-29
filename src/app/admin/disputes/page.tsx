"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  Headphones,
  MessageSquare,
  ShieldCheck,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  KpiCard,
  SectionHead,
  StatusPill,
} from "@/components/admin/admin-ui";
import { adminDisputes, adminKpis } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

type DisputeStatus = "open" | "review" | "resolved";

type Dispute = {
  id: string;
  code: string;
  customer: string;
  cook: string;
  reason: string;
  amount: number;
  status: DisputeStatus;
  opened?: string;
};

const resolvedDisputes: Dispute[] = [
  {
    id: "DSP-1024",
    code: "DR-2312",
    customer: "Sanne K.",
    cook: "Rana El Amri",
    reason: "Item missing from order",
    amount: 9.5,
    status: "resolved",
    opened: "18 Oct 2026",
  },
  {
    id: "DSP-1019",
    code: "DR-2298",
    customer: "Mehdi B.",
    cook: "Samira Khoury",
    reason: "Pickup cancelled by cook",
    amount: 24,
    status: "resolved",
    opened: "12 Oct 2026",
  },
];

type Filter = "all" | DisputeStatus;

export default function AdminDisputesPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [disputes, setDisputes] = useState<Dispute[]>([
    ...adminDisputes.map((dispute) => ({ ...dispute, opened: "28 Oct 2026", status: dispute.status as DisputeStatus })),
    ...resolvedDisputes,
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refund, setRefund] = useState("");
  const [note, setNote] = useState("");

  const counts = useMemo(
    () => ({
      all: disputes.length,
      open: disputes.filter((dispute) => dispute.status === "open").length,
      review: disputes.filter((dispute) => dispute.status === "review").length,
      resolved: disputes.filter((dispute) => dispute.status === "resolved").length,
    }),
    [disputes],
  );

  const visible = disputes.filter(
    (dispute) => filter === "all" || dispute.status === filter,
  );
  const selected = disputes.find((dispute) => dispute.id === selectedId) ?? null;

  const openDispute = (dispute: Dispute) => {
    setSelectedId(dispute.id);
    setRefund(dispute.amount.toFixed(2));
    setNote("");
  };

  const resolve = (dispute: Dispute, withRefund: boolean) => {
    setDisputes((prev) =>
      prev.map((item) =>
        item.id === dispute.id ? { ...item, status: "resolved" } : item,
      ),
    );
    setSelectedId(null);
    toast(t("disputeResolved"), {
      description: withRefund
        ? `${dispute.code} · ${t("refundIssued")} ${formatPrice(Number(refund) || 0, lang)}`
        : dispute.code,
    });
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("people")}
        title={t("adminNavDisputes")}
        subtitle={t("adminDisputesSub")}
        actions={
          <div className="flex h-9 items-center gap-2 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13px] font-semibold text-muted">
            <Clock3 className="size-3.5" />
            {t("sla")}: 24h
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("openDisputes")}
          value={counts.open}
          icon={<AlertTriangle className="size-4" />}
          accent="#b3402f"
          foot={t("needsAction")}
        />
        <KpiCard
          label={t("underReviewStatus")}
          value={counts.review}
          icon={<Clock3 className="size-4" />}
          accent="#d9a441"
          foot="1.8 days avg"
        />
        <KpiCard
          label={t("resolved")}
          value={counts.resolved + 36}
          icon={<ShieldCheck className="size-4" />}
          accent="#697653"
          foot={`${adminKpis.refundRate}% ${t("refundRate").toLowerCase()}`}
        />
        <KpiCard
          label={t("supportTickets")}
          value={18}
          icon={<Headphones className="size-4" />}
          foot={t("ordersToday").toLowerCase()}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <AdminCard className="p-3 md:p-4">
            <SegmentedTabs
              scrollable
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: "all", label: t("all"), count: counts.all },
                { value: "open", label: t("open"), count: counts.open },
                { value: "review", label: t("underReviewStatus"), count: counts.review },
                { value: "resolved", label: t("resolved"), count: counts.resolved },
              ]}
              className="min-w-max"
            />
          </AdminCard>

          {visible.map((dispute) => (
            <AdminCard key={dispute.id} className="p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      dispute.status === "resolved"
                        ? "bg-olive-50 text-olive"
                        : "bg-[#fbe9e4] text-[#a4412c]",
                    )}
                  >
                    {dispute.status === "resolved" ? (
                      <Check className="size-4" />
                    ) : (
                      <AlertTriangle className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-charcoal">{dispute.id}</p>
                      <StatusPill status={dispute.status} />
                      <Badge variant="outline">{dispute.code}</Badge>
                    </div>
                    <p className="mt-1 text-[14px] font-medium text-charcoal">{dispute.reason}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3" />
                        {dispute.customer}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UtensilsCrossed className="size-3" />
                        {dispute.cook}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {dispute.opened}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="text-[17px] font-semibold leading-none text-charcoal">
                      {formatPrice(dispute.amount, lang)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted-soft">{t("refundAmount")}</p>
                  </div>
                  {dispute.status === "resolved" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast(t("disputeResolved"), { description: dispute.id })}
                    >
                      {t("viewDetails")}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => openDispute(dispute)}>
                      {t("resolveDispute")}
                    </Button>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}

          {visible.length === 0 ? (
            <AdminCard className="px-5 py-16 text-center">
              <ShieldCheck className="mx-auto size-7 text-olive" />
              <p className="mt-3 text-[16px] font-semibold text-charcoal">{t("allCaughtUp")}</p>
              <p className="mt-1 text-[13.5px] text-muted">{t("disputesEmptyDesc")}</p>
            </AdminCard>
          ) : null}
        </div>

        <div className="space-y-4 xl:col-span-4">
          <AdminCard>
            <SectionHead title={t("resolution")} subtitle={t("disputePolicySub")} />
            <div className="space-y-3 p-4 pt-3 md:p-5 md:pt-4">
              {[
                {
                  icon: CircleDollarSign,
                  title: t("refundCustomer"),
                  desc: t("refundPolicyDesc"),
                },
                {
                  icon: MessageSquare,
                  title: t("contactBothParties"),
                  desc: t("contactBothDesc"),
                },
                {
                  icon: FileText,
                  title: t("documentOutcome"),
                  desc: t("documentOutcomeDesc"),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-charcoal">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-charcoal">{item.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-charcoal">{t("recentResolutions")}</p>
              <Badge variant="success">{t("resolved")}</Badge>
            </div>
            <div className="mt-3 space-y-2.5">
              {resolvedDisputes.map((dispute) => (
                <div key={dispute.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-charcoal">{dispute.reason}</p>
                    <p className="text-[11.5px] text-muted-soft">
                      {dispute.code} · {dispute.opened}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-charcoal">
                    {formatPrice(dispute.amount, lang)}
                  </span>
                </div>
              ))}
            </div>
          </AdminCard>

          <div className="rounded-2xl border border-dashed border-line-strong bg-white/50 p-4 text-[12.5px] leading-relaxed text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-charcoal">
              <ShieldCheck className="size-3.5 text-olive" />
              {t("disputeSlaTitle")}
            </span>
            <p className="mt-1.5">{t("disputeSlaDesc")}</p>
          </div>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `${selected.id} · ${selected.code}` : t("resolveDispute")}
        description={selected?.reason}
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => resolve(selected, false)}
              >
                {t("closeDispute")}
              </Button>
              <Button className="flex-1" onClick={() => resolve(selected, true)}>
                <CircleDollarSign className="size-4" />
                {t("refundCustomer")}
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: t("customerName"), value: selected.customer },
                { label: t("cookName"), value: selected.cook },
                { label: t("orderRefLabel"), value: selected.code },
                { label: t("reportedBy"), value: selected.customer },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-line bg-white p-3">
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                    {row.label}
                  </p>
                  <p className="mt-1 truncate text-[13.5px] font-semibold text-charcoal">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("disputeReason")}
              </p>
              <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-charcoal">
                {selected.reason}
              </p>
              <p className="mt-3 rounded-lg bg-cream/70 p-2.5 text-[12.5px] leading-relaxed text-muted">
                {t("disputeCustomerNote")}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("refundAmount")}
                </p>
                <span className="text-[12.5px] text-muted">
                  {t("orderTotal")}: {formatPrice(selected.amount, lang)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cream-100 text-[14px] font-semibold">
                  €
                </span>
                <input
                  value={refund}
                  onChange={(event) => setRefund(event.target.value)}
                  inputMode="decimal"
                  className="h-10 flex-1 rounded-lg border border-line bg-cream/40 px-3 text-[15px] font-semibold outline-none focus:border-terracotta/50 focus:bg-white"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                {[0.5, 1].map((fraction) => (
                  <button
                    key={fraction}
                    type="button"
                    onClick={() => setRefund((selected.amount * fraction).toFixed(2))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[12px] font-semibold transition",
                      Number(refund) === Number((selected.amount * fraction).toFixed(2))
                        ? "border-terracotta bg-terracotta-50 text-terracotta-700"
                        : "border-line text-muted hover:border-line-strong",
                    )}
                  >
                    {fraction === 1 ? t("fullRefund") : t("halfRefund")} ·{" "}
                    {formatPrice(selected.amount * fraction, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("internalNotes")}
              </p>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder={t("resolutionNotePlaceholder")}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-cream/40 p-2.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-soft focus:border-terracotta/50 focus:bg-white"
              />
              <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-soft">
                <Check className="size-3 text-olive" />
                {t("visibleToTeam")}
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
