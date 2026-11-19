"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageSquare,
  ShieldCheck,
  Upload,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  KpiCard,
  SectionHead,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  useAdminDisputeQuery,
  useAdminDisputesPaginatedQuery,
  useAdminResolveDisputeMutation,
  useUploadAdminDisputeEvidenceMutation,
  type AdminDisputeRecord,
} from "@/lib/queries";
import type { AdminDisputeEvidence, AdminDisputeTimelineEvent } from "@/lib/api";
import { cn, errorMessage, formatPrice } from "@/lib/utils";

type Filter = "all" | "open" | "review" | "resolved";
const PAGE_SIZE = 15;

/** Only render links that cannot execute script in the browser. */
function safeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, typeof window === "undefined" ? "https://example.com" : window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function timelineText(event: AdminDisputeTimelineEvent): string {
  return (
    event.label ??
    event.action ??
    event.description ??
    event.message ??
    event.note ??
    event.type ??
    "Update"
  );
}

function timelineTime(event: AdminDisputeTimelineEvent): string {
  const value = event.at ?? event.createdAt ?? event.timestamp;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function evidenceName(evidence: AdminDisputeEvidence, index: number): string {
  return evidence.name ?? evidence.fileName ?? evidence.filename ?? `Evidence ${index + 1}`;
}

export default function AdminDisputesPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refund, setRefund] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const { data: paginated, isPending, isError } = useAdminDisputesPaginatedQuery({
    status: filter === "all" ? undefined : filter,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const { data: detail, isPending: detailPending } = useAdminDisputeQuery(selectedId ?? "");
  const resolveDisputeMutation = useAdminResolveDisputeMutation();
  const uploadEvidence = useUploadAdminDisputeEvidenceMutation(selectedId ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filter]);

  const disputes = useMemo(() => paginated?.items ?? [], [paginated]);
  const total = paginated?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const serverCounts = paginated?.counts;
  const counts = useMemo(
    () => ({
      all: serverCounts?.all ?? total,
      open: serverCounts?.open ?? disputes.filter((d) => d.status === "open").length,
      review:
        serverCounts?.review ?? disputes.filter((d) => d.status === "review").length,
      resolved:
        serverCounts?.resolved ??
        disputes.filter((d) => d.status === "resolved" || d.status === "won" || d.status === "lost")
          .length,
    }),
    [disputes, serverCounts, total],
  );

  const selectedRow = disputes.find((d) => d.id === selectedId) ?? null;
  const selected: AdminDisputeRecord | null = detail ?? selectedRow;
  const parsedRefund = Number(refund);
  const refundValid =
    Boolean(selected) &&
    Number.isFinite(parsedRefund) &&
    parsedRefund > 0 &&
    parsedRefund <= (selected?.amount ?? 0);

  const openDispute = (dispute: AdminDisputeRecord) => {
    setSelectedId(dispute.id);
    setRefund(dispute.amount.toFixed(2));
    setNote("");
    setEvidenceFile(null);
  };

  const closeSheet = () => {
    setSelectedId(null);
    setEvidenceFile(null);
  };

  const submitResolution = async (options: {
    status?: string;
    withRefund?: boolean;
  }) => {
    if (!selected) return;
    if (options.withRefund && !refundValid) return;
    try {
      await resolveDisputeMutation.mutateAsync({
        id: selected.id,
        ...(options.status ? { status: options.status } : {}),
        ...(options.withRefund ? { refundAmount: parsedRefund } : {}),
        resolutionNote: note.trim() || undefined,
      });
      closeSheet();
      toast(t("disputeResolved"), {
        description: options.withRefund
          ? `${selected.code} · ${t("refundIssued")} ${formatPrice(parsedRefund, lang)}`
          : selected.code,
      });
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const upload = async () => {
    if (!evidenceFile || !selected) return;
    try {
      await uploadEvidence.mutateAsync(evidenceFile);
      setEvidenceFile(null);
      toast(t("savedSettingsToast"));
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
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
        />
        <KpiCard
          label={t("resolved")}
          value={counts.resolved}
          icon={<ShieldCheck className="size-4" />}
          accent="#697653"
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

          {isError ? (
            <AdminCard className="px-5 py-8 text-center text-sm text-danger">
              <p role="alert">{t("loadError")}</p>
            </AdminCard>
          ) : isPending ? (
            <AdminCard className="px-5 py-8 text-center text-sm text-muted">
              {t("loading")}
            </AdminCard>
          ) : disputes.length === 0 ? (
            <AdminCard className="px-5 py-16 text-center">
              <ShieldCheck className="mx-auto size-7 text-olive" />
              <p className="mt-3 text-[16px] font-semibold text-charcoal">{t("allCaughtUp")}</p>
              <p className="mt-1 text-[13.5px] text-muted">{t("disputesEmptyDesc")}</p>
            </AdminCard>
          ) : (
            disputes.map((dispute) => (
              <AdminCard key={dispute.id} className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        dispute.status === "resolved" ||
                          dispute.status === "won" ||
                          dispute.status === "lost"
                          ? "bg-olive-50 text-olive"
                          : "bg-[#fbe9e4] text-[#a4412c]",
                      )}
                    >
                      {dispute.status === "resolved" || dispute.status === "won" ? (
                        <Check className="size-4" />
                      ) : (
                        <AlertTriangle className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold text-charcoal">{dispute.code}</p>
                        <StatusPill status={dispute.status} />
                        <Badge variant="outline">{dispute.reason}</Badge>
                      </div>
                      <p className="mt-1 text-[14px] font-medium text-charcoal">
                        {dispute.customerNote || t("disputeCustomerNote")}
                      </p>
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
                      <p className="mt-1 text-[11.5px] text-muted-soft">
                        {t("refundAmount")}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openDispute(dispute)}>
                      {t("viewDetails")}
                    </Button>
                  </div>
                </div>
              </AdminCard>
            ))
          )}

          {totalPages > 1 ? (
            <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-4" />
          ) : null}
          <p className="px-1 text-[12.5px] text-muted-soft">
            {t("showingResults", { shown: disputes.length, total: counts.all })}
          </p>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <AdminCard>
            <SectionHead title={t("resolution")} subtitle={t("disputePolicySub")} />
            <div className="space-y-3 p-4 pt-3 md:p-5 md:pt-4">
              {[
                { icon: CircleDollarSign, title: t("refundCustomer"), desc: t("refundPolicyDesc") },
                { icon: MessageSquare, title: t("contactBothParties"), desc: t("contactBothDesc") },
                { icon: FileText, title: t("documentOutcome"), desc: t("documentOutcomeDesc") },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-charcoal">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-charcoal">{item.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                        {item.desc}
                      </p>
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
              {disputes
                .filter((d) => d.status === "resolved" || d.status === "won" || d.status === "lost")
                .slice(0, 4)
                .map((dispute) => (
                  <button
                    type="button"
                    key={dispute.id}
                    onClick={() => openDispute(dispute)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg p-1 text-start text-[13px] transition hover:bg-cream/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-charcoal">{dispute.reason}</p>
                      <p className="text-[11.5px] text-muted-soft">
                        {dispute.code} · {dispute.opened}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-charcoal">
                      {formatPrice(dispute.amount, lang)}
                    </span>
                  </button>
                ))}
              {disputes.every((d) => d.status === "open" || d.status === "review") ? (
                <p className="py-2 text-[12.5px] text-muted">{t("noResults")}</p>
              ) : null}
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
        onClose={closeSheet}
        title={selected ? `${selected.code} · ${selected.reason}` : t("resolveDispute")}
        description={selected?.customerNote ?? undefined}
        className="md:max-w-xl"
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {selected.status === "open" ? (
                <Button
                  variant="secondary"
                  className="flex-1"
                  loading={resolveDisputeMutation.isPending}
                  onClick={() => void submitResolution({ status: "review" })}
                >
                  <Clock3 className="size-4" />
                  {t("underReviewStatus")}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="flex-1"
                loading={resolveDisputeMutation.isPending}
                onClick={() => void submitResolution({ status: "resolved" })}
              >
                {t("closeDispute")}
              </Button>
              <Button
                className="flex-1"
                loading={resolveDisputeMutation.isPending}
                disabled={!refundValid}
                onClick={() => void submitResolution({ withRefund: true, status: "resolved" })}
              >
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("disputeReason")}
                </p>
                <StatusPill status={selected.status} />
              </div>
              <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-charcoal">
                {selected.reason}
              </p>
              <p className="mt-3 rounded-lg bg-cream/70 p-2.5 text-[12.5px] leading-relaxed text-muted">
                {selected.customerNote || t("disputeCustomerNote")}
              </p>
              {selected.evidenceDueBy ? (
                <p className="mt-2 text-[12px] text-muted">
                  Evidence due: {new Date(selected.evidenceDueBy).toLocaleString(lang)}
                </p>
              ) : null}
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
                  aria-label={t("refundAmount")}
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
              {refund && !refundValid ? (
                <p className="mt-2 text-[12px] text-danger">{t("invalidRefundAmount")}</p>
              ) : null}
              {selected.resolution ? (
                <p className="mt-2 text-[12px] text-muted">
                  {t("resolved")}:{" "}
                  {selected.resolution.resolutionNote ?? selected.resolution.note ?? "—"}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("evidence")}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                  className="block min-w-0 flex-1 text-[13px]"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  loading={uploadEvidence.isPending}
                  disabled={!evidenceFile}
                  onClick={() => void upload()}
                >
                  <Upload className="size-3.5" />
                  {t("upload")}
                </Button>
              </div>
              {(selected.evidence ?? []).length ? (
                <ul className="mt-3 divide-y divide-line/60">
                  {selected.evidence?.map((item, index) => {
                    const href = safeUrl(item.url);
                    return (
                      <li key={item.id ?? index} className="flex items-center justify-between gap-2 py-2 text-[13px]">
                        <span className="inline-flex min-w-0 items-center gap-2 text-muted">
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">{evidenceName(item, index)}</span>
                        </span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[12.5px] font-semibold text-terracotta hover:underline"
                          >
                            {t("viewDetails")}
                          </a>
                        ) : (
                          <span className="text-[12px] text-muted-soft">{t("notAvailable")}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-[12.5px] text-muted">{t("noResults")}</p>
              )}
            </div>

            {(selected.timeline ?? []).length ? (
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("timeline")}
                </p>
                <ol className="mt-3 space-y-3">
                  {selected.timeline?.map((event, index) => (
                    <li key={event.id ?? index} className="flex gap-2.5 text-[13px]">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-terracotta" />
                      <div className="min-w-0">
                        <p className="font-semibold text-charcoal">{timelineText(event)}</p>
                        {timelineTime(event) ? (
                          <p className="text-[12px] text-muted">{timelineTime(event)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("internalNotes")}
              </p>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder={t("resolutionNotePlaceholder")}
                maxLength={500}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-cream/40 p-2.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-soft focus:border-terracotta/50 focus:bg-white"
              />
              <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-soft">
                <Check className="size-3 text-olive" />
                {t("visibleToTeam")}
              </div>
            </div>
          </div>
        ) : detailPending ? (
          <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
        ) : null}
      </Sheet>
    </div>
  );
}
