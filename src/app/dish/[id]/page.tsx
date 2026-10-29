"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChefHat,
  ChevronRight,
  Clock3,
  Flame,
  Heart,
  Info,
  MapPin,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating, QuantityStepper } from "@/components/ui/controls";
import { Sheet, EmptyState } from "@/components/ui/overlays";
import { StickyActionBar } from "@/components/ui/misc";
import { DishCard } from "@/components/app/dish-card";
import { ReviewCard } from "@/components/app/review-card";
import { PickupPicker } from "@/components/app/pickup-picker";
import { useApp } from "@/components/providers/app-provider";
import {
  allergenNames,
  dietaryNames,
  dishesByCook,
  getCook,
  getCuisine,
  loc,
} from "@/lib/data";
import {
  useDishQuery,
  useReportDishMutation,
  useReviewsQuery,
} from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

export default function DishPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: dish } = useDishQuery(params.id);
  const { data: allReviews = [] } = useReviewsQuery({ dishId: params.id });
  const reportMutation = useReportDishMutation();
  const {
    t,
    lang,
    dir,
    cooks,
    dishes,
    addToCart,
    toggleFavorite,
    isFavorite,
    toast,
    pickup,
    setPickup,
  } = useApp();
  const [qty, setQty] = useState(1);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!dish) return;
    if (!dish.pickup.includes(pickup) && dish.pickup.length) {
      setPickup(dish.pickup[0]);
    }
  }, [dish, pickup, setPickup]);

  const cook = dish
    ? cooks.find((c) => c.id === dish.cookId) ?? getCook(dish.cookId)
    : undefined;
  const cuisine = dish ? getCuisine(dish.cuisineId) : undefined;
  const dishReviews = useMemo(
    () =>
      allReviews.filter(
        (review) =>
          review.dishId === dish?.id || review.cookId === dish?.cookId,
      ),
    [allReviews, dish],
  );
  const moreDishes = dish
    ? dishes
        .filter((item) => item.cookId === dish.cookId && item.id !== dish.id)
        .concat(dishesByCook(dish.cookId).filter((item) => item.id !== dish.id))
        .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)
    : [];

  if (!dish || !cook) {
    return (
      <div className="px-4 py-16">
        <EmptyState
          icon={<UtensilsCrossed className="size-7" />}
          title={t("dishNotFound")}
          description={t("emptyExploreSub")}
          action={
            <Button onClick={() => router.push("/explore")}>
              {t("startExploring")}
            </Button>
          }
        />
      </div>
    );
  }

  const favorite = isFavorite(dish.id);
  const soldOut = dish.portionsLeft <= 0;
  const max = Math.max(1, dish.portionsLeft);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: loc(dish.name, lang),
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast(t("toastLinkCopied"));
    } catch {
      toast(t("toastLinkCopied"));
    }
  };

  const add = () => {
    addToCart(dish.id, qty);
    setQtyOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="pb-28 md:pb-0">
      <div className="mx-auto w-full max-w-[1240px] md:px-8">
        <div className="grid items-start gap-8 md:grid-cols-[1fr_380px] md:pt-8">
          <div>
            {/* Hero */}
            <div className="relative -mx-0 h-[320px] overflow-hidden md:h-[440px] md:rounded-[32px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dish.image}
                alt={loc(dish.name, lang)}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/5 to-charcoal/25" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(12px,env(safe-area-inset-top,0px))] md:pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  aria-label={t("back")}
                  className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
                >
                  <ArrowLeft
                    className={cn("size-5", dir === "rtl" && "rotate-180")}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={share}
                    aria-label={t("share")}
                    className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
                  >
                    <Share2 className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const isAdded = toggleFavorite(dish.id);
                      toast(
                        isAdded ? t("toastFavAdded") : t("toastFavRemoved"),
                      );
                    }}
                    aria-pressed={favorite}
                    aria-label={favorite ? t("toastFavRemoved") : t("toastFavAdded")}
                    className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
                  >
                    <Heart
                      className={cn(
                        "size-[18px]",
                        favorite && "fill-terracotta text-terracotta",
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {dish.badge ? (
                    <Badge variant="glass" size="sm">
                      <Sparkles className="size-3 text-terracotta" />
                      {loc(dish.badge, lang)}
                    </Badge>
                  ) : null}
                  <Badge variant="dark" size="sm">
                    <Flame className="size-3 text-saffron" />
                    {dish.portionsLeft <= 3
                      ? t("onlyLeft", { count: dish.portionsLeft })
                      : t("portionsLeft")}
                  </Badge>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-[13px] font-bold text-charcoal backdrop-blur">
                  <Star className="size-3 fill-saffron text-saffron" />
                  {dish.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 -mt-6 rounded-t-[28px] bg-cream px-4 pb-4 pt-5 md:mt-6 md:rounded-none md:bg-transparent md:px-0 md:pt-0">
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.12em] text-terracotta">
                <span aria-hidden>{cuisine?.flag}</span>
                {cuisine ? loc(cuisine.label, lang) : null}
                <span className="text-line-strong">·</span>
                <span className="font-medium tracking-normal text-muted">
                  {loc(dish.prepTime, lang)} {t("prepTime").toLowerCase()}
                </span>
              </div>
              <h1 className="mt-1.5 font-display text-[30px] leading-[1.1] text-charcoal md:text-[38px]">
                {loc(dish.name, lang)}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted md:max-w-2xl md:text-sm">
                {loc(dish.desc, lang)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href={`/cook/${cook.id}`}
                  className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pe-3 ps-1 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cook.avatar}
                    alt={cook.name}
                    className="size-8 rounded-full object-cover"
                  />
                  <span>
                    <span className="flex items-center gap-1 text-[14px] font-semibold leading-tight text-charcoal">
                      {cook.name}
                      <BadgeCheck className="size-3.5 fill-olive text-white" />
                    </span>
                    <span className="block text-[12px] text-muted">
                      {cook.area[lang]} · {cook.city}
                    </span>
                  </span>
                  <ChevronRight className="size-3.5 text-muted-soft rtl:rotate-180" />
                </Link>
                <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
                  <Users className="size-3.5 text-terracotta" />
                  {t("serves")} {dish.serves}
                </span>
                <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
                  <Clock3 className="size-3.5 text-terracotta" />
                  {loc(dish.prepTime, lang)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-white p-3 text-center">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.1em] text-muted-soft">
                    {t("pickup")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-charcoal">
                    {t("pickupOnly")}
                  </p>
                </div>
                <div className="border-x border-line">
                  <p className="text-[12px] uppercase tracking-[0.1em] text-muted-soft">
                    {t("portionsLeft")}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-charcoal">
                    {dish.portionsLeft} / {dish.portions}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.1em] text-muted-soft">
                    {t("rating")}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[13.5px] font-semibold text-charcoal">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {dish.rating.toFixed(1)} ({dish.reviewCount})
                  </p>
                </div>
              </div>

              <section className="mt-6">
                <h2 className="text-[18px] font-semibold text-charcoal">
                  {t("ingredientList")}
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ingredient) => (
                    <span
                      key={loc(ingredient, lang)}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-[13.5px] text-charcoal"
                    >
                      {loc(ingredient, lang)}
                    </span>
                  ))}
                </div>
              </section>

              <section className="mt-5">
                <h2 className="text-[18px] font-semibold text-charcoal">
                  {t("allergenInfo")}
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {dish.allergens.length ? (
                    dish.allergens.map((allergen) => (
                      <Badge key={allergen} variant="soft" size="lg">
                        {loc(allergenNames[allergen], lang)}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="success" size="lg">
                      <ShieldCheck className="size-3" />
                      {t("noAllergens")}
                    </Badge>
                  )}
                  {dish.dietary.map((item) => (
                    <Badge key={item} variant="olive" size="lg">
                      {loc(dietaryNames[item], lang)}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {t("allergenNote")}
                </p>
              </section>

              <section className="mt-6 rounded-[22px] border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-charcoal">
                    {t("availablePickup")}
                  </h2>
                  <span className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-terracotta-700">
                    {t("pickupOnly")}
                  </span>
                </div>
                <div className="mt-3">
                  <PickupPicker available={dish.pickup} compact />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
                  <MapPin className="size-3.5 shrink-0 text-terracotta" />
                  {t("exactAddressNote")} · {cook.pickupArea[lang]}
                </p>
              </section>

              {moreDishes.length ? (
                <section className="mt-7">
                  <div className="flex items-end justify-between">
                    <h2 className="text-[21px] font-semibold text-charcoal">
                      {t("moreFromCook", { name: cook.name.split(" ")[0] })}
                    </h2>
                    <Link
                      href={`/cook/${cook.id}`}
                      className="text-[13.5px] font-semibold text-terracotta"
                    >
                      {t("viewCookProfile")}
                    </Link>
                  </div>
                  <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:px-0">
                    {moreDishes.map((item) => (
                      <DishCard
                        key={item.id}
                        dish={item}
                        className="w-[210px] shrink-0 md:w-auto"
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="mt-7">
                <div className="flex items-end justify-between">
                  <h2 className="text-[21px] font-semibold text-charcoal">
                    {t("reviewsFromBuyers")}
                  </h2>
                  <span className="flex items-center gap-1 text-[14px] text-charcoal">
                    <Star className="size-3.5 fill-saffron text-saffron" />
                    <span className="font-semibold">
                      {cook.rating.toFixed(1)}
                    </span>
                    <span className="text-muted">
                      ({cook.reviewCount})
                    </span>
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {dishReviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </section>

              <section className="mt-7 rounded-[24px] border border-line bg-white p-4 shadow-card md:flex md:items-center md:gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cook.avatar}
                  alt={cook.name}
                  className="size-14 rounded-full object-cover md:size-16"
                />
                <div className="mt-3 min-w-0 flex-1 md:mt-0">
                  <p className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.14em] text-terracotta">
                    <BadgeCheck className="size-3 fill-olive text-white" />
                    {t("verifiedCook")}
                  </p>
                  <p className="mt-0.5 text-[17px] font-semibold text-charcoal">
                    {t("cookKitchen", { name: cook.name.split(" ")[0] })}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
                    {loc(cook.bio, lang)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-saffron text-saffron" />
                      {cook.rating.toFixed(1)} · {cook.reviewCount}{" "}
                      {t("reviews")}
                    </span>
                    <span>{t("ordersCount", { count: cook.orders })}</span>
                    <span>{cook.area[lang]}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full md:mt-0 md:w-auto"
                  onClick={() => router.push(`/cook/${cook.id}`)}
                >
                  {t("viewCookProfile")}
                </Button>
              </section>

              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="mx-auto mt-6 flex items-center gap-1.5 text-[13px] font-medium text-muted-soft underline-offset-4 hover:text-charcoal hover:underline"
              >
                <Info className="size-3" />
                {t("reportDish")}
              </button>
            </div>
          </div>

          {/* Desktop sticky purchase card */}
          <aside className="hidden md:block md:sticky md:top-24">
            <div className="rounded-[26px] border border-line bg-white p-5 shadow-card">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                {t("price")}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-[36px] leading-none text-charcoal">
                  {formatPrice(dish.price, lang)}
                </span>
                <span className="text-[13px] text-muted">
                  {t("perPortion")}
                </span>
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {t("feeNote")} · {t("pickupOnly")}
              </p>

              <div className="mt-4 rounded-2xl bg-cream/70 p-3">
                <PickupPicker available={dish.pickup} compact />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-charcoal">
                  {t("quantity")}
                </span>
                <QuantityStepper
                  value={qty}
                  onChange={setQty}
                  max={max}
                  size="sm"
                />
              </div>

              <Button
                className="mt-4 w-full"
                size="lg"
                disabled={soldOut}
                onClick={add}
              >
                {soldOut
                  ? t("soldOut")
                  : `${t("addToCart")} · ${formatPrice(dish.price * qty, lang)}`}
              </Button>
              <Link
                href="/cart"
                className="mt-2 flex h-10 items-center justify-center rounded-full text-[14px] font-semibold text-muted transition hover:text-charcoal"
              >
                {t("viewCart")}
              </Link>

              <div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px] text-muted">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-olive" />
                  {t("securePayment")}
                </p>
                <p className="flex items-center gap-2">
                  <ChefHat className="size-3.5 text-terracotta" />
                  {t("cookedFresh")}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-terracotta" />
                  {t("exactAddress")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="md:hidden">
        <StickyActionBar>
          <button
            type="button"
            onClick={() => setQtyOpen(true)}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3"
          >
            <span className="text-[13px] font-medium text-muted">
              {t("quantity")}
            </span>
            <span className="grid size-6 place-items-center rounded-full bg-cream-100 text-[14px] font-bold text-charcoal">
              {qty}
            </span>
          </button>
          <Button className="h-12 flex-1" disabled={soldOut} onClick={add}>
            {soldOut ? (
              t("soldOut")
            ) : added ? (
              <>
                <span className="grid size-5 place-items-center rounded-full bg-white/20">
                  ✓
                </span>
                {t("addedToCart")}
              </>
            ) : (
              <>
                {t("addToCart")}
                <span className="ms-1 font-semibold">
                  {formatPrice(dish.price * qty, lang)}
                </span>
              </>
            )}
          </Button>
        </StickyActionBar>
      </div>

      <Sheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        title={t("quantitySheet")}
        description={t("maxPortions", { count: max })}
        footer={
          <Button className="w-full" onClick={add}>
            {t("addToCart")} · {formatPrice(dish.price * qty, lang)}
          </Button>
        }
      >
        <div className="flex items-center gap-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dish.image}
            alt={loc(dish.name, lang)}
            className="size-20 rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-charcoal">
              {loc(dish.name, lang)}
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              {dish.serves} {t("people")} · {loc(dish.prepTime, lang)}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-terracotta">
              {formatPrice(dish.price, lang)}{" "}
              <span className="text-[12px] font-normal text-muted">
                {t("perPortion")}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white p-3">
          <span className="text-[14.5px] font-medium text-charcoal">
            {t("portion")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              className="grid size-9 place-items-center rounded-full border border-line text-charcoal"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-5 text-center text-[17px] font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((value) => Math.min(max, value + 1))}
              className="grid size-9 place-items-center rounded-full bg-terracotta text-white"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[12.5px] text-muted">
          {t("onlyLeft", { count: dish.portionsLeft })}
        </p>
      </Sheet>

      <Sheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t("reportDish")}
        description={t("reportProblemDesc")}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              reportMutation.mutate({
                id: dish.id,
                reason: reportText || "Reported from dish page",
              });
              setReportOpen(false);
              setReportText("");
              toast(t("reportSent"));
            }}
          >
            {t("reportSubmit")}
          </Button>
        }
      >
        <div className="space-y-2 pt-1">
          {[
            "problemQuality",
            "problemMissing",
            "problemOther",
          ].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setReportText(key)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border p-3.5 text-start text-[14.5px] font-medium",
                reportText === key
                  ? "border-terracotta bg-terracotta-50/60 text-charcoal"
                  : "border-line bg-white text-charcoal",
              )}
            >
              {t(key)}
              <span
                className={cn(
                  "size-4 rounded-full border",
                  reportText === key
                    ? "border-terracotta bg-terracotta"
                    : "border-line-strong",
                )}
              />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
