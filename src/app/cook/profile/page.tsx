"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Camera,
  Check,
  ChefHat,
  Eye,
  Globe2,
  Info,
  MapPin,
  Pause,
  Pencil,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { Card, SettingRow } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import { cookUser, cuisines, getCook, loc } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function CookProfilePage() {
  const { t, lang, toast } = useApp();
  const router = useRouter();
  const cook = getCook("rana")!;
  const [name, setName] = useState(cook.name);
  const [bio, setBio] = useState(cook.bio[lang]);
  const [instructions, setInstructions] = useState(cook.instructions[lang]);
  const [cuisineIds, setCuisineIds] = useState<string[]>(cook.cuisineIds);
  const [paused, setPaused] = useState(false);
  const [newOrders, setNewOrders] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [reviews, setReviews] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  return (
    <div className="pb-8 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1120px] md:px-8 md:pt-10">
        <CookMobileHeader title={t("cookProfileTitle")} subtitle={t("cookProfileSub")} />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("cookProfileTitle")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">{t("cookProfileSub")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/cook/rana">
              <Button variant="outline" size="sm">
                <Eye className="size-3.5" />
                {t("previewProfile")}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => toast(t("profileSaved"))}
            >
              <Check className="size-3.5" />
              {t("saveProfile")}
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-4 md:mt-5 md:grid-cols-[360px_1fr] md:items-start md:gap-6">
          {/* Public preview */}
          <aside className="md:sticky md:top-24">
            <Card className="overflow-hidden">
              <div className="relative h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cook.cover}
                  alt=""
                  className="size-full object-cover"
                />
                <span className="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-charcoal/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Eye className="size-3" />
                  {t("publicProfile")}
                </span>
              </div>
              <div className="-mt-8 px-4 pb-4">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cookUser.avatar}
                    alt={name}
                    className="size-[68px] rounded-full border-4 border-white object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => toast(t("photoSelected"))}
                    aria-label={t("editProfilePic")}
                    className="absolute -bottom-0.5 -end-0.5 grid size-6 place-items-center rounded-full border-2 border-white bg-terracotta text-white"
                  >
                    <Camera className="size-2.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <h2 className="font-display text-[21px] font-semibold leading-tight text-charcoal">
                    {name}
                  </h2>
                  {cook.verified ? (
                    <BadgeCheck className="size-4 text-olive" />
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                  <MapPin className="size-3" />
                  {cook.area[lang]} · {cook.city}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-saffron-50 px-2 py-1 text-[12px] font-semibold text-[#8a5d13]">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {cook.rating} ({cook.reviewCount})
                  </span>
                  <span className="text-[12px] text-muted">
                    {cook.orders} {t("orders")}
                  </span>
                </div>
                <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-muted">
                  {bio}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {cuisineIds.map((id) => {
                    const cuisine = cuisines.find((item) => item.id === id);
                    return cuisine ? (
                      <span
                        key={id}
                        className="rounded-full bg-cream-100 px-2 py-1 text-[11.5px] font-medium text-muted"
                      >
                        {cuisine.flag} {loc(cuisine.label, lang)}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-terracotta-50 px-3 py-2 text-[11.5px] leading-relaxed text-terracotta-700">
                  {t("publicPreviewNote")}
                </p>
                <Link
                  href="/cook/rana"
                  className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-charcoal"
                >
                  {t("viewPublicPage")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </Card>

            <div className="mt-3 hidden items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-card md:flex">
              <ShieldCheck className="size-4 text-olive" />
              <p className="text-[12px] leading-relaxed text-muted">
                {t("kitchenAddressNote")}
              </p>
            </div>
          </aside>

          <div className="space-y-4">
            {/* Public details */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("publicProfile")}
              </h2>
              <Card className="space-y-4 p-4">
                <Field label={t("dishName").replace(t("dishName"), t("fullName"))} htmlFor="cook-name">
                  <Input
                    id="cook-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field label={t("kitchenStory")} htmlFor="cook-bio" hint={`${bio.length}/320`}>
                  <Textarea
                    id="cook-bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value.slice(0, 320))}
                    rows={4}
                  />
                </Field>
                <div>
                  <p className="text-[15px] font-semibold text-charcoal">
                    {t("cuisinesOffered")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cuisines.map((cuisine) => {
                      const active = cuisineIds.includes(cuisine.id);
                      return (
                        <button
                          key={cuisine.id}
                          type="button"
                          onClick={() =>
                            setCuisineIds((prev) =>
                              prev.includes(cuisine.id)
                                ? prev.filter((id) => id !== cuisine.id)
                                : [...prev, cuisine.id],
                            )
                          }
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[12.5px] font-semibold transition",
                            active
                              ? "border-terracotta bg-terracotta text-white"
                              : "border-line bg-white text-charcoal",
                          )}
                        >
                          {active ? <Check className="size-3" /> : null}
                          {cuisine.flag} {loc(cuisine.label, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label={t("languagesSpoken")} htmlFor="cook-languages">
                  <Select id="cook-languages" defaultValue="nl">
                    <option value="nl">Nederlands · العربية · English</option>
                    <option value="en">English · العربية · Nederlands</option>
                  </Select>
                </Field>
                <Field
                  label={t("pickupInstructionsLabel")}
                  htmlFor="cook-instructions"
                  hint={t("exactAddressNote")}
                >
                  <Textarea
                    id="cook-instructions"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    rows={3}
                    placeholder={t("pickupInstructionsPh")}
                  />
                </Field>
                <div className="flex items-center justify-between rounded-2xl bg-cream/60 p-3">
                  <div>
                    <p className="text-[13.5px] font-semibold text-charcoal">
                      {t("profileVisibility")}
                    </p>
                    <p className="text-[11.5px] text-muted">
                      {t("kitchenAddressNote")}
                    </p>
                  </div>
                  <Badge variant="olive" size="sm">
                    <Eye className="size-3" />
                    {t("publicProfile")}
                  </Badge>
                </div>
              </Card>
            </section>

            {/* Kitchen + payouts */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("kitchen")}
              </h2>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<MapPin className="size-4" />}
                  title={t("kitchenAddress")}
                  description={`${cookUser.name.split(" ")[0]} · ${cook.pickupArea[lang]}, ${cook.city}`}
                  right={
                    <span className="flex items-center gap-1 text-[11.5px] font-medium text-olive-600">
                      <ShieldCheck className="size-3" />
                      {t("verified")}
                    </span>
                  }
                  onClick={() => setEditOpen(true)}
                />
                <SettingRow
                  icon={<Banknote className="size-4" />}
                  title={t("payoutSettingsShort")}
                  description={t("accountEnding", { last4: "2109" })}
                  href="/cook/earnings"
                />
                <SettingRow
                  icon={<Globe2 className="size-4" />}
                  title={t("pickupInstructionsLabel")}
                  description={t("exactAddressNote")}
                  onClick={() => setEditOpen(true)}
                />
                <SettingRow
                  icon={<Store className="size-4" />}
                  title={t("previewProfile")}
                  href="/cook/rana"
                />
              </div>
            </section>

            {/* Notifications */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("cookNotifications")}
              </h2>
              <Card className="divide-y divide-line/70">
                <ToggleRow
                  icon={<Bell className="size-4" />}
                  title={t("newOrderAlert")}
                  description={t("newOrderAlertDesc")}
                  checked={newOrders}
                  onChange={(value) => {
                    setNewOrders(value);
                    toast(t("cookSettingsSaved"));
                  }}
                  label={t("newOrderAlert")}
                />
                <ToggleRow
                  icon={<Banknote className="size-4" />}
                  title={t("payoutAlerts")}
                  description={t("payoutAlertsDesc")}
                  checked={payoutAlerts}
                  onChange={(value) => {
                    setPayoutAlerts(value);
                    toast(t("cookSettingsSaved"));
                  }}
                  label={t("payoutAlerts")}
                />
                <ToggleRow
                  icon={<Star className="size-4" />}
                  title={t("reviewAlerts")}
                  description={t("reviewAlertsDesc")}
                  checked={reviews}
                  onChange={setReviews}
                  label={t("reviewAlerts")}
                />
              </Card>
            </section>

            {/* Pause selling */}
            <div className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-4 shadow-card">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  paused ? "bg-saffron-50 text-[#8a5d13]" : "bg-olive-50 text-olive-600",
                )}
              >
                <Pause className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-charcoal">
                  {t("pauseSelling")}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {t("pauseSellingDesc")}
                </p>
              </div>
              <Switch
                checked={paused}
                onCheckedChange={(value) => {
                  setPaused(value);
                  toast(value ? t("kitchenClosed") : t("kitchenOpen"), {
                    variant: value ? "info" : "success",
                  });
                }}
                label={t("pauseSelling")}
              />
            </div>

            {/* Account */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("accountManagement")}
              </h2>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<BadgeCheck className="size-4" />}
                  title={t("accountEmail")}
                  description="rana@example.nl"
                  right={
                    <Badge variant="olive" size="sm">
                      {t("emailVerified")}
                    </Badge>
                  }
                />
                <SettingRow
                  icon={<UtensilsCrossed className="size-4" />}
                  title={t("accountPhone")}
                  description="+31 6 24 18 33 90"
                  right={
                    <Badge variant="outline" size="sm">
                      {t("phoneVerified")}
                    </Badge>
                  }
                />
                <SettingRow
                  icon={<ChefHat className="size-4" />}
                  title={t("cookSupport")}
                  href="/help"
                />
                <SettingRow
                  icon={<Trash2 className="size-4" />}
                  title={t("deactivateAccount")}
                  description={t("deleteAccountDesc")}
                  destructive
                  onClick={() => setDeactivateOpen(true)}
                />
              </div>
            </section>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="h-11"
                onClick={() => toast(t("profileSaved"))}
              >
                <Check className="size-4" />
                {t("saveProfile")}
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => router.push("/")}
              >
                {t("switchToCustomer")}
              </Button>
            </div>

            <p className="text-center text-[11.5px] text-muted-soft">
              {t("cookSettingsSaved")} · {t("demoNotice")}
            </p>
          </div>
        </div>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("kitchenAddress")}
        description={t("kitchenAddressNote")}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setEditOpen(false);
              toast(t("profileSaved"));
            }}
          >
            {t("saveChanges")}
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label={t("addressLabel")} htmlFor="kitchen-street">
            <Input id="kitchen-street" defaultValue="Westzeedijk 112" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("postcodeShort")} htmlFor="kitchen-postcode">
              <Input id="kitchen-postcode" defaultValue="3016 AH" />
            </Field>
            <Field label={t("cityShort")} htmlFor="kitchen-city">
              <Input id="kitchen-city" defaultValue="Rotterdam" />
            </Field>
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
            {t("exactAddress")}
          </p>
        </div>
      </Sheet>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => {
          setDeactivateOpen(false);
          toast(t("accountDeleted"), { variant: "info" });
        }}
        title={t("deleteAccountTitle")}
        description={t("deleteAccountWarning")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("keepAccount")}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  label,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-100 text-charcoal">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold text-charcoal">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
