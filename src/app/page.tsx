"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  ChevronDown,
  ChefHat,
  Clock3,
  Globe2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/overlays";
import { DishCard } from "@/components/app/dish-card";
import { CookCard } from "@/components/app/cook-card";
import { SearchBar } from "@/components/app/search-bar";
import { NotificationsSheet } from "@/components/app/notifications-sheet";
import { LanguageSheet } from "@/components/app/language-sheet";
import { InstallPrompt } from "@/components/app/install-prompt";
import { useApp } from "@/components/providers/app-provider";
import {
  cuisines,
  getCook,
  loc,
  notifications,
} from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

export default function HomePage() {
  const { t, lang, toast, isFavorite, dishes, cooks } = useApp();
  const featured = useMemo(
    () => dishes.filter((dish) => dish.featured || dish.weekend).slice(0, 3),
    [dishes],
  );
  const family = useMemo(
    () => dishes.filter((dish) => dish.family).slice(0, 6),
    [dishes],
  );
  const weekendPicks = useMemo(
    () => dishes.filter((dish) => dish.weekend || dish.featured).slice(0, 4),
    [dishes],
  );
  const [greeting, setGreeting] = useState<"greetingMorning" | "greetingAfternoon" | "greetingEvening">(
    "greetingAfternoon",
  );
  const [city, setCity] = useState("Rotterdam");
  const [cityOpen, setCityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter((item) => item.unread).length;

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "greetingMorning"
        : hour < 18
          ? "greetingAfternoon"
          : "greetingEvening",
    );
  }, []);

  const heroDish = featured[0];
  const heroCook = getCook(heroDish.cookId);
  const cities = useMemo(() => t("cities").split(","), [t]);
  const favouriteCooks = cooks.slice(0, 4);

  return (
    <div className="pb-6 md:pb-0">
      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 pb-1 pt-[max(10px,env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={() => setCityOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 text-[14px] font-semibold text-charcoal shadow-sm backdrop-blur"
          >
            <MapPin className="size-3.5 text-terracotta" />
            {city}
            <ChevronDown className="size-3 text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLangOpen(true)}
              className="grid size-10 place-items-center rounded-full border border-line bg-white/80 text-[12.5px] font-bold text-charcoal shadow-sm backdrop-blur"
              aria-label={t("languageSwitch")}
            >
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative grid size-10 place-items-center rounded-full border border-line bg-white/80 text-charcoal shadow-sm backdrop-blur"
              aria-label={t("notifications")}
            >
              <Bell className="size-[18px]" />
              {unread > 0 ? (
                <span className="absolute end-2.5 top-2.5 size-1.5 rounded-full bg-terracotta ring-2 ring-white" />
              ) : null}
            </button>
            <Link
              href="/profile"
              aria-label={t("profile")}
              className="block size-10 overflow-hidden rounded-full border-2 border-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/user-sarah.jpg"
                alt="Sarah"
                className="size-full object-cover"
              />
            </Link>
          </div>
        </div>

        <div className="px-4">
          <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-terracotta">
            <Sun className="size-3.5" />
            {t(greeting)}, Sarah
          </div>
          <h1 className="mt-1.5 max-w-[300px] font-display text-[32px] leading-[1.1] text-charcoal">
            {t("homeTitle")}
          </h1>
          <p className="mt-2 max-w-[290px] text-[14.5px] leading-relaxed text-muted">
            {t("homeSub")}
          </p>
        </div>

        <div className="mt-4 px-4">
          <SearchBar />
        </div>

        {/* Featured carousel */}
        <div className="mt-5">
          <div className="flex items-center justify-between px-4">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-muted-soft">
              {t("featuredKicker")}
            </p>
            <Link
              href="/explore"
              className="flex items-center gap-0.5 text-[13px] font-semibold text-terracotta"
            >
              {t("seeAll")}
              <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
          <div className="-mx-0 mt-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
            {featured.map((dish, index) => {
              const cook = getCook(dish.cookId);
              return (
                <Link
                  key={dish.id}
                  href={`/dish/${dish.id}`}
                  className="group relative block h-[204px] w-[286px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-charcoal shadow-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dish.image}
                    alt={loc(dish.name, lang)}
                    className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <Badge variant="glass" size="sm">
                      <Sparkles className="size-2.5 text-terracotta" />
                      {index === 0 ? t("weekendSpecial") : t("liveNow")}
                    </Badge>
                    <span className="flex items-center gap-0.5 rounded-full bg-charcoal/50 px-2 py-1 text-[12px] font-semibold text-white backdrop-blur">
                      <Star className="size-2.5 fill-saffron text-saffron" />
                      {dish.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="line-clamp-1 font-display text-[21px] leading-tight text-white">
                      {loc(dish.name, lang)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-white/75">
                      {cook?.name} · {cook?.area[lang]}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[17px] font-semibold text-white">
                        {formatPrice(dish.price, lang)}
                        <span className="ms-1 text-[11.5px] font-normal text-white/70">
                          {t("perPortion")}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-charcoal">
                        {dish.portionsLeft <= 3
                          ? t("onlyLeft", { count: dish.portionsLeft })
                          : t("preOrder")}
                        <ArrowRight className="size-2.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {cuisines.map((cuisine, index) => (
            <Link
              key={cuisine.id}
              href="/explore"
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold transition",
                index === 0
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-line bg-white text-charcoal",
              )}
            >
              <span aria-hidden>{cuisine.flag}</span>
              {loc(cuisine.label, lang)}
            </Link>
          ))}
        </div>

        <div className="mt-6 px-4">
          <SectionHeading
            title={t("nearbyKitchens")}
            subtitle={t("nearbyKitchensSub")}
            href="/explore"
            actionLabel={t("viewAll")}
          />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {favouriteCooks.map((cook) => (
            <CookCard key={cook.id} cook={cook} variant="compact" />
          ))}
        </div>

        <div className="mt-6 px-4">
          <SectionHeading
            title={t("weekendPicks")}
            subtitle={t("preOrderFresh")}
            href="/explore"
            actionLabel={t("viewAll")}
          />
          <div className="grid grid-cols-2 gap-3">
            {weekendPicks.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>

        <div className="mt-7 px-4">
          <SectionHeading
            title={t("familyMeals")}
            subtitle={t("familyMealsSub")}
            href="/explore"
            actionLabel={t("viewAll")}
          />
          <div className="grid grid-cols-2 gap-3">
            {family.slice(0, 2).map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {family.slice(2, 4).map((dish) => (
              <DishCard key={dish.id} dish={dish} variant="compact" />
            ))}
          </div>
        </div>

        <div className="mt-7 px-4">
          <SectionHeading
            title={t("topCooks")}
            subtitle={t("topCooksSub")}
            href="/explore"
            actionLabel={t("seeAllCooks")}
          />
          <div className="grid grid-cols-2 gap-3">
            {cooks.slice(0, 2).map((cook) => (
              <CookCard key={cook.id} cook={cook} />
            ))}
          </div>
        </div>

        <div className="mt-7 px-4">
          <div className="relative overflow-hidden rounded-[26px] bg-olive px-5 py-5 text-cream shadow-card">
            <div className="absolute -end-8 -top-10 size-32 rounded-full border-[18px] border-white/10" />
            <div className="relative">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
                <ChefHat className="size-[18px]" />
              </span>
              <h3 className="mt-3 max-w-[230px] font-display text-[25px] leading-tight">
                {t("becomeCookTitle")}
              </h3>
              <p className="mt-1.5 max-w-[250px] text-[13.5px] leading-relaxed text-cream/80">
                {t("becomeCookSub")}
              </p>
              <Link
                href="/cook"
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-cream px-4 text-[14px] font-semibold text-olive-600"
              >
                {t("becomeCookCta")}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 px-4">
          <InstallPrompt />
        </div>

        <div className="mt-7 px-4">
          <div className="rounded-[24px] border border-line bg-white/70 p-4">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-muted-soft">
              {t("howItWorksTitle")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Search, label: t("search") },
                { icon: CalendarCheck, label: t("preOrder") },
                { icon: UtensilsCrossed, label: t("pickup") },
              ].map((step) => (
                <div key={step.label} className="flex flex-col items-center gap-1.5">
                  <span className="grid size-9 place-items-center rounded-full bg-cream-100 text-terracotta">
                    <step.icon className="size-4" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-charcoal">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] text-muted">
              {t("pickupOnly")} · {t("madeIn")}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="grid grid-cols-[1.05fr_1fr] items-center gap-12 pb-4 pt-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/25 bg-terracotta-50 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.14em] text-terracotta-700">
                <Sparkles className="size-3" />
                {t("homemadeNear")} · {city}
              </span>
              <h1 className="mt-5 max-w-[540px] font-display text-[52px] leading-[1.03] tracking-[-0.03em] text-charcoal">
                {t("homeTitle")}
              </h1>
              <p className="mt-4 max-w-[430px] text-[17px] leading-relaxed text-muted">
                {t("homeSub")} {t("preOrderFresh")}.
              </p>

              <div className="mt-6 max-w-[470px]">
                <SearchBar />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {cooks.map((cook) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={cook.id}
                      src={cook.avatar}
                      alt={cook.name}
                      className="size-8 rounded-full border-2 border-cream object-cover"
                    />
                  ))}
                </div>
                <p className="text-[13.5px] leading-snug text-muted">
                  <span className="font-semibold text-charcoal">
                    {t("ratingsVerified")}
                  </span>
                  <br />
                  {t("cooksNearYou")} · {t("dishesNearYou")}
                </p>
                <div className="ms-2 flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5">
                  <Star className="size-3.5 fill-saffron text-saffron" />
                  <span className="text-[14px] font-semibold text-charcoal">
                    4.9
                  </span>
                  <span className="text-[12.5px] text-muted">
                    · 4.9k {t("reviews")}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Link
                href={`/dish/${heroDish.id}`}
                className="group relative block overflow-hidden rounded-[32px] bg-charcoal shadow-lift"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/couscous.jpg"
                  alt={loc(heroDish.name, lang)}
                  className="h-[420px] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
                <div className="absolute inset-x-6 top-6 flex items-center justify-between">
                  <Badge variant="glass" size="sm">
                    <Sparkles className="size-3 text-terracotta" />
                    {t("weekendSpecial")}
                  </Badge>
                  <span className="flex items-center gap-1 rounded-full bg-charcoal/45 px-2.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {heroDish.rating.toFixed(1)} · {heroDish.reviewCount}{" "}
                    {t("reviews")}
                  </span>
                </div>
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">
                    {t("cookKitchen", { name: heroCook?.name.split(" ")[0] ?? "" })}
                  </p>
                  <p className="mt-1 font-display text-[32px] leading-tight text-white">
                    {loc(heroDish.name, lang)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroCook?.avatar}
                        alt={heroCook?.name}
                        className="size-9 rounded-full border-2 border-white/80 object-cover"
                      />
                      <span className="text-[14px] text-white/85">
                        {heroCook?.name}
                        <span className="mt-0.5 block text-[12px] text-white/60">
                          {heroCook?.area[lang]} · {heroCook?.city}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[21px] font-semibold text-white">
                        {formatPrice(heroDish.price, lang)}
                      </span>
                      <span className="grid size-11 place-items-center rounded-full bg-white text-charcoal transition group-hover:bg-terracotta group-hover:text-white">
                        <ArrowRight className="size-5 rtl:rotate-180" />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
              <div className="absolute -start-5 top-8 rounded-2xl border border-line bg-white/95 px-3.5 py-2.5 shadow-pop backdrop-blur">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal">
                  <BadgeCheck className="size-4 fill-olive text-white" />
                  {t("verifiedCook")}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {heroCook?.response[lang]} · {t("pickupOnly")}
                </p>
              </div>
              <div className="absolute -bottom-4 start-10 flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
                <span className="grid size-8 place-items-center rounded-full bg-olive-50 text-olive">
                  <Clock3 className="size-4" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-charcoal">
                    {t("nextAvailable")}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {t("today")} · 18:00
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[22px] border border-line bg-white/60 px-5 py-4">
            <div className="flex items-center gap-6">
              {[
                { value: "4", label: t("cooksNearYou") },
                { value: "12", label: t("dishesNearYou") },
                { value: "€12", label: t("avgOrder") },
                { value: "4.9", label: t("rating") },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="font-display text-[22px] text-charcoal">
                    {stat.value}
                  </span>
                  <span className="text-[13px] text-muted">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-olive-600">
              <MapPin className="size-3.5" /> {t("pickupOnly")} · {city}
            </div>
          </div>

          <div className="mt-8">
            <SectionHeading
              title={t("nearbyKitchens")}
              subtitle={t("nearbyKitchensSub")}
              href="/explore"
              actionLabel={t("viewAll")}
            />
            <div className="grid grid-cols-4 gap-4">
              {favouriteCooks.map((cook) => (
                <CookCard key={cook.id} cook={cook} />
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-[1.7fr_1fr] gap-4">
            <div>
              <SectionHeading
                title={t("weekendPicks")}
                subtitle={t("preOrderFresh")}
                href="/explore"
                actionLabel={t("viewAll")}
              />
              <div className="grid grid-cols-2 gap-4">
                {weekendPicks.slice(0, 2).map((dish) => (
                  <DishCard key={dish.id} dish={dish} variant="wide" />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {weekendPicks.slice(2, 4).map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </div>
            <div>
              <SectionHeading title={t("topCooks")} subtitle={t("topCooksSub")} />
              <div className="space-y-3">
                {cooks.slice(0, 3).map((cook) => (
                  <Link
                    key={cook.id}
                    href={`/cook/${cook.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card transition hover:border-line-strong"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cook.avatar}
                      alt={cook.name}
                      className="size-12 rounded-full object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-[14.5px] font-semibold text-charcoal">
                        {cook.name}
                        <BadgeCheck className="size-3.5 fill-olive text-white" />
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {loc(cook.specialties, lang)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                        <Star className="size-2.5 fill-saffron text-saffron" />
                        {cook.rating.toFixed(1)} · {cook.area[lang]}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-soft transition group-hover:text-terracotta rtl:rotate-180" />
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <InstallPrompt />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <SectionHeading
              title={t("familyMeals")}
              subtitle={t("familyMealsSub")}
              href="/explore"
              actionLabel={t("viewAll")}
            />
            <div className="grid grid-cols-4 gap-4">
              {family.map((dish) => (
                <DishCard key={dish.id} dish={dish} variant="compact" />
              ))}
            </div>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[32px] bg-olive px-10 py-9 text-cream">
            <div className="absolute -end-16 -top-24 size-72 rounded-full border-[34px] border-white/10" />
            <div className="absolute -bottom-20 end-40 size-48 rounded-full border-[24px] border-white/5" />
            <div className="relative flex items-center justify-between gap-8">
              <div>
                <span className="flex size-11 items-center justify-center rounded-full bg-white/12">
                  <ChefHat className="size-5" />
                </span>
                <h3 className="mt-4 max-w-[480px] font-display text-[36px] leading-tight">
                  {t("becomeCookTitle")}
                </h3>
                <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-cream/75">
                  {t("becomeCookSub")}
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href="/cook"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-cream px-5 text-[15px] font-semibold text-olive-600"
                  >
                    {t("becomeCookCta")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                  <Link
                    href="/help"
                    className="text-[14px] font-semibold text-cream/75 underline-offset-4 hover:text-cream hover:underline"
                  >
                    {t("learnMore")}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-cream/60">
                    {t("exampleNet")}
                  </p>
                  <p className="mt-1 font-display text-[28px]">€476</p>
                  <p className="text-[12px] text-cream/60">
                    {t("exampleEarningsNote")}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    {cooks.slice(0, 3).map((cook) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={cook.id}
                        src={cook.avatar}
                        alt={cook.name}
                        className="size-9 rounded-full border-2 border-olive object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-cream/60">
                    {t("cooksNearYou")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InstallPrompt variant="banner" />

      <Sheet
        open={cityOpen}
        onClose={() => setCityOpen(false)}
        title={t("selectCity")}
        description={t("pickupCityNote")}
      >
        <div className="space-y-2 pt-1">
          {cities.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCity(item);
                setCityOpen(false);
                toast(t("saved"), { description: item });
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border p-3.5 text-start transition",
                city === item
                  ? "border-terracotta bg-terracotta-50/60"
                  : "border-line bg-white hover:border-line-strong",
              )}
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-charcoal">
                <MapPin className="size-4 text-terracotta" />
                {item}
              </span>
              {city === item ? (
                <span className="rounded-full bg-terracotta px-2 py-1 text-[11px] font-bold uppercase text-white">
                  {t("currentCity")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </Sheet>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <NotificationsSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
