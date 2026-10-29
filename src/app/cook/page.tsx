"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChefHat,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/misc";
import { useApp } from "@/components/providers/app-provider";
import { DaarikScroll } from "@/components/cook/daarik-scroll";

const benefits = [
  { key: "benefit1", icon: CalendarClock },
  { key: "benefit2", icon: CircleDollarSign },
  { key: "benefit3", icon: Wallet },
  { key: "benefit4", icon: Clock3 },
];

export default function CookLandingPage() {
  const { t } = useApp();

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(70%_90%_at_15%_0%,#fbece5_0%,#faf6ef_55%,#faf6ef_100%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-8 px-4 pb-10 pt-8 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-8 md:pb-20 md:pt-16">
          <div className="text-center md:text-start">
            <Badge variant="soft" size="lg" className="mx-auto md:mx-0">
              <Sparkles className="size-3.5" />
              {t("cookLandingKicker")}
            </Badge>
            <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.06] tracking-[-0.03em] text-charcoal md:text-[52px]">
              {t("cookHeadline")}
            </h1>
            <p className="mx-auto mt-3 max-w-[360px] text-[15.5px] leading-relaxed text-muted md:mx-0 md:max-w-[480px] md:text-[17px]">
              {t("cookSub")}
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-2 md:flex-row md:items-center">
              <Link
                href="/cook/apply"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-terracotta px-6 text-[16px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(198,93,58,0.7)] transition hover:bg-terracotta-600 md:h-[52px] md:px-7"
              >
                {t("startApplication")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/cook/dashboard"
                className="flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-[14.5px] font-semibold text-charcoal transition hover:bg-cream md:h-[52px]"
              >
                {t("alreadyCook")}
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12.5px] font-medium text-muted md:justify-start">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-olive" />
                {t("pickupOnly")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-olive" />
                {t("benefit3")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-olive" />
                {t("verificationNote")}
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[400px] md:max-w-none">
            <div className="relative overflow-hidden rounded-[30px] border border-white/60 shadow-pop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/cook-hero.jpg"
                alt={t("sampleCookName")}
                className="aspect-[4/5] w-full object-cover md:aspect-[5/5.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-2xl bg-white/92 p-2.5 backdrop-blur-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/cook-rana.jpg"
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-charcoal">
                    {t("sampleCookName")}
                  </p>
                  <p className="flex items-center gap-1 text-[11.5px] text-muted">
                    <MapPin className="size-2.5" />
                    {t("cookTestimonialName")}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 rounded-full bg-saffron-50 px-2 py-1 text-[12px] font-bold text-[#8a5d13]">
                  <Star className="size-3 fill-saffron text-saffron" />
                  4.9
                </div>
              </div>
            </div>

            <div className="absolute -start-2 top-6 hidden rotate-[-4deg] rounded-2xl border border-line bg-white px-3 py-2 shadow-card md:block">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                {t("thisMonthLabel")}
              </p>
              <p className="text-[17px] font-semibold text-olive-600">€ 520,54</p>
            </div>
            <div className="absolute -end-3 bottom-24 hidden rotate-[3deg] rounded-2xl border border-line bg-white px-3 py-2 shadow-card md:block">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-charcoal">
                <HeartHandshake className="size-3.5 text-terracotta" />
                {t("heroBadge")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-y border-line/70 bg-white/60">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted md:justify-between md:px-8">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-olive" />
              {t("verificationNote")}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-olive" />
              {t("securePayment")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-olive" />
              {t("pickupOnly")}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 fill-saffron text-saffron" />
              {t("heroBadge")}
            </span>
          </div>
        </div>
      </section>

      <DaarikScroll />

      {/* BENEFITS + EARNINGS */}
      <section id="benefits" className="scroll-mt-24 bg-white/55 py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:px-8">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookBenefitsTitle")}
            </p>
            <h2 className="mt-2 max-w-[440px] font-display text-[28px] font-semibold leading-tight text-charcoal md:text-[38px]">
              {t("becomeCookTitle")}
            </h2>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.key}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3.5"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-olive-50 text-olive-600">
                      <Icon className="size-4" />
                    </span>
                    <p className="pt-0.5 text-[14px] font-medium leading-relaxed text-charcoal">
                      {t(benefit.key)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-line bg-cream/80 p-4">
              <h3 className="text-[15px] font-semibold text-charcoal">
                {t("requirementsTitle")}
              </h3>
              <ul className="mt-2.5 space-y-2">
                {["req1", "req2", "req3", "req4", "req5"].map((key) => (
                  <li key={key} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-olive" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-muted-soft">
                {t("eligibilityNote")}
              </p>
            </div>
          </div>

          {/* Earnings example */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="overflow-hidden rounded-[28px] border border-line bg-charcoal text-cream shadow-pop">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <div>
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-saffron">
                    {t("exampleEarnings")}
                  </p>
                  <p className="mt-1 text-[13.5px] text-cream/60">
                    {t("thisMonthLabel")}
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-full bg-white/10">
                  <Wallet className="size-5 text-saffron" />
                </span>
              </div>
              <div className="px-5 pb-2 pt-4">
                <p className="font-display text-[38px] font-semibold leading-none text-white">
                  € 476,00
                </p>
                <p className="mt-1 text-[12.5px] text-cream/55">
                  {t("exampleNet")}
                </p>
              </div>
              <div className="mt-3 space-y-2.5 px-5 pb-5 text-[13.5px]">
                <div className="flex justify-between text-cream/65">
                  <span>{t("exampleGross")}</span>
                  <span className="tabular-nums text-cream">€ 560,00</span>
                </div>
                <div className="flex justify-between text-cream/65">
                  <span>{t("exampleCommission")}</span>
                  <span className="tabular-nums text-cream">- € 84,00</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/15 pt-2.5">
                  <span className="font-medium text-cream">
                    {t("exampleNet")}
                  </span>
                  <span className="font-semibold text-saffron">€ 476,00</span>
                </div>
                <p className="pt-1 text-[11.5px] leading-relaxed text-cream/45">
                  {t("exampleEarningsNote")}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] border border-line bg-white p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-terracotta">
                <BadgeCheck className="size-3.5" />
                {t("exampleEarnings")}
              </p>
              <p className="mt-2 text-[14px] italic leading-relaxed text-charcoal">
                {t("cookTestimonial")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/cook-rana.jpg"
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-[12.5px] font-semibold text-charcoal">
                    {t("sampleCookName")}
                  </p>
                  <p className="text-[11.5px] text-muted">
                    {t("cookTestimonialName")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-[1000px] gap-7 px-4 md:grid-cols-[0.8fr_1.2fr] md:gap-12 md:px-8">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("faqTitle")}
            </p>
            <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight text-charcoal md:text-[38px]">
              {t("faqHeading")}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {t("cookFaqNote")}
            </p>
            <Link
              href="/help"
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-terracotta"
            >
              {t("helpCenter")}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
          <Accordion
            items={[
              { question: t("faq1q"), answer: t("faq1a") },
              { question: t("faq2q"), answer: t("faq2a") },
              { question: t("faq3q"), answer: t("faq3a") },
              { question: t("faq4q"), answer: t("faq4a") },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-12 md:px-8 md:pb-20">
        <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[32px] bg-terracotta px-6 py-9 text-center text-white md:px-12 md:py-14">
          <div
            aria-hidden
            className="absolute -end-16 -top-16 size-56 rounded-full border-[28px] border-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -start-10 size-48 rounded-full bg-white/10"
          />
          <div className="relative">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-white/15">
              <ChefHat className="size-5" />
            </span>
            <h2 className="mx-auto mt-4 max-w-[480px] font-display text-[29px] font-semibold leading-tight md:text-[38px]">
              {t("cookHeadline")}
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-relaxed text-white/80">
              {t("cookSub")}
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
              <Link
                href="/cook/apply"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-terracotta-700 transition hover:bg-cream"
              >
                {t("applyNow")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-[14.5px] font-semibold text-white transition hover:bg-white/10"
              >
                {t("openCustomerApp")}
              </Link>
            </div>
            <p className="mt-4 text-[11.5px] text-white/60">{t("noGuarantee")}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/70 bg-white/40 py-6">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-4 text-center md:flex-row md:px-8 md:text-start">
          <div>
            <p className="font-display text-[20px] font-semibold text-charcoal">
              Daarik
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{t("tagline")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[12.5px] font-medium text-muted">
            <Link href="/terms" className="hover:text-charcoal">
              {t("termsShort")}
            </Link>
            <Link href="/privacy" className="hover:text-charcoal">
              {t("privacyShort")}
            </Link>
            <Link href="/help" className="hover:text-charcoal">
              {t("helpCenter")}
            </Link>
            <Link href="/cook/apply" className="font-semibold text-terracotta">
              {t("applyNow")}
            </Link>
          </div>
          <p className="text-[11.5px] text-muted-soft">
            {t("allRightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
