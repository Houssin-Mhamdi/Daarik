"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

export default function SplashPage() {
  const router = useRouter();
  const { t } = useApp();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 5));
    }, 60);
    const timer = window.setTimeout(() => router.push("/"), 1700);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-cream">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/splash-tajine.jpg"
          alt=""
          className="size-full object-cover opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/60 via-cream/85 to-cream" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative">
          <span className="absolute -inset-4 rounded-[32px] bg-terracotta/10 blur-xl" />
          <span className="relative grid size-24 place-items-center overflow-hidden rounded-[26px] bg-terracotta shadow-[0_20px_40px_-18px_rgba(198,93,58,0.8)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/daarik-logo.png"
              alt="Daarik"
              className="size-full object-cover"
            />
          </span>
        </div>
        <p className="mt-5 font-display text-[38px] font-semibold leading-none tracking-[-0.04em] text-charcoal">
          Daarik
        </p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.28em] text-terracotta">
          {t("customerApp")}
        </p>
        <p className="mt-7 max-w-[240px] font-display text-[18px] italic leading-relaxed text-muted">
          {t("splashTagline")}
        </p>

        <div className="mt-10 flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-pulse rounded-full bg-terracotta/70"
              style={{ animationDelay: `${dot * 160}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="relative px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[320px]">
          <div className="h-1 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-terracotta transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Link
            href="/"
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-charcoal text-[14px] font-semibold text-cream transition hover:bg-charcoal-soft"
          >
            {t("openCustomerApp")}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
          <div className="mt-3 flex items-center justify-center gap-3 text-[11.5px] font-medium text-muted-soft">
            <Link href="/cook" className="hover:text-charcoal">
              {t("openCookApp")}
            </Link>
            <span className="size-0.5 rounded-full bg-line-strong" />
            <Link href="/admin" className="hover:text-charcoal">
              {t("openAdmin")}
            </Link>
            <span className="size-0.5 rounded-full bg-line-strong" />
            <Link href="/install" className="hover:text-charcoal">
              {t("installDarna")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
