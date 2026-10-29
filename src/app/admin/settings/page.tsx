"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  Globe2,
  Info,
  Lock,
  Mail,
  MapPin,
  Percent,
  Save,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import { AdminCard, AdminPageHeader, SectionHead } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { t, toast } = useApp();
  const [commission, setCommission] = useState(15);
  const [supportEmail, setSupportEmail] = useState("support@darna.nl");
  const [platformName, setPlatformName] = useState("Darna");
  const [payoutDay, setPayoutDay] = useState("tuesday");
  const [autoApprove, setAutoApprove] = useState(false);
  const [requireDocs, setRequireDocs] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [newCooks, setNewCooks] = useState(true);
  const [reviewDigest, setReviewDigest] = useState(true);
  const [payoutDigest, setPayoutDigest] = useState(true);
  const [rules, setRules] = useState(
    "Cooks must prepare food in a registered home kitchen, label allergens clearly and honour pickup windows. Pickup only — no delivery.",
  );

  const save = () => {
    toast(t("savedSettingsToast"), { description: t("adminSettingsSaved") });
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <AdminPageHeader
        eyebrow={t("operations")}
        title={t("adminNavSettings")}
        subtitle={t("adminSettingsNote")}
        actions={
          <Button size="sm" className="h-9" onClick={save}>
            <Save className="size-4" />
            {t("saveAdminSettings")}
          </Button>
        }
      />

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
              <div>
                <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("platformName")}
                </label>
                <input
                  value={platformName}
                  onChange={(event) => setPlatformName(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[15px] outline-none transition focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                  {t("supportEmail")}
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    className="h-10 w-full rounded-xl border border-line bg-cream/40 ps-9 text-[15px] outline-none transition focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    {t("platformFeeLabel")}
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-50 px-2 py-1 text-[13px] font-bold text-terracotta-700">
                    <Percent className="size-3" />
                    {commission}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={commission}
                  onChange={(event) => setCommission(Number(event.target.value))}
                  aria-label={t("platformFeeLabel")}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream-200 accent-terracotta"
                />
                <div className="mt-1 flex justify-between text-[11.5px] text-muted-soft">
                  <span>5%</span>
                  <span>{t("commissionFootnote")}</span>
                  <span>25%</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    {t("payoutDay")}
                  </label>
                  <select
                    value={payoutDay}
                    onChange={(event) => setPayoutDay(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] outline-none focus:border-terracotta/50 focus:bg-white"
                  >
                    {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                      <option key={day} value={day}>
                        {t(day)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                    {t("payoutDelay")}
                  </label>
                  <input
                    defaultValue="2"
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-cream/40 px-3 text-[14.5px] outline-none focus:border-terracotta/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1 border-t border-line/80 pt-3">
                <SettingToggle
                  title={t("autoApproveCooks")}
                  description={t("autoApproveCooksDesc")}
                  checked={autoApprove}
                  onChange={setAutoApprove}
                />
                <SettingToggle
                  title={t("requireVerification")}
                  description={t("requireVerificationDesc")}
                  checked={requireDocs}
                  onChange={setRequireDocs}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHead
              title={t("marketplaceRules")}
              subtitle={t("marketplaceRulesSub")}
              action={
                <span className="grid size-8 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <ShieldCheck className="size-4" />
                </span>
              }
            />
            <div className="p-4 pt-3 md:p-5 md:pt-4">
              <textarea
                value={rules}
                onChange={(event) => setRules(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-line bg-cream/40 p-3 text-[14px] leading-relaxed outline-none transition focus:border-terracotta/50 focus:bg-white focus:ring-2 focus:ring-terracotta/10"
              />
              <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-soft">
                <Info className="mt-0.5 size-3 shrink-0" />
                {t("rulesNote")}
              </p>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <AdminCard>
            <SectionHead
              title={t("notificationsTitle")}
              subtitle={t("notificationsDesc")}
              action={
                <span className="grid size-8 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <Sparkles className="size-4" />
                </span>
              }
            />
            <div className="space-y-1 p-4 pt-3 md:p-5 md:pt-4">
              <SettingToggle
                title={t("newCooks")}
                description={t("newCooksNotifDesc")}
                checked={newCooks}
                onChange={setNewCooks}
              />
              <SettingToggle
                title={t("flaggedReviews")}
                description={t("reviewDigestDesc")}
                checked={reviewDigest}
                onChange={setReviewDigest}
              />
              <SettingToggle
                title={t("payoutAlerts")}
                description={t("payoutDigestDesc")}
                checked={payoutDigest}
                onChange={setPayoutDigest}
              />
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHead title={t("environment")} subtitle={t("adminFooterNote")} />
            <div className="p-4 pt-3 md:p-5 md:pt-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: t("buildVersion"), value: "1.4.0" },
                  { label: t("region"), value: "NL · EU" },
                  { label: t("currencyLabel"), value: "EUR (€)" },
                  { label: t("timezone"), value: "CET" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-cream/40 p-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[13.5px] font-semibold text-charcoal">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-olive-50 p-3">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-olive">
                  <ServerCog className="size-3.5" />
                  {t("allSystemsOk")}
                </span>
                <Badge variant="success">{t("live")}</Badge>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHead title={t("dangerZone")} subtitle={t("dangerZoneSub")} />
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
                  checked={maintenance}
                  onCheckedChange={(next) => {
                    if (next) {
                      setMaintenanceOpen(true);
                    } else {
                      setMaintenance(false);
                    }
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

          <div className="rounded-2xl border border-dashed border-line-strong bg-white/50 p-4 text-[12.5px] leading-relaxed text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-charcoal">
              <Globe2 className="size-3.5" />
              {t("languages")}: Nederlands · English · العربية
            </span>
            <p className="mt-1.5">{t("adminFooterNote")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["NL", "EN", "AR"].map((code) => (
                <span
                  key={code}
                  className="rounded-full border border-line bg-cream px-2 py-0.5 text-[11.5px] font-bold text-muted"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          <MapPin className="size-3.5" />
          Darna B.V. · Rotterdam · KvK 87654321
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast(t("discarded"), { variant: "info" })}>
            {t("cancel")}
          </Button>
          <Button size="sm" onClick={save}>
            <Check className="size-4" />
            {t("saveSettings")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        onConfirm={() => {
          setMaintenance(true);
          setMaintenanceOpen(false);
          toast(t("maintenanceEnabled"), { description: t("maintenanceDesc"), variant: "info" });
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
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={title} />
    </div>
  );
}
