"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Globe2, Sparkles, WifiOff } from "lucide-react";
import { BottomNav } from "@/components/shell/bottom-nav";
import { DesktopHeader } from "@/components/shell/desktop-header";
import { CookSidebar } from "@/components/shell/cook-sidebar";
import { SiteFooter } from "@/components/shell/site-footer";
import { LanguageSheet } from "@/components/app/language-sheet";
import { ConfirmDialog, ToastViewport } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import { getCook, getDish } from "@/lib/data";
import { cn } from "@/lib/utils";

const noChrome = ["/admin", "/splash", "/offline"];

const hideBottomNav = [
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/splash",
  "/admin",
  "/login",
  "/register",
];

function isCookArea(pathname: string) {
  const routes = [
    "/cook/dashboard",
    "/cook/orders",
    "/cook/dishes",
    "/cook/availability",
    "/cook/earnings",
    "/cook/profile",
  ];
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    t,
    lang,
    dir,
    pendingSwitch,
    confirmSwitch,
    cancelSwitch,
    toasts,
    dismissToast,
  } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const bare = noChrome.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const cook = isCookArea(pathname);
  const cookLanding = pathname === "/cook";
  const isApply = pathname.startsWith("/cook/apply");
  const navHidden =
    hideBottomNav.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/orders/") ||
    isApply ||
    cookLanding;

  if (bare) {
    return (
      <>
        {children}
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div dir={dir} className="min-h-dvh">
      {cook ? (
        <CookSidebar />
      ) : cookLanding || isApply ? (
        <CookLandingHeader onLanguage={() => setLangOpen(true)} />
      ) : (
        <DesktopHeader />
      )}

      <div
        className={cn(
          "min-h-dvh",
          cook && "md:ps-[248px]",
          !navHidden && "pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0",
        )}
      >
        {offline ? (
          <div className="flex items-center justify-center gap-2 bg-charcoal px-4 py-2 text-center text-[13.5px] font-medium text-cream">
            <WifiOff className="size-3.5" />
            {t("offlineTitle")} · {t("offlineSaved")}
          </div>
        ) : null}

        <main className="min-h-dvh">{children}</main>

        {!cook && !cookLanding && !isApply ? <SiteFooter /> : null}
      </div>

      {!navHidden ? (
        <BottomNav variant={cook ? "cook" : "customer"} />
      ) : null}

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />

      <ConfirmDialog
        open={Boolean(pendingSwitch)}
        onClose={cancelSwitch}
        onConfirm={confirmSwitch}
        title={t("differentCookTitle")}
        description={t("differentCookDesc", {
          cook: pendingSwitch
            ? getCook(getDish(pendingSwitch.dishId)?.cookId ?? "")?.name ?? ""
            : "",
        })}
        confirmLabel={t("replaceCart")}
        cancelLabel={t("keepCart")}
      />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <span className="sr-only" lang={lang}>
        {t("customerNavNote")}
      </span>
    </div>
  );
}

function CookLandingHeader({ onLanguage }: { onLanguage: () => void }) {
  const { t, lang } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-4 md:h-[72px] md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-[13px] bg-terracotta">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/daarik-logo.png"
              alt="Daarik"
              className="size-full object-cover"
            />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[22px] font-semibold tracking-[-0.03em] text-charcoal">
              Daarik
            </span>
            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase leading-none tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </span>
          </span>
        </Link>

        <nav className="ms-6 hidden items-center gap-5 text-[14.5px] font-semibold text-muted md:flex">
          <a href="#how" className="hover:text-charcoal">
            {t("howItWorks")}
          </a>
          <a href="#benefits" className="hover:text-charcoal">
            {t("cookBenefitsTitle")}
          </a>
          <a href="#faq" className="hover:text-charcoal">
            {t("faqTitle")}
          </a>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onLanguage}
            className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[13.5px] font-semibold text-charcoal"
            aria-label={t("languageSwitch")}
          >
            <Globe2 className="size-3.5 text-muted" />
            {lang.toUpperCase()}
          </button>
          <Link
            href="/cook/dashboard"
            className="hidden h-9 items-center rounded-full px-3 text-[14px] font-semibold text-muted hover:text-charcoal md:flex"
          >
            {t("alreadyCook")}
          </Link>
          <Link
            href="/cook/apply"
            className="flex h-9 items-center gap-1.5 rounded-full bg-terracotta px-3.5 text-[14px] font-semibold text-white shadow-[0_6px_16px_-10px_rgba(198,93,58,0.9)]"
          >
            <Sparkles className="size-3.5" />
            {t("applyNow")}
          </Link>
        </div>
      </div>
      <div className="border-t border-line/60 md:hidden">
        <div className="mx-auto flex h-8 max-w-[480px] items-center justify-center gap-4 px-4 text-[12.5px] font-semibold text-muted">
          <a href="#how">{t("howItWorks")}</a>
          <span className="size-0.5 rounded-full bg-line-strong" />
          <a href="#benefits">{t("cookBenefitsTitle")}</a>
          <span className="size-0.5 rounded-full bg-line-strong" />
          <a href="#faq">{t("faqTitle")}</a>
          <ChevronDown className="ms-auto size-3.5" />
        </div>
      </div>
    </header>
  );
}
