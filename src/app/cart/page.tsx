"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Clock3,
  Info,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/ui/controls";
import { ConfirmDialog, EmptyState } from "@/components/ui/overlays";
import { StickyActionBar } from "@/components/ui/misc";
import { PickupPicker } from "@/components/app/pickup-picker";
import { useApp } from "@/components/providers/app-provider";
import { getCook, getDish, loc, pickupOptions, orderSubtotal } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const {
    t,
    lang,
    dir,
    cart,
    cartCount,
    cartCookId,
    setQty,
    removeFromCart,
    clearCart,
    toast,
    pickup,
    setPickup,
    cartNote,
    setCartNote,
    serviceFee,
  } = useApp();
  const [clearOpen, setClearOpen] = useState(false);

  const lines = cart
    .map((line) => ({ line, dish: getDish(line.dishId) }))
    .filter((item) => item.dish);
  const cook = cartCookId ? getCook(cartCookId) : undefined;
  const subtotal = orderSubtotal(cart);
  const total = subtotal + (cart.length ? serviceFee : 0);

  const availablePickups = useMemo(() => {
    if (!lines.length) return [];
    return pickupOptions
      .filter((option) =>
        lines.every((item) => item.dish?.pickup.includes(option.id)),
      )
      .map((option) => option.id);
  }, [lines]);

  useEffect(() => {
    if (availablePickups.length && !availablePickups.includes(pickup)) {
      setPickup(availablePickups[0]);
    }
  }, [availablePickups, pickup, setPickup]);

  if (!lines.length) {
    return (
      <div className="px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:mx-auto md:max-w-[1240px] md:px-8 md:pt-8">
        <div className="flex h-12 items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="grid size-10 place-items-center rounded-full text-charcoal hover:bg-cream-100"
            aria-label={t("back")}
          >
            <ArrowLeft className={cn("size-5", dir === "rtl" && "rotate-180")} />
          </button>
          <h1 className="ms-1 text-[17px] font-semibold text-charcoal md:hidden">
            {t("cartTitle")}
          </h1>
        </div>
        <EmptyState
          className="mt-6"
          icon={<ShoppingBag className="size-7" />}
          title={t("cartEmptyTitle")}
          description={t("cartEmptySub")}
          action={
            <Button onClick={() => router.push("/explore")}>
              {t("startShopping")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-10">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1240px] md:px-8 md:pt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal hover:bg-cream-100 md:hidden"
              aria-label={t("back")}
            >
              <ArrowLeft className={cn("size-5", dir === "rtl" && "rotate-180")} />
            </button>
            <div>
              <h1 className="font-sans text-[18px] font-semibold text-charcoal md:font-display md:text-[36px]">
                {t("cartTitle")}
              </h1>
              <p className="hidden text-sm text-muted md:block">
                {t("oneCookNote")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-muted transition hover:bg-cream-100 hover:text-charcoal"
          >
            <Trash2 className="size-3.5" />
            {t("clearCart")}
          </button>
        </div>

        <div className="mt-4 items-start gap-7 md:grid md:grid-cols-[1fr_380px]">
          <div>
            {/* Cook card */}
            {cook ? (
              <div className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-3.5 shadow-card">
                <Link href={`/cook/${cook.id}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cook.avatar}
                    alt={cook.name}
                    className="size-12 rounded-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-terracotta">
                    {t("orderFrom")}
                  </p>
                  <Link
                    href={`/cook/${cook.id}`}
                    className="mt-0.5 block truncate text-[15.5px] font-semibold text-charcoal"
                  >
                    {cook.name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                    <MapPin className="size-3" />
                    {cook.pickupArea[lang]} · {cook.city}
                  </p>
                </div>
                <Badge variant="olive" size="sm">
                  <ChefHat className="size-3" />
                  {t("pickupOnly")}
                </Badge>
              </div>
            ) : null}

            <div className="mt-3 space-y-2.5">
              {lines.map(({ line, dish }) => {
                if (!dish) return null;
                return (
                  <div
                    key={line.dishId}
                    className="flex gap-3 rounded-[22px] border border-line bg-white p-3 shadow-card"
                  >
                    <Link
                      href={`/dish/${dish.id}`}
                      className="size-[78px] shrink-0 overflow-hidden rounded-2xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dish.image}
                        alt={loc(dish.name, lang)}
                        className="size-full object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/dish/${dish.id}`}
                            className="line-clamp-1 text-[15px] font-semibold text-charcoal"
                          >
                            {loc(dish.name, lang)}
                          </Link>
                          <p className="mt-0.5 text-[12.5px] text-muted">
                            {dish.serves} {t("people")} ·{" "}
                            {loc(dish.prepTime, lang)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={t("remove")}
                          onClick={() => {
                            removeFromCart(dish.id);
                            toast(t("itemRemoved"));
                          }}
                          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-soft transition hover:bg-cream-100 hover:text-charcoal"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper
                          value={line.qty}
                          onChange={(next) => {
                            setQty(dish.id, next);
                            if (next < line.qty) toast(t("qtyUpdated"));
                          }}
                          min={1}
                          max={dish.portionsLeft}
                          size="sm"
                        />
                        <p className="text-[16px] font-semibold text-charcoal">
                          {formatPrice(dish.price * line.qty, lang)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href={cook ? `/cook/${cook.id}` : "/explore"}
              className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong text-[14px] font-semibold text-terracotta"
            >
              + {t("addMore")}
            </Link>

            {/* Pickup */}
            <div className="mt-5 rounded-[22px] border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-charcoal">
                  {t("pickupDetails")}
                </h2>
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                  <Clock3 className="size-3" />
                  {t("cartPickupHint")}
                </span>
              </div>
              <div className="mt-3">
                <PickupPicker available={availablePickups} compact />
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                {t("pickupNote")}
              </p>
            </div>

            {/* Note */}
            <div className="mt-3 rounded-[22px] border border-line bg-white p-4 shadow-card">
              <label
                htmlFor="cart-note"
                className="text-[15px] font-semibold text-charcoal"
              >
                {t("noteForCook")}{" "}
                <span className="font-normal text-muted-soft">
                  ({t("optional")})
                </span>
              </label>
              <textarea
                id="cart-note"
                value={cartNote}
                onChange={(event) => setCartNote(event.target.value)}
                rows={3}
                placeholder={t("notePlaceholder")}
                className="mt-2 w-full resize-none rounded-2xl border border-line bg-cream/40 p-3 text-[14.5px] leading-relaxed outline-none transition placeholder:text-muted-soft focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10"
              />
            </div>

            <p className="mt-3 flex items-start gap-1.5 px-1 text-[12.5px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
              {t("cartServiceNote")}
            </p>
          </div>

          {/* Summary */}
          <aside className="mt-5 md:mt-0 md:sticky md:top-24">
            <div className="rounded-[24px] border border-line bg-white p-4 shadow-card">
              <h2 className="text-[17px] font-semibold text-charcoal">
                {t("orderSummary")}
              </h2>
              <div className="mt-3 space-y-2.5 text-[14.5px]">
                <div className="flex justify-between">
                  <span className="text-muted">
                    {t("subtotal")} ·{" "}
                    {cartCount === 1
                      ? t("cartOneItem")
                      : t("cartItems", { count: cartCount })}
                  </span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(subtotal, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("serviceFee")}</span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(serviceFee, lang)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-[16px]">
                  <span className="font-semibold text-charcoal">
                    {t("total")}
                  </span>
                  <span className="font-semibold text-terracotta">
                    {formatPrice(total, lang)}
                  </span>
                </div>
              </div>
              <Button
                className="mt-4 hidden w-full md:flex"
                size="lg"
                onClick={() => router.push("/checkout")}
              >
                {t("checkoutBtn")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
              <div className="mt-3 space-y-2 border-t border-line pt-3 text-[12.5px] text-muted">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-olive" />
                  {t("securePayment")}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-terracotta" />
                  {t("oneCookNote")}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-terracotta-50 p-3.5">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-terracotta-700">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {t("cartServiceNote")}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden">
        <StickyActionBar>
          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-[0.1em] text-muted">
              {t("total")}
            </p>
            <p className="text-[20px] font-semibold leading-tight text-charcoal">
              {formatPrice(total, lang)}
            </p>
          </div>
          <Button
            className="h-12 flex-1"
            onClick={() => router.push("/checkout")}
          >
            {t("checkoutBtn")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </StickyActionBar>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setClearOpen(false);
          toast(t("itemRemoved"));
        }}
        title={t("clearCartTitle")}
        description={t("clearCartDesc")}
        confirmLabel={t("clearCart")}
        cancelLabel={t("cancel")}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
