"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  ChefHat,
  CircleHelp,
  Download,
  FileText,
  Globe2,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UserRound,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { PageHeader, SettingRow, KeyValue } from "@/components/ui/misc";
import { LanguageSheet } from "@/components/app/language-sheet";
import { useApp } from "@/components/providers/app-provider";
import { currentUser, loc } from "@/lib/data";
import { langMeta } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { t, lang, toast, favorites, favoriteCooks, user, logout } = useApp();
  const router = useRouter();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [name, setName] = useState(user.name || currentUser.name);
  const [email, setEmail] = useState(user.email || currentUser.email);
  const [phone, setPhone] = useState(user.phone || currentUser.phone);

  return (
    <div className="pb-10 md:pb-16">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1080px] md:px-8 md:pt-10">
        <PageHeader
          title={t("profileTitle")}
          subtitle={t("myAccount")}
          eyebrow={t("account")}
          action={
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
              {t("editProfile")}
            </Button>
          }
        />

        <div className="md:grid md:grid-cols-[300px_1fr] md:gap-7">
          {/* Account card */}
          <aside className="md:sticky md:top-24 md:self-start">
            <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-card">
              <div className="h-20 bg-[linear-gradient(120deg,#f6ddd2_0%,#efe4d2_55%,#e6eadb_100%)]" />
              <div className="-mt-8 px-4 pb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar}
                  alt={name}
                  className="size-[68px] rounded-full border-4 border-white object-cover shadow-sm"
                />
                <h2 className="mt-2.5 font-display text-[21px] font-semibold leading-tight text-charcoal">
                  {name}
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                  <MapPin className="size-3" />
                  {currentUser.city} · {t("memberSince", { date: currentUser.since[lang] })}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <div>
                    <p className="text-[18px] font-semibold text-charcoal">
                      {favorites.length}
                    </p>
                    <p className="text-[11.5px] text-muted">{t("savedDishes")}</p>
                  </div>
                  <div className="border-x border-line">
                    <p className="text-[18px] font-semibold text-charcoal">
                      {favoriteCooks.length}
                    </p>
                    <p className="text-[11.5px] text-muted">{t("savedCooks")}</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold text-charcoal">8</p>
                    <p className="text-[11.5px] text-muted">{t("orders")}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-9 w-full"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                  {t("editDetails")}
                </Button>
              </div>
            </div>

            <div className="mt-3 hidden rounded-[22px] border border-line bg-white p-4 shadow-card md:block">
              <span className="grid size-9 place-items-center rounded-xl bg-terracotta-50 text-terracotta">
                <ChefHat className="size-4" />
              </span>
              <p className="mt-2.5 text-[15px] font-semibold text-charcoal">
                {t("becomeCookProfile")}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {t("becomeCookProfileDesc")}
              </p>
              <Link
                href="/cook"
                className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-terracotta text-[13.5px] font-semibold text-white"
              >
                {t("startApplication")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </aside>

          <div className="mt-4 min-w-0 space-y-4 md:mt-0">
            {/* Quick links mobile */}
            <div className="grid grid-cols-3 gap-2.5 md:hidden">
              {[
                { href: "/orders", icon: Package, label: t("myOrders") },
                { href: "/favorites", icon: Heart, label: t("favorites") },
                { href: "/cook", icon: ChefHat, label: t("becomeCook") },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white py-3 shadow-card"
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-cream-100 text-terracotta">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[12.5px] font-semibold text-charcoal">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Account */}
            <section>
              <h3 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("myAccount")}
              </h3>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<UserRound className="size-4" />}
                  title={t("personalInfo")}
                  description={`${name} · ${email}`}
                  onClick={() => setEditOpen(true)}
                />
                <SettingRow
                  icon={<MapPin className="size-4" />}
                  title={t("addressBook")}
                  description={`${currentUser.address}, ${currentUser.postcode} ${currentUser.city}`}
                  onClick={() => toast(t("savedChanges"))}
                />
                <SettingRow
                  icon={<ShieldCheck className="size-4" />}
                  title={t("privacySecurity")}
                  description={t("securityNote")}
                  right={
                    <Badge variant="olive" size="sm">
                      {t("emailVerified")}
                    </Badge>
                  }
                  onClick={() => toast(t("savedChanges"))}
                />
                <SettingRow
                  icon={<Sparkles className="size-4" />}
                  title={t("becomeCookProfile")}
                  description={t("becomeCookProfileDesc")}
                  href="/cook"
                    />
              </div>
            </section>

            {/* Preferences */}
            <section>
              <h3 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("preferences")}
              </h3>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<Globe2 className="size-4" />}
                  title={t("languageRegion")}
                  description={langMeta[lang].native}
                  right={
                    <Badge variant="outline" size="sm">
                      {langMeta[lang].short}
                    </Badge>
                  }
                  onClick={() => setLanguageOpen(true)}
                />
                <SettingRow
                  icon={<Bell className="size-4" />}
                  title={t("notificationsTitle")}
                  description={t("notificationsDesc")}
                  right={
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-muted">
                        {orderUpdates ? t("on") : t("off")}
                      </span>
                      <ChevronRight className="size-4 text-muted-soft rtl:rotate-180" />
                    </div>
                  }
                  href="#notifications"
                />
                <SettingRow
                  icon={<Smartphone className="size-4" />}
                  title={t("installDarna")}
                  description={t("installDesc")}
                  href="/install"
                  right={
                    <Badge variant="soft" size="sm">
                      {t("pwaWorksEverywhere")}
                    </Badge>
                  }
                />
                <SettingRow
                  icon={<Heart className="size-4" />}
                  title={t("savedDishes")}
                  description={t("favoritesSub")}
                  href="/favorites"
                />
              </div>
            </section>

            {/* Notifications detail */}
            <section id="notifications" className="scroll-mt-24">
              <h3 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("notificationsTitle")}
              </h3>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {t("orderUpdates")}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                      {t("orderUpdatesDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={orderUpdates}
                    onCheckedChange={(value) => {
                      setOrderUpdates(value);
                      toast(t("savedChanges"));
                    }}
                    label={t("orderUpdates")}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {t("offers")}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                      {t("offersDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={offers}
                    onCheckedChange={(value) => {
                      setOffers(value);
                      toast(t("savedChanges"));
                    }}
                    label={t("offers")}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {t("emailNotif")}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {email}
                    </p>
                  </div>
                  <Switch
                    checked={emailNotif}
                    onCheckedChange={setEmailNotif}
                    label={t("emailNotif")}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-charcoal">
                      {t("pushNotif")}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {t("installBannerSub")}
                    </p>
                  </div>
                  <Switch
                    checked={pushNotif}
                    onCheckedChange={setPushNotif}
                    label={t("pushNotif")}
                  />
                </div>
              </div>
            </section>

            {/* Support & legal */}
            <section>
              <h3 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("helpSupport")}
              </h3>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<CircleHelp className="size-4" />}
                  title={t("helpSupport")}
                  description={t("helpSub")}
                  href="/help"
                />
                <SettingRow
                  icon={<FileText className="size-4" />}
                  title={t("terms")}
                  href="/terms"
                />
                <SettingRow
                  icon={<ShieldCheck className="size-4" />}
                  title={t("privacy")}
                  href="/privacy"
                />
                <SettingRow
                  icon={<Download className="size-4" />}
                  title={t("installApp")}
                  description={t("pwaWorksEverywhere")}
                  href="/install"
                />
                <SettingRow
                  icon={<WifiOff className="size-4" />}
                  title={t("offlineTitle")}
                  description={t("offlineSaved")}
                  href="/offline"
                />
                <SettingRow
                  icon={<Smartphone className="size-4" />}
                  title={t("viewSplash")}
                  href="/splash"
                />
              </div>
            </section>

            <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-charcoal">
                    {t("appVersion")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {t("madeIn")}
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {t("demoMode")}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1"
                  onClick={() => setSignOutOpen(true)}
                >
                  <LogOut className="size-3.5" />
                  {t("signOut")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 flex-1 text-[#a13a28] hover:bg-[#fdf1ec]"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  {t("deleteAccount")}
                </Button>
              </div>
            </div>

            <p className="px-2 text-center text-[12px] leading-relaxed text-muted-soft">
              {t("prototypeFooter")}
            </p>
          </div>
        </div>
      </div>

      <LanguageSheet
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("editProfile")}
        description={t("personalInfo")}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setEditOpen(false);
              toast(t("savedChanges"));
            }}
          >
            {t("saveChanges")}
          </Button>
        }
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={name}
              className="size-[76px] rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => toast(t("photoSelected"))}
              aria-label={t("profilePhotoHint")}
              className="absolute -bottom-1 -end-1 grid size-7 place-items-center rounded-full border-2 border-white bg-terracotta text-white"
            >
              <Pencil className="size-3" />
            </button>
          </div>
          <p className="mt-2 text-[12px] text-muted">{t("profilePhotoHint")}</p>
        </div>

        <div className="mt-4 space-y-3">
          <Field label={t("fullName")} htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label={t("email")} htmlFor="profile-email" hint={t("emailVerified")}>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label={t("phone")} htmlFor="profile-phone">
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
            />
          </Field>
          <div className="rounded-2xl bg-cream-100 p-3">
            <KeyValue label={t("city")} value={currentUser.city} />
            <KeyValue
              label={t("address")}
              value={`${currentUser.address}, ${currentUser.postcode}`}
              className="mt-2"
            />
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          logout().finally(() => {
            setSignOutOpen(false);
            toast(t("signOut"), { variant: "info" });
            router.push("/login");
          });
        }}
        title={t("signOutTitle")}
        description={t("signOutDesc")}
        confirmLabel={t("signOut")}
        cancelLabel={t("cancel")}
        icon={<LogOut className="size-5" />}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          toast(t("accountDeleted"), { variant: "error" });
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
