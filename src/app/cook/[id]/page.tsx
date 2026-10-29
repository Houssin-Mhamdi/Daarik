"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { Sheet, EmptyState } from "@/components/ui/overlays";
import { StickyActionBar } from "@/components/ui/misc";
import { DishCard } from "@/components/app/dish-card";
import { ReviewCard } from "@/components/app/review-card";
import { useApp } from "@/components/providers/app-provider";
import {
  cuisines,
  dishesByCook,
  getCook,
  loc,
  pickupOptions,
  reviews,
  type Dish,
} from "@/lib/data";
import { useCookQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function CookProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: cookData } = useCookQuery(params.id);
  const cook = cookData?.cook ?? getCook(params.id);
  const { t, lang, dir, toast, toggleFavoriteCook, isFavoriteCook } = useApp();
  const [tab, setTab] = useState<"dishesTab" | "reviewsTab" | "availabilityTab">(
    "dishesTab",
  );
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!cook) {
    return (
      <div className="px-4 py-16">
        <EmptyState
          icon={<UtensilsCrossed className="size-7" />}
          title={t("cookNotFound")}
          description={t("emptyExploreSub")}
          action={<Button onClick={() => router.push("/explore")}>{t("explore")}</Button>}
        />
      </div>
    );
  }

  const dishes: Dish[] = cookData?.dishes ?? dishesByCook(cook.id);
  const cookReviews =
    cookData?.reviews ?? reviews.filter((review) => review.cookId === cook.id);
  const saved = isFavoriteCook(cook.id);
  const cuisineLabels = cook.cuisineIds
    .map((id) => cuisines.find((cuisine) => cuisine.id === id))
    .filter(Boolean);
  const nextOptions = pickupOptions.filter((option) =>
    dishes.some((dish) => dish.pickup.includes(option.id)),
  );

  const save = () => {
    const added = toggleFavoriteCook(cook.id);
    toast(added ? t("favoriteCookToast") : t("unfavoriteCookToast"));
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: cook.name, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast(t("toastLinkCopied"));
    } catch {
      toast(t("toastLinkCopied"));
    }
  };

  return (
    <div className="pb-28 md:pb-8">
      <div className="mx-auto w-full max-w-[1240px] md:px-8 md:pt-8">
        {/* Cover */}
        <div className="relative h-[220px] overflow-hidden md:h-[300px] md:rounded-[32px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cook.cover}
            alt=""
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-charcoal/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(12px,env(safe-area-inset-top,0px))] md:pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={t("back")}
              className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur"
            >
              <ArrowLeft className={cn("size-5", dir === "rtl" && "rotate-180")} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={share}
                aria-label={t("share")}
                className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur"
              >
                <Share2 className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={save}
                aria-pressed={saved}
                aria-label={t("favoriteCook")}
                className="grid size-10 place-items-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur"
              >
                <Heart
                  className={cn(
                    "size-[18px]",
                    saved && "fill-terracotta text-terracotta",
                  )}
                />
              </button>
            </div>
          </div>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="glass" size="sm">
                <Sparkles className="size-3 text-terracotta" />
                {t("verifiedCook")}
              </Badge>
              <Badge variant="dark" size="sm">
                {cook.city}
              </Badge>
            </div>
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-charcoal backdrop-blur">
              {t("pickupOnly")}
            </span>
          </div>
        </div>

        {/* Profile header */}
        <div className="relative z-10 -mt-8 rounded-t-[28px] bg-cream px-4 pb-2 pt-0 md:mt-0 md:rounded-none md:bg-transparent md:px-0">
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-8 md:items-start">
            <div>
              <div className="flex items-end gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cook.avatar}
                  alt={cook.name}
                  className="-mt-8 size-[76px] rounded-full border-4 border-cream object-cover shadow-card md:mt-5 md:size-[92px]"
                />
                <div className="min-w-0 flex-1 pb-1 md:pb-0">
                  <h1 className="flex items-center gap-1.5 font-display text-[27px] leading-tight text-charcoal md:text-[34px]">
                    {cook.name}
                    {cook.verified ? (
                      <BadgeCheck className="size-5 shrink-0 fill-olive text-white" />
                    ) : null}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1 text-[13.5px] text-muted">
                    <MapPin className="size-3.5 text-terracotta" />
                    {cook.area[lang]} · {cook.city}
                  </p>
                </div>
                <span className="mb-2 flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-charcoal shadow-sm">
                  <Star className="size-3.5 fill-saffron text-saffron" />
                  {cook.rating.toFixed(1)}
                  <span className="font-normal text-muted">
                    ({cook.reviewCount})
                  </span>
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {cuisineLabels.map((cuisine) =>
                  cuisine ? (
                    <Badge key={cuisine.id} variant="soft" size="lg">
                      <span aria-hidden>{cuisine.flag}</span>
                      {loc(cuisine.label, lang)}
                    </Badge>
                  ) : null,
                )}
                <Badge variant="olive" size="lg">
                  {t("pickupOnly")}
                </Badge>
              </div>

              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-charcoal-soft md:text-[15.5px]">
                {loc(cook.bio, lang)}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-white p-3 text-center">
                <div>
                  <p className="font-display text-[21px] leading-none text-charcoal">
                    {cook.orders}
                  </p>
                  <p className="mt-1 text-[11.5px] uppercase tracking-[0.1em] text-muted">
                    {t("orders")}
                  </p>
                </div>
                <div className="border-x border-line">
                  <p className="font-display text-[21px] leading-none text-charcoal">
                    {cook.yearsCooking}
                  </p>
                  <p className="mt-1 text-[11.5px] uppercase tracking-[0.1em] text-muted">
                    {t("yearsCooking", { count: "" }).replace("{count} ", "")}
                  </p>
                </div>
                <div>
                  <p className="font-display text-[21px] leading-none text-charcoal">
                    {dishes.length}
                  </p>
                  <p className="mt-1 text-[11.5px] uppercase tracking-[0.1em] text-muted">
                    {t("dishes")}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Languages className="size-3.5 text-terracotta" />
                  {cook.languages.join(" · ")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-terracotta" />
                  {t("cookSince", { date: cook.since })}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 md:hidden">
                <Button variant="secondary" className="flex-1" onClick={save}>
                  <Heart className={cn("size-4", saved && "fill-terracotta text-terracotta")} />
                  {saved ? t("saved") : t("saveCook")}
                </Button>
                <Button className="flex-1" onClick={() => setMessageOpen(true)}>
                  <MessageCircle className="size-4" />
                  {t("messageCook")}
                </Button>
              </div>

              {/* Tabs */}
              <div className="mt-5">
                <SegmentedTabs
                  tabs={[
                    { value: "dishesTab", label: t("dishesTab"), count: dishes.length },
                    { value: "reviewsTab", label: t("reviewsTab"), count: cookReviews.length },
                    { value: "availabilityTab", label: t("availabilityTab") },
                  ]}
                  value={tab}
                  onChange={setTab}
                />
              </div>

              {tab === "dishesTab" ? (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                  {dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} showCook={false} />
                  ))}
                </div>
              ) : null}

              {tab === "reviewsTab" ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-4 rounded-[22px] border border-line bg-white p-4 shadow-card">
                    <div className="text-center">
                      <p className="font-display text-[38px] leading-none text-charcoal">
                        {cook.rating.toFixed(1)}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-3",
                              star <= Math.round(cook.rating)
                                ? "fill-saffron text-saffron"
                                : "fill-transparent text-line-strong",
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-[12px] text-muted">
                        {cook.reviewCount} {t("reviews")}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-2 text-[11px] text-muted">
                            {star}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                            <span
                              className="block h-full rounded-full bg-saffron"
                              style={{
                                width: `${
                                  star === 5
                                    ? 84
                                    : star === 4
                                      ? 12
                                      : star === 3
                                        ? 3
                                        : 1
                                }%`,
                              }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 px-1 text-[12.5px] text-muted">
                    <ShieldCheck className="size-3.5 text-olive" />
                    {t("ratingsVerified")}
                  </p>
                  {cookReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : null}

              {tab === "availabilityTab" ? (
                <div className="mt-4 space-y-2.5">
                  {nextOptions.map((option) => (
                    <div
                      key={option.id}
                      className="rounded-[22px] border border-line bg-white p-4 shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[15px] font-semibold text-charcoal">
                            {option.day[lang]}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-muted">
                            {t("pickupWindow")} · {cook.pickupArea[lang]}
                          </p>
                        </div>
                        <Badge variant="olive" size="sm">
                          {t("open")}
                        </Badge>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {option.slots.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-lg border border-line bg-cream/50 px-2.5 py-1.5 text-[13px] font-semibold text-charcoal"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="flex items-start gap-1.5 rounded-2xl bg-cream-100 p-3 text-[12.5px] leading-relaxed text-muted">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                    {t("exactAddress")} {t("exactAddressNote")}.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Desktop aside */}
            <aside className="hidden md:block md:sticky md:top-24">
              <div className="rounded-[26px] border border-line bg-white p-5 shadow-card">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted-soft">
                  {t("kitchenStory")}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-charcoal-soft">
                  {cook.bio[lang]}
                </p>
                <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-[13.5px]">
                  <p className="flex items-center justify-between">
                    <span className="text-muted">{t("specialties")}</span>
                    <span className="text-end font-medium text-charcoal">
                      {loc(cook.specialties, lang)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">{t("pickupArea")}</span>
                    <span className="font-medium text-charcoal">
                      {cook.pickupArea[lang]}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">{t("responseTime", { time: "" }).replace("{time}", "")}</span>
                    <span className="font-medium text-charcoal">
                      {cook.response[lang]}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted">{t("languages")}</span>
                    <span className="text-end font-medium text-charcoal">
                      {cook.languages.join(", ")}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-cream-100 p-3">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  <p className="text-[12.5px] leading-relaxed text-muted">
                    {t("exactAddressNote")}. {t("pickupNote")}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={save}>
                    <Heart
                      className={cn(
                        "size-4",
                        saved && "fill-terracotta text-terracotta",
                      )}
                    />
                    {saved ? t("saved") : t("saveCook")}
                  </Button>
                  <Button className="flex-1" onClick={() => setMessageOpen(true)}>
                    <MessageCircle className="size-4" />
                    {t("messageCook")}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <StickyActionBar>
          <Button variant="secondary" className="flex-1" onClick={save}>
            <Heart
              className={cn("size-4", saved && "fill-terracotta text-terracotta")}
            />
            {saved ? t("saved") : t("saveCook")}
          </Button>
          <Button className="flex-[1.4]" onClick={() => setMessageOpen(true)}>
            <MessageCircle className="size-4" />
            {t("messageCook")}
          </Button>
        </StickyActionBar>
      </div>

      <Sheet
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title={t("messageSheetTitle", { name: cook.name.split(" ")[0] })}
        description={t("responseTime", { time: cook.response[lang] })}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setMessageOpen(false);
              setMessage("");
              toast(t("messageSent"));
            }}
          >
            {t("send")}
          </Button>
        }
      >
        <div className="pt-1">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("messagePlaceholder")}
            rows={5}
            className="w-full resize-none rounded-2xl border border-line bg-white p-3.5 text-[15px] leading-relaxed outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
          />
          <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-olive" />
            {t("pickupNote")}
          </p>
        </div>
      </Sheet>
    </div>
  );
}
