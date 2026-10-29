"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Download,
  Home,
  MoonStar,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { InstallSteps } from "@/components/app/install-prompt";
import { useApp } from "@/components/providers/app-provider";

export default function InstallPage() {
  const { t, toast } = useApp();

  const install = () => {
    toast(t("installHint"), { description: t("pwaNote"), variant: "info" });
  };

  return (
    <div className="pb-12 md:pb-16">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1080px] md:px-8 md:pt-8">
        <div className="md:hidden">
          <PageHeader title={t("installTitle")} backHref="/profile" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-10 md:pt-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-50 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.12em] text-terracotta-700">
              <Smartphone className="size-3" />
              PWA
            </span>
            <h1 className="mt-3 font-display text-[32px] font-semibold leading-[1.1] text-charcoal md:text-[44px]">
              {t("installTitle")}
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted md:text-[16px]">
              {t("installSub")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button size="lg" onClick={install}>
                <Download className="size-4" />
                {t("installButton")}
              </Button>
              <Link
                href="/"
                className="inline-flex h-12 items-center gap-1.5 rounded-full px-3 text-[14.5px] font-semibold text-muted transition hover:text-charcoal"
              >
                {t("pwaWorksEverywhere")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: Zap, label: t("benefitsFast") },
                { icon: WifiOff, label: t("benefitsOffline") },
                { icon: Home, label: t("benefitsHome") },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.label}
                    className="rounded-2xl border border-line bg-white p-3 text-center"
                  >
                    <Icon className="mx-auto size-4 text-terracotta" />
                    <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-charcoal">
                      {benefit.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[320px] md:max-w-[360px]">
            <div className="absolute inset-x-8 bottom-0 top-8 rounded-[48px] bg-terracotta-50 blur-2xl" />
            <div className="relative rounded-[42px] border-[7px] border-charcoal bg-charcoal p-1.5 shadow-pop">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[33px] bg-cream">
                <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-charcoal" />
                <div className="relative h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/img/splash-tajine.jpg"
                    alt="Darna app"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-transparent to-charcoal/70" />
                  <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
                    <span className="grid size-16 place-items-center rounded-[20px] bg-cream/95 shadow-xl">
                      <span className="font-arabic text-[36px] font-semibold leading-none text-terracotta">
                        د
                      </span>
                    </span>
                    <p className="mt-3 font-display text-[28px] font-semibold tracking-[-0.03em] text-cream">
                      Darna
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cream/70">
                      {t("cookApp")}
                    </p>
                    <p className="mt-10 font-display text-[15px] italic text-cream/80">
                      {t("splashTagline")}
                    </p>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full bg-cream/90 py-2 text-[11px] font-semibold text-charcoal backdrop-blur">
                    <Sparkles className="size-3 text-terracotta" />
                    {t("pwaPreviewTitle")}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -end-2 top-16 hidden rounded-xl border border-line bg-white px-2.5 py-2 shadow-card md:block">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-charcoal">
                <Bell className="size-3 text-terracotta" />
                {t("newOrderNote")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-4 md:mt-12 md:grid-cols-12">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card md:col-span-5 md:p-5">
            <h2 className="text-[18px] font-semibold text-charcoal">{t("addToHome")}</h2>
            <p className="mt-1 text-[13.5px] text-muted">{t("installSub")}</p>
            <div className="mt-4">
              <InstallSteps />
            </div>
            <div className="mt-4 space-y-2 border-t border-line/80 pt-3 text-[13px]">
              <p className="flex items-start gap-2 text-muted">
                <Share className="mt-0.5 size-3.5 shrink-0 text-charcoal" />
                {t("installIos")}
              </p>
              <p className="flex items-start gap-2 text-muted">
                <Download className="mt-0.5 size-3.5 shrink-0 text-charcoal" />
                {t("installAndroid")}
              </p>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: WifiOff,
                  title: t("offlineTitle"),
                  desc: t("offlineSub"),
                  href: "/offline",
                  link: t("offlineScreen"),
                },
                {
                  icon: MoonStar,
                  title: t("splashScreen"),
                  desc: t("splashTagline"),
                  href: "/splash",
                  link: t("preview"),
                },
                {
                  icon: Bell,
                  title: t("notificationsTitle"),
                  desc: t("notificationsDesc"),
                  href: "/profile",
                  link: t("manageNotifications"),
                },
                {
                  icon: Smartphone,
                  title: t("statusBar"),
                  desc: t("pwaNote"),
                  href: "/profile",
                  link: t("viewDesignSystem"),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-2xl border border-line bg-white p-4 transition hover:border-line-strong hover:shadow-card"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-cream-100 text-terracotta">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-2.5 text-[14.5px] font-semibold text-charcoal">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                      {item.desc}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-terracotta">
                      {item.link}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-olive-50 p-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-olive text-white">
                <Check className="size-3.5" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-olive-600">
                  {t("pwaWorksEverywhere")}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-olive-600/80">
                  {t("pwaNote")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-2xl border border-dashed border-line-strong bg-white/50 px-4 py-3 text-[12.5px] text-muted sm:flex-row">
          <span className="inline-flex items-center gap-1.5">
            <Badge variant="outline">PWA</Badge>
            {t("pwaPreviewSub")}
          </span>
          <div className="flex gap-3">
            <Link href="/offline" className="font-semibold text-charcoal hover:text-terracotta">
              {t("offlineScreen")}
            </Link>
            <Link href="/splash" className="font-semibold text-charcoal hover:text-terracotta">
              {t("splashScreen")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
