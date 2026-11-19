"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Globe2,
  Info,
  Lock,
  Mail,
  Percent,
  RotateCcw,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import {
  ADMIN_BUILD_VERSION,
  AdminCard,
  AdminPageHeader,
  SectionHead,
} from "@/components/admin/admin-ui";
import {
  useAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} from "@/lib/queries";
import { cn, errorMessage } from "@/lib/utils";

type CommissionBase = "SUBTOTAL" | "TOTAL";
type PayoutInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
type WeeklyAnchor = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
type FeeBearer = "PLATFORM" | "COOK";

type SettingsForm = {
  platformName: string;
  region: string;
  currency: string;
  timezone: string;
  supportEmail: string;
  commission: number;
  commissionFixedCents: number;
  commissionBase: CommissionBase;
  serviceFeeCents: number;
  minOrderCents: number;
  stripeFeeBearer: FeeBearer;
  payoutHoldDays: number;
  payoutInterval: PayoutInterval;
  payoutWeeklyAnchor: WeeklyAnchor;
  payoutMonthlyAnchor: number;
  vatRateBps: number;
  kvkNumber: string;
  autoApprove: boolean;
  requireDocs: boolean;
  maintenance: boolean;
};

const WEEKDAYS: WeeklyAnchor[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const DEFAULT_SETTINGS: SettingsForm = {
  platformName: "Daarik",
  region: "NL",
  currency: "EUR",
  timezone: "Europe/Amsterdam",
  supportEmail: "hello@daarik.nl",
  commission: 15,
  commissionFixedCents: 0,
  commissionBase: "SUBTOTAL",
  serviceFeeCents: 150,
  minOrderCents: 500,
  stripeFeeBearer: "PLATFORM",
  payoutHoldDays: 7,
  payoutInterval: "WEEKLY",
  payoutWeeklyAnchor: "monday",
  payoutMonthlyAnchor: 1,
  vatRateBps: 2100,
  kvkNumber: "",
  autoApprove: false,
  requireDocs: true,
  maintenance: false,
};

const SETTINGS_PAYOUT_KEYS: (keyof SettingsForm)[] = [
  "payoutHoldDays",
  "payoutInterval",
  "payoutWeeklyAnchor",
  "payoutMonthlyAnchor",
];

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : fallback;
}

function formFromSettings(
  remote: Record<string, unknown> | null | undefined,
): SettingsForm {
  const serviceFeeCents =
    remote && remote.serviceFeeCents !== undefined
      ? asNumber(remote.serviceFeeCents, DEFAULT_SETTINGS.serviceFeeCents)
      : Math.round(asNumber(remote?.serviceFee, 1.5) * 100);
  const commissionRate = asNumber(
    remote?.commissionRate,
    DEFAULT_SETTINGS.commission / 100,
  );

  return {
    platformName: asString(remote?.platformName, DEFAULT_SETTINGS.platformName),
    region: asString(remote?.region, DEFAULT_SETTINGS.region).slice(0, 2),
    currency: asString(remote?.currency, DEFAULT_SETTINGS.currency).slice(0, 3),
    timezone: asString(remote?.timezone, DEFAULT_SETTINGS.timezone),
    supportEmail: asString(remote?.supportEmail, DEFAULT_SETTINGS.supportEmail),
    commission: Math.round(commissionRate * 100),
    commissionFixedCents: asNumber(
      remote?.commissionFixedCents,
      DEFAULT_SETTINGS.commissionFixedCents,
    ),
    commissionBase: asEnum<CommissionBase>(
      remote?.commissionBase,
      ["SUBTOTAL", "TOTAL"],
      DEFAULT_SETTINGS.commissionBase,
    ),
    serviceFeeCents,
    minOrderCents: asNumber(
      remote?.minOrderCents,
      DEFAULT_SETTINGS.minOrderCents,
    ),
    stripeFeeBearer: asEnum<FeeBearer>(
      remote?.stripeFeeBearer,
      ["PLATFORM", "COOK"],
      DEFAULT_SETTINGS.stripeFeeBearer,
    ),
    payoutHoldDays: asNumber(
      remote?.payoutHoldDays,
      DEFAULT_SETTINGS.payoutHoldDays,
    ),
    payoutInterval: asEnum<PayoutInterval>(
      remote?.payoutInterval,
      ["DAILY", "WEEKLY", "MONTHLY", "MANUAL"],
      DEFAULT_SETTINGS.payoutInterval,
    ),
    payoutWeeklyAnchor: asEnum<WeeklyAnchor>(
      remote?.payoutWeeklyAnchor,
      WEEKDAYS,
      DEFAULT_SETTINGS.payoutWeeklyAnchor,
    ),
    payoutMonthlyAnchor: asNumber(
      remote?.payoutMonthlyAnchor,
      DEFAULT_SETTINGS.payoutMonthlyAnchor,
    ),
    vatRateBps: asNumber(remote?.vatRateBps, DEFAULT_SETTINGS.vatRateBps),
    kvkNumber: asString(remote?.kvkNumber, DEFAULT_SETTINGS.kvkNumber),
    autoApprove: asBoolean(
      remote?.autoApproveCooks,
      DEFAULT_SETTINGS.autoApprove,
    ),
    requireDocs: asBoolean(
      remote?.requireVerification,
      DEFAULT_SETTINGS.requireDocs,
    ),
    maintenance: asBoolean(
      remote?.maintenanceMode,
      DEFAULT_SETTINGS.maintenance,
    ),
  };
}

function clamp(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export default function AdminSettingsPage() {
  const { t, lang, toast } = useApp();
  const { data: remoteSettings } = useAdminSettingsQuery();
  const updateSettings = useUpdateAdminSettingsMutation();

  const saved = useMemo(
    () => formFromSettings(remoteSettings),
    [remoteSettings],
  );
  const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setForm(saved);
    });
    return () => {
      active = false;
    };
  }, [saved]);

  const isDirty = useMemo(
    () =>
      (Object.keys(form) as (keyof SettingsForm)[]).some(
        (key) => form[key] !== saved[key],
      ),
    [form, saved],
  );
  const payoutWillChange = SETTINGS_PAYOUT_KEYS.some(
    (key) => form[key] !== saved[key],
  );

  const update = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const reset = () => {
    setForm(saved);
    toast(t("discarded"), { variant: "info" });
  };

  const save = async () => {
    try {
      await updateSettings.mutateAsync({
        platformName: form.platformName.trim() || DEFAULT_SETTINGS.platformName,
        region: form.region.trim().toUpperCase().slice(0, 2),
        currency: form.currency.trim().toUpperCase().slice(0, 3),
        timezone: form.timezone.trim(),
        supportEmail: form.supportEmail.trim(),
        serviceFeeCents: clamp(
          Math.round(form.serviceFeeCents),
          0,
          2500,
        ),
        commissionRate: Number((clamp(form.commission, 0, 50) / 100).toFixed(4)),
        commissionFixedCents: clamp(
          Math.round(form.commissionFixedCents),
          0,
          1000,
        ),
        commissionBase: form.commissionBase,
        minOrderCents: clamp(Math.round(form.minOrderCents), 0, 10_000),
        stripeFeeBearer: form.stripeFeeBearer,
        payoutHoldDays: clamp(Math.round(form.payoutHoldDays), 0, 90),
        payoutInterval: form.payoutInterval,
        payoutWeeklyAnchor: form.payoutWeeklyAnchor,
        payoutMonthlyAnchor: clamp(Math.round(form.payoutMonthlyAnchor), 1, 28),
        vatRateBps: clamp(Math.round(form.vatRateBps), 0, 30_000),
        kvkNumber: form.kvkNumber.trim().slice(0, 20),
        autoApproveCooks: form.autoApprove,
        requireVerification: form.requireDocs,
        maintenanceMode: form.maintenance,
      });
      toast(t("savedSettingsToast"), { description: t("adminSettingsSaved") });
    } catch (err) {
      toast(errorMessage(err, t("paymentFailed")), { variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <AdminPageHeader
        eyebrow={t("operations")}
        title={t("adminNavSettings")}
        subtitle={t("adminSettingsNote")}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              disabled={!isDirty || updateSettings.isPending}
              onClick={reset}
            >
              <RotateCcw className="size-4" />
              {t("reset")}
            </Button>
            <Button
              size="sm"
              className="h-9"
              loading={updateSettings.isPending}
              disabled={!isDirty}
              onClick={() => void save()}
            >
              <Save className="size-4" />
              {t("saveAdminSettings")}
            </Button>
          </>
        }
      />

      {isDirty ? (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-[#f1ddb7] bg-[#fdf7e9] px-4 py-2.5 text-[13px] font-medium text-[#7a5816]"
        >
          <Info className="size-4 shrink-0" />
          You have unsaved changes. Save or reset before leaving this page.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <AdminCard>
            <SectionHead
              title={t("platformSettings")}
              subtitle={t("adminSettingsNote")}
              action={
                <span className="grid size-8 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <Building2 className="size-4" />
                </span>
              }
            />
            <div className="space-y-4 p-4 pt-3 md:p-5 md:pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("platformName")}
                  <input
                    value={form.platformName}
                    onChange={(event) => update("platformName", event.target.value)}
                    maxLength={60}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[15px] normal-case tracking-normal text-charcoal outline-none transition focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
                  />
                </label>
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("supportEmail")}
                  <span className="relative mt-1.5 block">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
                    <input
                      type="email"
                      value={form.supportEmail}
                      onChange={(event) => update("supportEmail", event.target.value)}
                      maxLength={120}
                      className="h-10 w-full rounded-xl border border-line bg-cream/40 ps-9 pe-3 text-[15px] normal-case tracking-normal text-charcoal outline-none transition focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
                    />
                  </span>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("region")}
                  <input
                    value={form.region}
                    onChange={(event) =>
                      update("region", event.target.value.toUpperCase().slice(0, 2))
                    }
                    maxLength={2}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  />
                </label>
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("currencyLabel")}
                  <input
                    value={form.currency}
                    onChange={(event) =>
                      update("currency", event.target.value.toUpperCase().slice(0, 3))
                    }
                    maxLength={3}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  />
                </label>
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("timezone")}
                  <input
                    value={form.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                    maxLength={60}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    {t("platformFeeLabel")}
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-50 px-2 py-1 text-[13px] font-bold text-terracotta-700">
                    <Percent className="size-3" />
                    {form.commission}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={form.commission}
                  onChange={(event) => update("commission", Number(event.target.value))}
                  aria-label={t("platformFeeLabel")}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-terracotta"
                />
                <div className="mt-1 flex justify-between text-[11.5px] text-muted-soft">
                  <span>0%</span>
                  <span>{t("commissionFootnote")}</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <NumberField
                  label="Service fee (cents)"
                  value={form.serviceFeeCents}
                  min={0}
                  max={2500}
                  onChange={(value) => update("serviceFeeCents", value)}
                />
                <NumberField
                  label="Fixed commission (cents)"
                  value={form.commissionFixedCents}
                  min={0}
                  max={1000}
                  onChange={(value) => update("commissionFixedCents", value)}
                />
                <NumberField
                  label="Minimum order (cents)"
                  value={form.minOrderCents}
                  min={0}
                  max={10_000}
                  onChange={(value) => update("minOrderCents", value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  Commission base
                  <select
                    value={form.commissionBase}
                    onChange={(event) =>
                      update("commissionBase", event.target.value as CommissionBase)
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  >
                    <option value="SUBTOTAL">Food subtotal only</option>
                    <option value="TOTAL">Subtotal + service fee</option>
                  </select>
                </label>
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  Stripe fee bearer
                  <select
                    value={form.stripeFeeBearer}
                    onChange={(event) =>
                      update("stripeFeeBearer", event.target.value as FeeBearer)
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  >
                    <option value="PLATFORM">Platform pays Stripe fees</option>
                    <option value="COOK">Cook pays Stripe fees</option>
                  </select>
                </label>
              </div>

              <div className="space-y-1 border-t border-line/80 pt-3">
                <SettingToggle
                  title={t("autoApproveCooks")}
                  description={t("autoApproveCooksDesc")}
                  checked={form.autoApprove}
                  onChange={(checked) => update("autoApprove", checked)}
                />
                <SettingToggle
                  title={t("requireVerification")}
                  description={t("requireVerificationDesc")}
                  checked={form.requireDocs}
                  onChange={(checked) => update("requireDocs", checked)}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHead
              title="Payout policy"
              subtitle="Applied to connected Stripe accounts when interval changes are saved"
              action={
                <span className="grid size-8 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <Wallet className="size-4" />
                </span>
              }
            />
            <div className="space-y-3 p-4 pt-3 md:p-5 md:pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  Payout frequency
                  <select
                    value={form.payoutInterval}
                    onChange={(event) =>
                      update(
                        "payoutInterval",
                        event.target.value as PayoutInterval,
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </label>
                <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("payoutDay")}
                  <select
                    value={form.payoutWeeklyAnchor}
                    onChange={(event) =>
                      update(
                        "payoutWeeklyAnchor",
                        event.target.value as WeeklyAnchor,
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {day === "friday"
                          ? lang === "nl"
                            ? "Vrijdag"
                            : "Friday"
                          : t(day)}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField
                  label="Monthly anchor (1-28)"
                  value={form.payoutMonthlyAnchor}
                  min={1}
                  max={28}
                  onChange={(value) => update("payoutMonthlyAnchor", value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  label="Hold days after COMPLETED"
                  value={form.payoutHoldDays}
                  min={0}
                  max={90}
                  onChange={(value) => update("payoutHoldDays", value)}
                />
                <NumberField
                  label="VAT rate (basis points)"
                  value={form.vatRateBps}
                  min={0}
                  max={30_000}
                  onChange={(value) => update("vatRateBps", value)}
                />
              </div>
              <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                KVK number
                <input
                  value={form.kvkNumber}
                  onChange={(event) =>
                    update("kvkNumber", event.target.value.slice(0, 20))
                  }
                  maxLength={20}
                  className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
                />
              </label>
              <p
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-3 text-[12.5px] leading-relaxed",
                  payoutWillChange
                    ? "border-[#f1ddb7] bg-[#fdf7e9] text-[#7a5816]"
                    : "border-line bg-cream/50 text-muted",
                )}
              >
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Saving payout frequency or anchor changes reapplies the payout
                schedule to every connected cook account. Payout status remains
                controlled by Stripe webhooks.
              </p>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <AdminCard>
            <SectionHead
              title={t("environment")}
              subtitle="Deployed configuration (read-only)"
              action={
                <span className="grid size-8 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <Globe2 className="size-4" />
                </span>
              }
            />
            <div className="p-4 pt-3 md:p-5 md:pt-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: t("buildVersion"), value: ADMIN_BUILD_VERSION },
                  { label: t("region"), value: saved.region || "—" },
                  { label: t("currencyLabel"), value: saved.currency || "—" },
                  { label: t("timezone"), value: saved.timezone || "—" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-line bg-cream/40 p-2.5"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                      {item.label}
                    </p>
                    <p className="mt-0.5 break-words text-[13.5px] font-semibold text-charcoal">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-olive-50 px-3 py-2.5 text-[13px] font-semibold text-olive">
                <ShieldCheck className="size-3.5" />
                {t("adminOnly")}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHead
              title={t("dangerZone")}
              subtitle={t("dangerZoneSub")}
            />
            <div className="p-4 pt-3 md:p-5 md:pt-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream/40 p-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-charcoal">
                    {t("maintenanceMode")}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    {t("maintenanceDesc")}
                  </p>
                </div>
                <Switch
                  checked={form.maintenance}
                  onCheckedChange={(next) => {
                    if (next) setMaintenanceOpen(true);
                    else update("maintenance", false);
                  }}
                  label={t("maintenanceMode")}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-soft">
                <Lock className="size-3" />
                {t("adminOnly")}
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          <Check className="size-3.5 text-olive" />
          Settings are written to the platform configuration and audited.
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!isDirty || updateSettings.isPending}
            onClick={reset}
          >
            <RotateCcw className="size-4" />
            {t("reset")}
          </Button>
          <Button
            size="sm"
            loading={updateSettings.isPending}
            disabled={!isDirty}
            onClick={() => void save()}
          >
            <Check className="size-4" />
            {t("saveSettings")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        onConfirm={() => {
          update("maintenance", true);
          setMaintenanceOpen(false);
        }}
        title={t("maintenanceConfirmTitle")}
        description={t("maintenanceConfirmDesc")}
        confirmLabel={t("enableMaintenance")}
        cancelLabel={t("cancel")}
        icon={<Wallet className="size-6" />}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] normal-case tracking-normal text-charcoal outline-none focus:border-terracotta/50 focus:bg-white"
      />
    </label>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 transition hover:bg-cream/40",
      )}
    >
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-charcoal">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={title} />
    </div>
  );
}
