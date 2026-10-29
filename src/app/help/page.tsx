"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  Mail,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/misc";
import { PageHeader } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import { useCreateSupportTicketMutation } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Topic = "all" | "orders" | "payments" | "cooks" | "account";

const topics: {
  id: Topic;
  labelKey: string;
  icon: typeof ShoppingBag;
  count: number;
}[] = [
  { id: "orders", labelKey: "topicOrders", icon: ShoppingBag, count: 8 },
  { id: "payments", labelKey: "topicPayments", icon: CreditCard, count: 6 },
  { id: "cooks", labelKey: "topicCooks", icon: Sparkles, count: 5 },
  { id: "account", labelKey: "topicAccount", icon: UserRound, count: 4 },
];

export default function HelpPage() {
  const { t, toast, user } = useApp();
  const createTicketMutation = useCreateSupportTicketMutation();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>("all");
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");

  const faqs = useMemo(
    () => [
      { topic: "orders", question: t("help1q"), answer: t("help1a") },
      { topic: "orders", question: t("help2q"), answer: t("help2a") },
      { topic: "orders", question: t("help3q"), answer: t("help3a") },
      { topic: "payments", question: t("help4q"), answer: t("help4a") },
      { topic: "payments", question: t("help5q"), answer: t("help5a") },
      { topic: "cooks", question: t("help6q"), answer: t("help6a") },
      { topic: "account", question: t("help7q"), answer: t("help7a") },
      { topic: "account", question: t("help8q"), answer: t("help8a") },
    ],
    [t],
  );

  const filtered = faqs.filter((faq) => {
    const matchesTopic = topic === "all" || faq.topic === topic;
    const text = query.trim().toLowerCase();
    const matchesQuery =
      !text ||
      faq.question.toLowerCase().includes(text) ||
      faq.answer.toLowerCase().includes(text);
    return matchesTopic && matchesQuery;
  });

  return (
    <div className="pb-10 md:pb-16">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1080px] md:px-8 md:pt-10">
        <div className="md:hidden">
          <PageHeader title={t("helpTitle")} backHref="/profile" />
        </div>

        <div className="hidden items-end justify-between gap-6 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("support")}
            </p>
            <h1 className="mt-1.5 font-display text-[36px] font-semibold leading-tight text-charcoal">
              {t("helpTitle")}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{t("helpSub")}</p>
          </div>
          <Button variant="secondary" onClick={() => setContactOpen(true)}>
            <MessageCircle className="size-4" />
            {t("contactSupport")}
          </Button>
        </div>

        <div className="relative mt-4 md:mt-6">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-soft" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("helpSearchPh")}
            aria-label={t("helpSearchPh")}
            className="h-12 w-full rounded-2xl border border-line bg-white ps-10 pe-10 text-[15px] text-charcoal shadow-card outline-none transition placeholder:text-muted-soft focus:border-terracotta/40 focus:ring-4 focus:ring-terracotta/10 md:h-12 md:max-w-lg"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearSearch")}
              className="absolute end-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-cream-100 text-muted hover:text-charcoal md:start-[472px]"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {topics.map((item) => {
            const Icon = item.icon;
            const active = topic === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTopic(active ? "all" : item.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start rounded-2xl border p-3.5 text-start transition md:p-4",
                  active
                    ? "border-terracotta bg-terracotta text-white shadow-card"
                    : "border-line bg-white text-charcoal hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-xl",
                    active ? "bg-white/15 text-white" : "bg-cream-100 text-terracotta",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="mt-2.5 text-[14px] font-semibold leading-snug">
                  {t(item.labelKey)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-[12px]",
                    active ? "text-white/70" : "text-muted-soft",
                  )}
                >
                  {item.count} {t("articles")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[19px] font-semibold text-charcoal md:text-xl">
                {t("helpFaqTitle")}
              </h2>
              {topic !== "all" || query ? (
                <button
                  type="button"
                  onClick={() => {
                    setTopic("all");
                    setQuery("");
                  }}
                  className="text-[13px] font-semibold text-terracotta"
                >
                  {t("clearFiltersShort")}
                </button>
              ) : null}
            </div>

            {filtered.length ? (
              <Accordion items={filtered} />
            ) : (
              <div className="rounded-2xl border border-dashed border-line-strong bg-white/60 px-5 py-12 text-center">
                <HelpCircle className="mx-auto size-7 text-muted-soft" />
                <p className="mt-3 text-[15px] font-semibold text-charcoal">
                  {t("searchNoResultsTitle")}
                </p>
                <p className="mt-1 text-[13.5px] text-muted">
                  {t("searchNoResultsSub", { query })}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setTopic("all");
                  }}
                >
                  {t("clearFiltersShort")}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3 md:col-span-4">
            <div className="rounded-2xl bg-charcoal p-4 text-cream md:p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-white/10">
                <MessageCircle className="size-4" />
              </span>
              <p className="mt-3 text-[16px] font-semibold">{t("contactSupport")}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-cream/65">
                {t("supportResponseTime")}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-terracotta text-[13.5px] font-semibold text-white"
                >
                  <MessageCircle className="size-3.5" />
                  {t("chatWithUs")}
                </button>
                <a
                  href="mailto:hello@darna.nl"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 text-[13.5px] font-semibold text-cream"
                >
                  <Mail className="size-3.5" />
                  {t("emailUs")}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-soft">
                {t("popularTopics")}
              </p>
              <div className="mt-2.5 space-y-1">
                {[
                  { label: t("helpPopular1"), href: "/orders" },
                  { label: t("helpPopular2"), href: "/cart" },
                  { label: t("helpPopular3"), href: "/cook" },
                  { label: t("helpPopular4"), href: "/profile" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-1 py-2 text-[13.5px] font-medium text-charcoal transition hover:text-terracotta"
                  >
                    <ChevronRight className="size-3.5 text-muted-soft rtl:rotate-180" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-olive" />
                <p className="text-[13.5px] font-semibold text-charcoal">{t("trustSafety")}</p>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                {t("trustSafetyDesc")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="olive">{t("verifiedCooks")}</Badge>
                <Badge variant="outline">{t("securePayments")}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[12.5px] text-muted-soft">
              <Link href="/terms" className="hover:text-charcoal">
                {t("termsTitle")}
              </Link>
              <Link href="/privacy" className="hover:text-charcoal">
                {t("privacyTitle")}
              </Link>
              <Link href="/install" className="hover:text-charcoal">
                {t("getApp")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={t("contactSupport")}
        description={t("supportResponseTime")}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              if (!message.trim()) {
                toast(t("messageRequired"), { variant: "error" });
                return;
              }
              createTicketMutation.mutate({
                email: user?.email,
                message: message.trim(),
              });
              toast(t("messageSentSupport"), { description: t("responseTime") });
              setMessage("");
              setContactOpen(false);
            }}
          >
            {t("sendMessage")}
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
            <span className="grid size-9 place-items-center rounded-full bg-terracotta-50 text-terracotta">
              <PackageCheck className="size-4" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-charcoal">{t("orderSupport")}</p>
              <p className="text-[12.5px] text-muted">{t("orderSupportDesc")}</p>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-soft">
              {t("message")}
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder={t("helpMessagePlaceholder")}
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white p-3 text-[14px] leading-relaxed outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/10"
            />
          </div>
          <div className="rounded-xl bg-cream/70 p-3 text-[12.5px] leading-relaxed text-muted">
            {t("supportHours")}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
