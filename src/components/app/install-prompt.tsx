"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Share, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt({
  variant = "card",
  className,
}: {
  variant?: "card" | "banner";
  className?: string;
}) {
  const { t, toast } = useApp();
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem("darna.installDismissed") === "1";
    } catch {
      /* ignore */
    }
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem("darna.installDismissed", "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        toast(t("installedToast"));
        setVisible(false);
      }
      return;
    }
    toast(t("installHint"), { variant: "info" });
  };

  if (!visible) return null;

  if (variant === "banner") {
    return (
      <div className="fixed inset-x-0 bottom-[calc(66px+env(safe-area-inset-bottom,0px)+10px)] z-40 mx-auto w-full max-w-[480px] px-4 md:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-pop backdrop-blur-xl animate-fade-up">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-terracotta text-white">
            <Download className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-semibold text-charcoal">
              {t("installBannerTitle")}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {t("installBannerSub")}
            </p>
          </div>
          <Button size="sm" className="h-8 px-3 text-[13.5px]" onClick={install}>
            {t("installApp")}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("installLater")}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-soft hover:bg-cream-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "relative overflow-hidden rounded-[24px] border border-line bg-white p-4 shadow-card"
      }
    >
      <div className="absolute -end-6 -top-6 size-24 rounded-full bg-terracotta-50" />
      <div className="relative flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-terracotta text-white">
          <Download className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-charcoal">
            {t("installBannerTitle")}
          </p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">
            {t("installBannerSub")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={install}>
              {t("installApp")}
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-2.5 py-1.5 text-[13.5px] font-semibold text-muted hover:text-charcoal"
            >
              {t("installLater")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installLater")}
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-soft hover:bg-cream-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function InstallSteps() {
  const { t } = useApp();
  const steps = [
    { icon: <Sparkles className="size-4" />, text: t("installStep1") },
    { icon: <Share className="size-4" />, text: t("installStep2") },
    { icon: <Download className="size-4" />, text: t("installStep3") },
  ];
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => (
        <li key={step.text} className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
            {step.icon}
          </span>
          <span className="flex-1 text-[14.5px] leading-relaxed text-charcoal">
            {step.text}
          </span>
          <span className="text-[12px] font-bold text-muted-soft">
            {index + 1}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function InstallLink({ className }: { className?: string }) {
  const { t } = useApp();
  return (
    <Link
      href="/install"
      className={
        className ??
        "flex items-center gap-2 text-[14px] font-semibold text-terracotta"
      }
    >
      <Download className="size-3.5" />
      {t("installDarna")}
    </Link>
  );
}
