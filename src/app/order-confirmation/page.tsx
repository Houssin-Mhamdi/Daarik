"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ChefHat,
  Clock3,
  MapPin,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { useApp } from "@/components/providers/app-provider";
import {
  cookName,
  customerOrders,
  getDish,
  loc,
  orderSubtotal,
  pickupOptions,
  type OrderItem,
} from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

export default function OrderConfirmationPage() {
  const { t, lang, lastOrder, toast, serviceFee } = useApp();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const fallback = customerOrders[0];

  const items: OrderItem[] = lastOrder?.items ?? fallback.items;
  const cookId = lastOrder?.cookId ?? fallback.cookId;
  const pickupId = lastOrder?.pickup ?? fallback.pickup;
  const pickupTime = lastOrder?.pickupTime ?? fallback.pickupTime;
  const code = lastOrder?.code ?? fallback.code;
  const email = lastOrder?.email ?? "sarah.devries@example.nl";

  const pickup = pickupOptions.find((option) => option.id === pickupId);
  const subtotal = orderSubtotal(items);
  const total = lastOrder?.total ?? subtotal + serviceFee;

  const lines = useMemo(
    () =>
      items
        .map((item) => ({ item, dish: getDish(item.dishId) }))
        .filter((line) => line.dish),
    [items],
  );

  function addReminder() {
    if (!pickup) return;
    const [hour, minute] = pickupTime.split(":").map(Number);
    const date = pickup.date.replace(/-/g, "");
    const start = `${date}T${String(hour).padStart(2, "0")}${String(
      minute,
    ).padStart(2, "0")}00`;
    const endHour = String(hour + 1).padStart(2, "0");
    const end = `${date}T${endHour}${String(minute).padStart(2, "0")}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Darna//Pickup//EN",
      "BEGIN:VEVENT",
      `UID:${code}@darna.app`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Darna pickup ${code}`,
      `DESCRIPTION:Pickup from ${cookName(cookId)}. Order ${code}.`,
      `LOCATION:${pickup.shortDay[lang]} ${pickupTime} - ${t(
        "exactAddressNote",
      )}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `darna-${code}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
    setAdded(true);
    toast(t("pickupReminder"), { description: t("prepareNote") });
  }

  return (
    <div className="min-h-dvh bg-cream pb-10">
      {/* soft celebratory backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(60%_70%_at_50%_0%,#fbe6dc_0%,#faf6ef_70%)]"
      />

      <div className="relative mx-auto w-full max-w-[480px] px-4 pt-[max(22px,env(safe-area-inset-top,0px))] md:max-w-[880px] md:px-8 md:pt-16">
        <div className="hidden justify-center md:flex">
          <Link
            href="/"
            className="font-display text-[28px] font-semibold tracking-[-0.03em] text-charcoal"
          >
            Darna
          </Link>
        </div>

        <div
          className={cn(
            "flex flex-col items-center pt-6 text-center transition-all duration-700 md:pt-10",
            show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          <div className="relative">
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-olive/10 [animation-duration:2.4s]" />
            <div className="grid size-[76px] place-items-center rounded-full bg-olive text-white shadow-[0_16px_36px_-16px_rgba(105,118,83,0.8)] animate-pop">
              <Check className="size-9" strokeWidth={2.5} />
            </div>
            <span className="absolute -end-1 -top-1 grid size-7 place-items-center rounded-full border-[3px] border-cream bg-terracotta text-white">
              <Sparkles className="size-3.5" />
            </span>
          </div>

          <h1 className="mt-5 font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-charcoal md:text-[42px]">
            {t("orderConfirmedTitle")}
          </h1>
          <p className="mt-2 max-w-[330px] text-[15px] leading-relaxed text-muted md:max-w-md md:text-[16px]">
            {t("orderConfirmedSub")}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[13.5px] font-semibold text-charcoal shadow-sm">
            <Receipt className="size-3.5 text-terracotta" />
            {t("orderNumber")}
            <span className="tabular-nums">{code}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:mt-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="space-y-3">
            {/* Pickup card */}
            <Card className="overflow-hidden animate-fade-up [animation-delay:120ms]">
              <div className="flex items-center justify-between gap-2 border-b border-line/70 bg-olive-50/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-olive text-white">
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-olive-600">
                      {t("pickupDetails")}
                    </p>
                    <p className="text-[15.5px] font-semibold text-charcoal">
                      {pickup ? loc(pickup.day, lang) : ""}
                    </p>
                  </div>
                </div>
                <Badge variant="olive" size="sm">
                  <Clock3 className="size-3" />
                  {pickupTime}
                </Badge>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/img/cook-${cookId}.jpg`}
                    alt={cookName(cookId)}
                    className="size-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {t("yourCook")}
                    </p>
                    <p className="truncate text-[15.5px] font-semibold text-charcoal">
                      {cookName(cookId)}
                    </p>
                  </div>
                  <Link
                    href={`/cook/${cookId}`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13.5px] font-semibold text-charcoal transition hover:bg-cream"
                  >
                    <MessageCircle className="size-3.5 text-terracotta" />
                    {t("contactCook")}
                  </Link>
                </div>

                <div className="flex items-start gap-2 rounded-2xl bg-cream/70 p-3">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-charcoal">
                      {t("exactAddressNote")}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                      {t("prepareNote")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={added ? "secondary" : "outline"}
                    size="sm"
                    className="h-10 flex-1"
                    onClick={addReminder}
                  >
                    {added ? (
                      <Check className="size-3.5 text-olive" />
                    ) : (
                      <CalendarPlus className="size-3.5" />
                    )}
                    {added ? t("savePreferences") : t("pickupReminder")}
                  </Button>
                  <Button
                    size="sm"
                    className="h-10 flex-1"
                    onClick={() => router.push(`/orders/${fallback.id}`)}
                  >
                    {t("viewOrder")}
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            </Card>

            <p className="px-2 text-center text-[12.5px] leading-relaxed text-muted">
              {t("confirmationSent", { email })}
            </p>
          </div>

          {/* Receipt */}
          <Card className="animate-fade-up p-4 [animation-delay:200ms]">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-cream-100 text-terracotta">
                <ChefHat className="size-4" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-charcoal">
                  {t("orderSummary")}
                </h2>
                <p className="text-[12.5px] text-muted">
                  {t("pickupOnly")} · {t("oneCookNote")}
                </p>
              </div>
            </div>

            <div className="mt-3 divide-y divide-line/70">
              {lines.map(({ item, dish }) => (
                <div key={item.dishId} className="flex gap-2.5 py-2.5">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish!.image}
                      alt={loc(dish!.name, lang)}
                      className="size-full object-cover"
                    />
                    <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-charcoal text-[11.5px] font-bold text-white">
                      {item.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[14px] font-semibold text-charcoal">
                      {loc(dish!.name, lang)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {dish!.serves} {t("people")}
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-charcoal">
                    {formatPrice(dish!.price * item.qty, lang)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-2 border-t border-line pt-3 text-[13.5px]">
              <div className="flex justify-between text-muted">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-charcoal">
                  {formatPrice(subtotal, lang)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t("serviceFee")}</span>
                <span className="font-medium text-charcoal">
                  {formatPrice(serviceFee, lang)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2.5 text-[16px]">
                <span className="font-semibold text-charcoal">{t("total")}</span>
                <span className="font-semibold text-terracotta">
                  {formatPrice(total, lang)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[12px] text-olive-600">
                <ShieldCheck className="size-3" />
                {t("billingNote")}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-5 flex flex-col gap-2 md:mt-8 md:flex-row md:justify-center">
          <Button
            variant="outline"
            className="h-12 w-full md:w-auto md:px-6"
            onClick={() => router.push("/")}
          >
            {t("backHome")}
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full text-muted md:w-auto"
            onClick={() => router.push("/orders")}
          >
            {t("myOrders")}
          </Button>
        </div>

        <p className="mt-4 text-center text-[13px] italic text-muted md:mt-8">
          {t("thanks")}
        </p>
      </div>
    </div>
  );
}
