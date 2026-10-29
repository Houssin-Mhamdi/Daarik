"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChefHat,
  Mail,
  MapPin,
  Phone,
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
import { useApp } from "@/components/providers/app-provider";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  KpiCard,
  StatusPill,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import {
  VerificationSheet,
  type Applicant,
} from "@/components/admin/verification-sheet";
import { adminKpis, cooks, verificationQueue } from "@/lib/data";


type Verification = "verified" | "pending" | "suspended";

type CookRow = {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  orders: number;
  rating: number;
  joined: string;
  status: Verification;
  avatar?: string;
  initials: string;
  submitted?: string;
  documents?: number;
};

const extraCooks: CookRow[] = [
  {
    id: "c-1",
    name: "Yasmin Al-Sayed",
    city: "Rotterdam",
    cuisine: "Syrian",
    orders: 0,
    rating: 0,
    joined: "28 Oct 2026",
    status: "pending",
    initials: "YA",
    submitted: "2 days ago",
    documents: 3,
  },
  {
    id: "c-2",
    name: "Hicham Idrissi",
    city: "Utrecht",
    cuisine: "Moroccan",
    orders: 0,
    rating: 0,
    joined: "27 Oct 2026",
    status: "pending",
    initials: "HI",
    submitted: "3 days ago",
    documents: 3,
  },
  {
    id: "c-3",
    name: "Lina Haddad",
    city: "Eindhoven",
    cuisine: "Lebanese",
    orders: 0,
    rating: 0,
    joined: "26 Oct 2026",
    status: "pending",
    initials: "LH",
    submitted: "4 days ago",
    documents: 2,
  },
  {
    id: "c-4",
    name: "Nour El Din",
    city: "Amsterdam",
    cuisine: "Egyptian",
    orders: 0,
    rating: 0,
    joined: "25 Oct 2026",
    status: "pending",
    initials: "NE",
    submitted: "5 days ago",
    documents: 3,
  },
  {
    id: "c-5",
    name: "Karim Ouahbi",
    city: "Den Haag",
    cuisine: "Tunisian",
    orders: 118,
    rating: 4.4,
    joined: "12 Feb 2026",
    status: "suspended",
    initials: "KO",
  },
  {
    id: "c-6",
    name: "Hala Nassar",
    city: "Rotterdam",
    cuisine: "Syrian",
    orders: 64,
    rating: 4.6,
    joined: "3 Jun 2026",
    status: "suspended",
    initials: "HN",
  },
];

type Filter = "all" | Verification;

export default function AdminCooksPage() {
  const { t, toast } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [suspendId, setSuspendId] = useState<string | null>(null);

  const [rows, setRows] = useState<CookRow[]>(() => [
    ...cooks.map((cook) => ({
      id: cook.id,
      name: cook.name,
      city: cook.city,
      cuisine: cook.cuisineIds[0]
        ? cook.cuisineIds[0].charAt(0).toUpperCase() + cook.cuisineIds[0].slice(1)
        : "",
      orders: cook.orders,
      rating: cook.rating,
      joined: cook.since,
      status: "verified" as const,
      avatar: cook.avatar,
      initials: cook.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join(""),
    })),
    ...extraCooks,
  ]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      verified: rows.filter((row) => row.status === "verified").length,
      pending: rows.filter((row) => row.status === "pending").length,
      suspended: rows.filter((row) => row.status === "suspended").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter = filter === "all" || row.status === filter;
      const matchesQuery =
        !text ||
        row.name.toLowerCase().includes(text) ||
        row.city.toLowerCase().includes(text) ||
        row.cuisine.toLowerCase().includes(text);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, rows]);

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const suspendTarget = rows.find((row) => row.id === suspendId) ?? null;

  const openApplicant = (row: CookRow) => {
    const match = verificationQueue.find((item) => item.name === row.name);
    setApplicant(
      match ?? {
        id: row.id,
        name: row.name,
        city: row.city,
        cuisine: row.cuisine,
        submitted: row.submitted ?? "Just now",
        documents: row.documents ?? 3,
        initials: row.initials,
      },
    );
  };

  return (
    <div className="mx-auto max-w-[1360px]">
      <AdminPageHeader
        eyebrow={t("people")}
        title={t("adminNavCooks")}
        subtitle={t("adminCooksSub")}
        actions={
          <Link
            href="/admin/disputes"
            className="flex h-9 items-center gap-1.5 rounded-full border border-[#e4dbc9] bg-white px-3 text-[13.5px] font-semibold text-charcoal transition hover:border-line-strong"
          >
            <ShieldAlert className="size-3.5 text-muted" />
            {t("adminNavDisputes")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("activeCooks")}
          value={adminKpis.activeCooks}
          delta="+18"
          deltaLabel={t("thisMonthLabel").toLowerCase()}
          icon={<ChefHat className="size-4" />}
        />
        <KpiCard
          label={t("verified")}
          value={counts.verified + 227}
          icon={<BadgeCheck className="size-4" />}
          accent="#697653"
          foot="93.1%"
        />
        <KpiCard
          label={t("pendingVerifications")}
          value={counts.pending + 8}
          icon={<UserCheck className="size-4" />}
          accent="#d9a441"
          delta="+3"
          deltaLabel={t("today").toLowerCase()}
        />
        <KpiCard
          label={t("suspended")}
          value={counts.suspended + 2}
          icon={<ShieldAlert className="size-4" />}
          accent="#b3402f"
          foot={t("underReviewStatus")}
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

        <AdminTable>
          <thead>
            <tr>
              <Th>{t("cookCol")}</Th>
              <Th className="hidden md:table-cell">{t("cuisine")}</Th>
              <Th className="hidden lg:table-cell">{t("totalOrders")}</Th>
              <Th className="hidden sm:table-cell">{t("ratingCol")}</Th>
              <Th className="hidden xl:table-cell">{t("joined")}</Th>
              <Th>{t("verificationCol")}</Th>
              <Th className="text-end">{t("actionCol")}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="transition hover:bg-cream/40">
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
                <Td className="hidden text-muted md:table-cell">{row.cuisine}</Td>
                <Td className="hidden tabular-nums lg:table-cell">{row.orders || "—"}</Td>
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
                <Td>
                  <StatusPill status={row.status} />
                </Td>
                <Td className="text-end">
                  {row.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => openApplicant(row)}
                      className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[12.5px] font-semibold text-terracotta-700 transition hover:bg-terracotta-100"
                    >
                      {t("reviewDocs")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-charcoal transition hover:bg-cream-100"
                    >
                      {t("viewApplication")}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        {filtered.length === 0 ? (
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
        ) : null}

        <div className="px-4 py-3 text-[13px] text-muted md:px-5">
          {t("showingResults", { shown: filtered.length, total: rows.length })}
        </div>
      </AdminCard>

      <p className="mt-3 px-1 text-[12.5px] text-muted-soft">{t("cookVerificationNote")}</p>

      <VerificationSheet
        applicant={applicant}
        open={Boolean(applicant)}
        onClose={() => setApplicant(null)}
        onApprove={(item) => {
          setRows((prev) =>
            prev.map((row) =>
              row.name === item.name
                ? { ...row, status: "verified", joined: t("today") }
                : row,
            ),
          );
          setApplicant(null);
          toast(t("approvedToast"), { description: item.name });
        }}
        onReject={(item) => {
          setRows((prev) =>
            prev.map((row) =>
              row.name === item.name ? { ...row, status: "pending" } : row,
            ),
          );
          setApplicant(null);
          toast(t("rejectedToast"), { description: item.name, variant: "info" });
        }}
      />

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name}
        description={selected ? `${selected.cuisine} · ${selected.city}` : undefined}
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedId(null)}>
                {t("close")}
              </Button>
              {selected.status === "suspended" ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setRows((prev) =>
                      prev.map((row) =>
                        row.id === selected.id ? { ...row, status: "verified" } : row,
                      ),
                    );
                    toast(t("cookApprovedToast"), { description: selected.name });
                    setSelectedId(null);
                  }}
                >
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
        {selected ? (
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
                { label: t("totalOrders"), value: selected.orders || "0" },
                {
                  label: t("ratingCol"),
                  value: selected.rating ? selected.rating.toFixed(1) : "—",
                },
                { label: t("documents"), value: `${selected.documents ?? 3}/3` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line bg-white p-3 text-center">
                  <p className="text-[18px] font-semibold leading-none text-charcoal">{stat.value}</p>
                  <p className="mt-1 text-[11.5px] text-muted-soft">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 rounded-xl border border-line bg-white p-4 text-[13.5px]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Mail className="size-3.5" />
                  {t("email")}
                </span>
                <span className="font-medium text-charcoal">
                  {selected.name.toLowerCase().replaceAll(" ", ".")}@darna.nl
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Phone className="size-3.5" />
                  {t("phone")}
                </span>
                <span className="font-medium text-charcoal">+31 6 ···· ····</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <UtensilsCrossed className="size-3.5" />
                  {t("cuisine")}
                </span>
                <span className="font-medium text-charcoal">{selected.cuisine}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("verificationDocuments")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[t("verificationDocuments"), t("hygieneCertificate"), t("address")].map(
                  (doc, index) => (
                    <Badge
                      key={doc}
                      variant={index < (selected.documents ?? 3) ? "success" : "outline"}
                    >
                      {index < (selected.documents ?? 3) ? "✓ " : ""}
                      {doc}
                    </Badge>
                  ),
                )}
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-muted-soft">
              {t("cookVerificationNote")}
            </p>
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendId(null)}
        onConfirm={() => {
          if (suspendTarget) {
            setRows((prev) =>
              prev.map((row) =>
                row.id === suspendTarget.id ? { ...row, status: "suspended" } : row,
              ),
            );
            toast(t("cookSuspendedToast"), {
              description: suspendTarget.name,
              variant: "info",
            });
          }
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
