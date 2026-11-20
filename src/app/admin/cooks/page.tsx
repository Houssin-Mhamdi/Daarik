"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChefHat,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, SegmentedTabs } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  KpiCard,
  StatusPill,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  useAdminBulkCookStatusMutation,
  useAdminCookWorkspaceQuery,
  useAdminCooksQuery,
  useAdminUpdateCookComplianceMutation,
  useAdminUpdateCookPricingMutation,
  useAdminUpdateCookStatusMutation,
  useSyncAdminCookStripeMutation,
  type AdminCookRecord,
} from "@/lib/queries";
import { loc } from "@/lib/data";
import { errorMessage, formatPrice } from "@/lib/utils";

type Verification = "verified" | "pending" | "suspended";
type Filter = "all" | Verification;
type ComplianceForm = {
  status: string;
  note: string;
  kvkNumber: string;
  nvwaRegistered: boolean;
  payoutHoldDays: number;
};

const PAGE_SIZE = 15;

function initialsOf(name: string): string {
  return String(name || "C")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Bulk endpoints return `{ updated, failed }` once the backend rolls out. */
function bulkUpdated(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0;
  const raw = value as Record<string, unknown>;
  return typeof raw.updated === "number" ? raw.updated : 0;
}

export default function AdminCooksPage() {
  const { t, lang, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [commissionInput, setCommissionInput] = useState("");
  const [meetFeeInput, setMeetFeeInput] = useState("");
  const [compliance, setCompliance] = useState<ComplianceForm>({
    status: "PENDING",
    note: "",
    kvkNumber: "",
    nvwaRegistered: false,
    payoutHoldDays: 7,
  });

  const { data: adminCooks, isPending, isError } = useAdminCooksQuery({
    status: filter === "all" ? undefined : filter.toUpperCase(),
    q: query.trim() || undefined,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const { data: workspace, isPending: workspacePending } =
    useAdminCookWorkspaceQuery(selectedId ?? "");

  const bulkCookStatus = useAdminBulkCookStatusMutation();
  const updateCookStatus = useAdminUpdateCookStatusMutation();
  const updateCompliance = useAdminUpdateCookComplianceMutation();
  const updatePricing = useAdminUpdateCookPricingMutation();
  const syncStripe = useSyncAdminCookStripeMutation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filter, query]);

  useEffect(() => {
    const current = workspace?.cook?.compliance;
    setCompliance({
      status: typeof current?.status === "string" ? current.status : "PENDING",
      note: typeof current?.note === "string" ? current.note : "",
      kvkNumber: typeof current?.kvkNumber === "string" ? current.kvkNumber : "",
      nvwaRegistered: current?.nvwaRegistered === true,
      payoutHoldDays:
        typeof workspace?.cook?.payoutHoldDays === "number"
          ? workspace.cook.payoutHoldDays
          : 7,
    });
  }, [workspace?.cook?.compliance, workspace?.cook?.payoutHoldDays]);

  const rows = useMemo(
    () =>
      (adminCooks?.cooks ?? []).map((cook: AdminCookRecord) => ({
        id: cook.id,
        /** DB id is the canonical target for bulk status changes. */
        dbId: cook.dbId ?? cook.id,
        name: cook.name,
        city: cook.city,
        cuisine: cook.cuisineIds[0] ?? "",
        orders: cook.ordersCount,
        rating: cook.rating,
        joined: cook.createdAt
          ? new Date(cook.createdAt).toLocaleDateString(lang)
          : "—",
        commission:
          typeof cook.commissionRateOverride === "number"
            ? cook.commissionRateOverride
            : null,
        meetFee: (cook.meetFeeCents ?? 0) / 100,
        status: cook.status.toLowerCase() as Verification,
        avatar: cook.avatar ?? undefined,
        initials: initialsOf(cook.name),
        email: `—`,
        phone: "—",
      })),
    [adminCooks?.cooks, lang],
  );

  const serverCounts = adminCooks?.counts;
  const counts = useMemo(
    () => ({
      all:
        serverCounts?.all ??
        serverCounts?.total ??
        adminCooks?.total ??
        rows.length,
      verified:
        serverCounts?.verified ??
        rows.filter((row) => row.status === "verified").length,
      pending:
        serverCounts?.pending ??
        adminCooks?.verificationQueue?.length ??
        rows.filter((row) => row.status === "pending").length,
      suspended:
        serverCounts?.suspended ??
        rows.filter((row) => row.status === "suspended").length,
    }),
    [adminCooks?.total, adminCooks?.verificationQueue?.length, rows, serverCounts],
  );

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const suspendTarget = rows.find((row) => row.id === suspendId) ?? null;
  const totalPages = Math.max(1, Math.ceil(counts.all / PAGE_SIZE));
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.dbId));

  const changeStatus = async (id: string, status: "VERIFIED" | "SUSPENDED") => {
    try {
      await updateCookStatus.mutateAsync({ id, status });
      toast(
        status === "VERIFIED" ? t("cookApprovedToast") : t("cookSuspendedToast"),
      );
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const runBulk = async (status: "VERIFIED" | "SUSPENDED") => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    try {
      const result = await bulkCookStatus.mutateAsync({ ids, status });
      const updated = bulkUpdated(result);
      setSelectedIds(new Set());
      toast(t("savedSettingsToast"), {
        description: `${updated} ${t("cooks").toLowerCase()} ${status === "VERIFIED" ? "approved" : "suspended"}`,
      });
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const runPricing = async (resetCommission = false) => {
    const ids = [...selectedIds];
    if (!ids.length) return;

    const body: {
      ids: string[];
      commissionRate?: number | null;
      meetFeeCents?: number;
    } = { ids };
    if (resetCommission) {
      body.commissionRate = null;
    } else if (commissionInput.trim()) {
      const percent = Number(commissionInput.replace(",", "."));
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        toast(t("validationErrors"), { variant: "error" });
        return;
      }
      body.commissionRate = percent / 100;
    }
    if (meetFeeInput.trim()) {
      const euros = Number(meetFeeInput.replace(",", "."));
      if (!Number.isFinite(euros) || euros < 0 || euros > 1000) {
        toast(t("validationErrors"), { variant: "error" });
        return;
      }
      body.meetFeeCents = Math.round(euros * 100);
    }
    if (Object.keys(body).length === 1) return;

    try {
      await updatePricing.mutateAsync(body);
      toast(t("savedSettingsToast"));
      setSelectedIds(new Set());
      setCommissionInput("");
      setMeetFeeInput("");
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const saveCompliance = async () => {
    if (!workspace) return;
    try {
      await updateCompliance.mutateAsync({
        id: workspace.cook.id,
        status: compliance.status,
        note: compliance.note.trim() || undefined,
        kvkNumber: compliance.kvkNumber.trim() || undefined,
        nvwaRegistered: compliance.nvwaRegistered,
        payoutHoldDays: compliance.payoutHoldDays,
      });
      toast(t("savedSettingsToast"));
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  const syncCookStripe = async () => {
    if (!workspace) return;
    try {
      await syncStripe.mutateAsync(workspace.cook.id);
      toast(t("stripeSynced"), { description: workspace.cook.name });
    } catch (err) {
      toast(errorMessage(err, t("loadError")), { variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("people")}
        title={t("adminNavCooks")}
        subtitle={t("adminCooksSub")}
        actions={
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            <UserCheck className="size-3.5 text-muted" />
            {t("verificationQueue")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("all")}
          value={counts.all}
          icon={<ChefHat className="size-4" />}
        />
        <KpiCard
          label={t("verified")}
          value={counts.verified}
          icon={<BadgeCheck className="size-4" />}
          accent="#697653"
        />
        <KpiCard
          label={t("pendingVerifications")}
          value={counts.pending}
          icon={<UserCheck className="size-4" />}
          accent="#d9a441"
        />
        <KpiCard
          label={t("suspended")}
          value={counts.suspended}
          icon={<ShieldAlert className="size-4" />}
          accent="#b3402f"
        />
      </div>

      <AdminCard className="mt-4">
        <div className="flex flex-col gap-3 border-b border-[#f0e9dc] p-3 md:flex-row md:items-center md:p-4">
          <div className="relative min-w-0 flex-1 md:max-w-[300px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchCooks")}
              aria-label={t("searchCooks")}
              className="h-9 w-full rounded-xl border border-line bg-cream/50 ps-9 pe-8 text-[14px] outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="absolute end-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-soft hover:bg-cream-200"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
          <SegmentedTabs
            scrollable
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: t("all"), count: counts.all },
              { value: "verified", label: t("verifiedFilter"), count: counts.verified },
              { value: "pending", label: t("pendingFilter"), count: counts.pending },
              { value: "suspended", label: t("suspendedFilter"), count: counts.suspended },
            ]}
            className="min-w-max md:ms-auto"
          />
        </div>

        {selectedIds.size > 0 ? (
          <div className="m-3 flex flex-wrap items-center gap-2 rounded-xl bg-cream/60 p-2 md:m-4">
            <span className="text-[13px] font-semibold text-charcoal">
              {selectedIds.size} {t("selected").toLowerCase()}
            </span>
            <Button size="sm" loading={bulkCookStatus.isPending} onClick={() => void runBulk("VERIFIED")}>
              {t("approve")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={bulkCookStatus.isPending}
              onClick={() => void runBulk("SUSPENDED")}
            >
              {t("suspendCook")}
            </Button>
            <div className="ms-auto flex flex-wrap items-center gap-2 border-s border-line ps-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionInput}
                onChange={(event) => setCommissionInput(event.target.value)}
                placeholder={t("commissionPlaceholder")}
                aria-label={t("cookCommissionCol")}
                className="h-8 w-24 rounded-lg border border-line bg-white px-2 text-[13px] outline-none focus:border-terracotta/50"
              />
              <input
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={meetFeeInput}
                onChange={(event) => setMeetFeeInput(event.target.value)}
                placeholder={t("meetFeePlaceholder")}
                aria-label={t("meetFeeLabel")}
                className="h-8 w-24 rounded-lg border border-line bg-white px-2 text-[13px] outline-none focus:border-terracotta/50"
              />
              <Button
                size="sm"
                loading={updatePricing.isPending}
                onClick={() => void runPricing()}
              >
                {t("applyPricing")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={updatePricing.isPending}
                onClick={() => void runPricing(true)}
              >
                {t("resetCommission")}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              {t("clearFiltersShort")}
            </Button>
          </div>
        ) : null}

        {isError ? (
          <p role="alert" className="px-5 py-8 text-center text-sm text-danger">
            {t("loadError")}
          </p>
        ) : isPending ? (
          <p className="px-5 py-8 text-center text-sm text-muted">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ChefHat className="mx-auto size-7 text-muted-soft" />
            <p className="mt-3 text-[15.5px] font-semibold text-charcoal">{t("noResults")}</p>
            <p className="mt-1 text-[13.5px] text-muted">{t("noResultsFilters")}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              {t("clearFiltersShort")}
            </Button>
          </div>
        ) : (
          <AdminTable>
            <TableHeader>
              <TableRow>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    aria-label={t("selectAll")}
                    checked={allSelected}
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked
                          ? new Set(rows.map((row) => row.dbId))
                          : new Set(),
                      )
                    }
                    className="size-4 accent-terracotta"
                  />
                </Th>
                <Th>{t("cookCol")}</Th>
                <Th className="hidden md:table-cell">{t("cuisine")}</Th>
                <Th className="hidden lg:table-cell">{t("totalOrders")}</Th>
                <Th className="hidden sm:table-cell">{t("ratingCol")}</Th>
                <Th className="hidden xl:table-cell">{t("joined")}</Th>
                <Th className="hidden lg:table-cell">{t("cookCommissionCol")}</Th>
                <Th className="hidden xl:table-cell">{t("meetFeeLabel")}</Th>
                <Th>{t("verificationCol")}</Th>
                <Th className="text-end">{t("actionCol")}</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <Td>
                    <input
                      type="checkbox"
                      aria-label={`${t("select")} ${row.name}`}
                      checked={selectedIds.has(row.dbId)}
                      onChange={(event) => {
                        const next = new Set(selectedIds);
                        if (event.target.checked) next.add(row.dbId);
                        else next.delete(row.dbId);
                        setSelectedIds(next);
                      }}
                      className="size-4 accent-terracotta"
                    />
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="flex items-center gap-2.5 text-start"
                    >
                      {row.avatar ? (
                        <Avatar src={row.avatar} alt={row.name} size={30} />
                      ) : (
                        <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-cream-100 text-[12px] font-bold text-charcoal">
                          {row.initials}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{row.name}</span>
                        <span className="block truncate text-[12px] text-muted">{row.city}</span>
                      </span>
                    </button>
                  </Td>
                  <Td className="hidden text-muted md:table-cell">{row.cuisine || "—"}</Td>
                  <Td className="hidden tabular-nums lg:table-cell">
                    {row.orders ? row.orders.toLocaleString(lang) : "—"}
                  </Td>
                  <Td className="hidden sm:table-cell">
                    {row.rating ? (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Star className="size-3 fill-saffron text-saffron" />
                        {row.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-soft">—</span>
                    )}
                  </Td>
                  <Td className="hidden text-muted xl:table-cell">{row.joined}</Td>
                  <Td className="hidden tabular-nums lg:table-cell">
                    {row.commission === null
                      ? t("defaultCommission")
                      : `${(row.commission * 100).toFixed(row.commission * 100 % 1 ? 1 : 0)}%`}
                  </Td>
                  <Td className="hidden tabular-nums xl:table-cell">
                    {row.meetFee > 0 ? formatPrice(row.meetFee, lang) : "—"}
                  </Td>
                  <Td>
                    <StatusPill status={row.status} />
                  </Td>
                  <Td className="text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-charcoal transition hover:bg-cream-100"
                    >
                      {t("viewDetails")}
                    </button>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </AdminTable>
        )}

        {totalPages > 1 ? (
          <Pagination page={page} totalPages={totalPages} onPage={setPage} className="m-4" />
        ) : null}

        <div className="px-4 py-3 text-[13px] text-muted md:px-5">
          {t("showingResults", { shown: rows.length, total: counts.all })}
        </div>
      </AdminCard>

      <p className="mt-3 px-1 text-[12.5px] text-muted-soft">
        {t("cookVerificationNote")}
      </p>
      <p className="mt-1 px-1 text-[12.5px] text-muted-soft">
        {t("pricingNote")}
      </p>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? t("cookCol")}
        description={selected ? `${selected.cuisine} · ${selected.city}` : undefined}
        className="md:max-w-xl"
        footer={
          selected ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedId(null)}>
                {t("close")}
              </Button>
              {selected.status === "suspended" ? (
                <Button className="flex-1" onClick={() => void changeStatus(selected.id, "VERIFIED")}>
                  <ShieldCheck className="size-4" />
                  {t("reactivate")}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setSuspendId(selected.id)}
                >
                  {t("suspendCook")}
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {selected && workspace ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              {selected.avatar ? (
                <Avatar src={selected.avatar} alt={selected.name} size={48} />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-terracotta-50 text-[16px] font-bold text-terracotta-700">
                  {selected.initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-charcoal">{selected.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                  <MapPin className="size-3" />
                  {selected.city} · {t("joined")} {selected.joined}
                </p>
                <div className="mt-1.5">
                  <StatusPill status={selected.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("totalOrders"), value: selected.orders.toLocaleString(lang) },
                {
                  label: t("ratingCol"),
                  value: selected.rating ? selected.rating.toFixed(1) : "—",
                },
                { label: t("adminNavDishes"), value: String(workspace.dishes.length) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line bg-white p-3 text-center">
                  <p className="text-[18px] font-semibold leading-none text-charcoal">{stat.value}</p>
                  <p className="mt-1 text-[11.5px] text-muted-soft">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 rounded-xl border border-line bg-white p-4 text-[13.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Mail className="size-3.5" />
                  {t("email")}
                </span>
                <span className="truncate font-medium text-charcoal">{selected.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Phone className="size-3.5" />
                  {t("phone")}
                </span>
                <span className="truncate font-medium text-charcoal">{selected.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <UtensilsCrossed className="size-3.5" />
                  {t("cuisine")}
                </span>
                <span className="font-medium text-charcoal">{selected.cuisine || "—"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    Stripe Connect
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    {workspace.cook.stripe?.status ?? "not connected"}
                    {workspace.cook.stripe?.chargesEnabled
                      ? " · charges enabled"
                      : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={syncStripe.isPending}
                  onClick={() => void syncCookStripe()}
                >
                  <RefreshCw className="size-3.5" />
                  {t("syncStripe")}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("compliance")}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-[12px] text-muted">
                  Status
                  <select
                    value={compliance.status}
                    onChange={(event) =>
                      setCompliance((prev) => ({ ...prev, status: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-line bg-cream/40 px-2 text-[13px] outline-none focus:border-terracotta/50"
                  >
                    {["PENDING", "APPROVED", "FLAGGED", "REJECTED"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] text-muted">
                  KVK number
                  <input
                    value={compliance.kvkNumber}
                    onChange={(event) =>
                      setCompliance((prev) => ({ ...prev, kvkNumber: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-line bg-cream/40 px-2 text-[13px] outline-none focus:border-terracotta/50"
                  />
                </label>
                <label className="text-[12px] text-muted">
                  Payout hold (days)
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={compliance.payoutHoldDays}
                    onChange={(event) =>
                      setCompliance((prev) => ({
                        ...prev,
                        payoutHoldDays: Number(event.target.value),
                      }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-line bg-cream/40 px-2 text-[13px] outline-none focus:border-terracotta/50"
                  />
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-charcoal">
                  <input
                    type="checkbox"
                    checked={compliance.nvwaRegistered}
                    onChange={(event) =>
                      setCompliance((prev) => ({
                        ...prev,
                        nvwaRegistered: event.target.checked,
                      }))
                    }
                    className="size-4 accent-terracotta"
                  />
                  NVWA registered
                </label>
                <label className="text-[12px] text-muted sm:col-span-2">
                  Reviewer note
                  <textarea
                    value={compliance.note}
                    onChange={(event) =>
                      setCompliance((prev) => ({ ...prev, note: event.target.value }))
                    }
                    rows={2}
                    maxLength={500}
                    className="mt-1 w-full resize-none rounded-lg border border-line bg-cream/40 p-2 text-[13px] outline-none focus:border-terracotta/50"
                  />
                </label>
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  loading={updateCompliance.isPending}
                  onClick={() => void saveCompliance()}
                >
                  {t("saveSettings")}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("adminNavDishes")}
              </p>
              {workspace.dishes.length ? (
                <ul className="mt-2 divide-y divide-line/60">
                  {workspace.dishes.slice(0, 8).map((dish) => (
                    <li key={dish.id} className="flex items-center justify-between gap-2 py-2 text-[13px]">
                      <span className="truncate font-medium text-charcoal">
                        {loc(dish.name, lang)}
                      </span>
                      <Badge variant="outline" size="sm">
                        {String((dish as unknown as Record<string, unknown>).status ?? "—")}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-muted">{t("noResults")}</p>
              )}
            </div>

            <Link
              href={`/cook/${selected.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-terracotta hover:underline"
            >
              {t("viewPublicPage")}
              <ExternalLink className="size-3" />
            </Link>
          </div>
        ) : workspacePending ? (
          <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendId(null)}
        onConfirm={async () => {
          if (suspendTarget) await changeStatus(suspendTarget.id, "SUSPENDED");
          setSuspendId(null);
          setSelectedId(null);
        }}
        title={t("suspendCookTitle")}
        description={t("suspendCookDesc")}
        confirmLabel={t("suspendCook")}
        cancelLabel={t("cancel")}
        variant="destructive"
      />
    </div>
  );
}
