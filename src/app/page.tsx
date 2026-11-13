"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  MapPin,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";
import { PageSkeleton } from "@/components/ui/skeleton";
import { DishCard } from "@/components/app/dish-card";
import { CookCard } from "@/components/app/cook-card";
import { LocationPicker } from "@/components/app/location-picker";
import { SearchBar } from "@/components/app/search-bar";
import { NotificationsSheet } from "@/components/app/notifications-sheet";
import { LanguageSheet } from "@/components/app/language-sheet";
import { InstallPrompt } from "@/components/app/install-prompt";
import { BecomeCookBanner, BecomeCookCard } from "@/components/home/become-cook";
import { EmptyNotice } from "@/components/home/empty-notice";
import { HeroDishCard } from "@/components/home/hero-dish-card";
import { HowItWorks } from "@/components/home/how-it-works";
import { MobileHeader } from "@/components/home/mobile-header";
import { OffersCarousel } from "@/components/home/offers-carousel";
import { TopCooksList } from "@/components/home/top-cooks-list";
import { useApp } from "@/components/providers/app-provider";
import { useGreeting } from "@/hooks/use-greeting";
import { useHomeFeed } from "@/hooks/use-home-feed";
import { useRotatingIndex } from "@/hooks/use-rotating-index";
import { useSearchArea } from "@/hooks/use-search-area";
import { loc } from "@/lib/data";
import { useNotificationsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
          <PageSkeleton />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { t, lang, cooks, cuisines, isAuthenticated, user } = useApp();
  const { data: notifications = [] } = useNotificationsQuery();
  const { city, area, ready, setCity, setArea } = useSearchArea();
  const { nearbyCooks, nearbyDishes, family, weekendPicks, heroList, offers } =
    useHomeFeed(city, area);
  const greeting = useGreeting();

  const [cityOpen, setCityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroIndex = useRotatingIndex(heroList.length, heroPaused);

  const unread = notifications.filter((item) => item.unread).length;
  const heroDish = heroList[heroIndex];
  const heroCook = heroDish
    ? cooks.find((cook) => cook.id === heroDish.cookId)
    : undefined;
  const favouriteCooks = nearbyCooks.slice(0, 4);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-0">
      {/* Mobile */}
      <div className="md:hidden">
        <MobileHeader
          city={city}
          unread={unread}
          onCity={() => setCityOpen(true)}
          onLanguage={() => setLangOpen(true)}
          onNotifications={() => setNotifOpen(true)}
        />

        <div className="px-4">
          <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-terracotta">
            <Sun className="size-3.5" />
            {isAuthenticated && user.firstName
              ? `${t(greeting)}, ${user.firstName}`
              : t(greeting)}
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
          <OffersCarousel offers={offers} />
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
          {favouriteCooks.length > 0 ? (
            favouriteCooks.map((cook) => (
              <CookCard key={cook.id} cook={cook} variant="compact" />
            ))
          ) : (
            <EmptyNotice className="w-full" />
          )}
        </div>

        <div className="mt-6 px-4">
          <SectionHeading
            title={t("weekendPicks")}
            subtitle={t("preOrderFresh")}
            href="/explore"
            actionLabel={t("viewAll")}
          />
          {weekendPicks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {weekendPicks.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <EmptyNotice />
          )}
        </div>

        <div className="mt-7 px-4">
          <SectionHeading
            title={t("familyMeals")}
            subtitle={t("familyMealsSub")}
            href="/explore"
            actionLabel={t("viewAll")}
          />
          {family.length > 0 ? (
            <>
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
            </>
          ) : (
            <EmptyNotice />
          )}
        </div>

        <div className="mt-7 px-4">
          <SectionHeading
            title={t("topCooks")}
            subtitle={t("topCooksSub")}
            href="/explore"
            actionLabel={t("seeAllCooks")}
          />
          <div className="grid grid-cols-2 gap-3">
            {nearbyCooks.length > 0 ? (
              nearbyCooks
                .slice(0, 2)
                .map((cook) => <CookCard key={cook.id} cook={cook} />)
            ) : (
              <EmptyNotice className="col-span-full" />
            )}
          </div>
        </div>

        <div className="mt-7 px-4">
          <BecomeCookCard />
        </div>
        <div className="mt-6 px-4">
          <InstallPrompt />
        </div>
        <div className="mt-7 px-4">
          <HowItWorks />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="grid grid-cols-[1.05fr_1fr] items-center gap-12 pb-4 pt-10">
            <div>
              <button
                type="button"
                onClick={() => setCityOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/25 bg-terracotta-50 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.14em] text-terracotta-700"
              >
                <Sparkles className="size-3" />
                {t("homemadeNear")} · {city || t("allNetherlands")}
                <ChevronDown className="size-3" />
              </button>
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
                  {nearbyCooks.map((cook) => (
                    <Image
                      key={cook.id}
                      src={cook.avatar || "/img/daarik-logo.png"}
                      alt={cook.name}
                      width={32}
                      height={32}
                      loading="lazy"
                      unoptimized
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

            <div
              className="relative"
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
            >
              {heroDish && heroCook ? (
                <HeroDishCard dish={heroDish} cook={heroCook} />
              ) : (
                <div className="grid min-h-105 place-items-center rounded-4xl border border-line bg-white px-8 text-center text-sm text-muted shadow-card">
                  {t("noCooksAtLocation")}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[22px] border border-line bg-white/60 px-5 py-4">
            <div className="flex items-center gap-6">
              {[
                { value: String(nearbyCooks.length), label: t("cooksNearYou") },
                { value: String(nearbyDishes.length), label: t("dishesNearYou") },
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
              {favouriteCooks.length > 0 ? (
                favouriteCooks.map((cook) => (
                  <CookCard key={cook.id} cook={cook} />
                ))
              ) : (
                <EmptyNotice className="col-span-full" />
              )}
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
              {weekendPicks.length > 0 ? (
                <>
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
                </>
              ) : (
                <EmptyNotice />
              )}
            </div>
            <div>
              <SectionHeading title={t("topCooks")} subtitle={t("topCooksSub")} />
              <div className="space-y-3">
                <TopCooksList cooks={nearbyCooks.slice(0, 3)} />
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
            {family.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {family.map((dish) => (
                  <DishCard key={dish.id} dish={dish} variant="compact" />
                ))}
              </div>
            ) : (
              <EmptyNotice />
            )}
          </div>

          <BecomeCookBanner cooks={nearbyCooks} />
        </div>
      </div>

      <InstallPrompt variant="banner" />

      <LocationPicker
        open={cityOpen}
        onClose={() => setCityOpen(false)}
        currentCity={city}
        onCityChange={setCity}
        onAreaChange={setArea}
      />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
