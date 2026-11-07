"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Camera,
  Check,
  ChefHat,
  Eye,
  Globe2,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Pause,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/controls";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { Card, SettingRow } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import { loc } from "@/lib/data";
import {
  useCookAvailabilityQuery,
  useCookDashboardQuery,
  useCookPayoutSettingsQuery,
  useUpdateCookAvailabilityMutation,
  useUpdateCookProfileMutation,
  useUploadImageMutation,
} from "@/lib/queries";
import { cn, errorMessage } from "@/lib/utils";
import {
  CITY_COORDS,
  CITY_NAMES,
  MAX_PIN_DISTANCE_KM,
  distanceKm,
  nearestCity,
} from "@/lib/cities";
import type { MapPoint } from "@/components/app/location-map";

const LocationMap = dynamic(() => import("@/components/app/location-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

export default function CookProfilePage() {
  const { t, lang, toast, user, cuisines } = useApp();
  const router = useRouter();
  const { data: dashboard } = useCookDashboardQuery();
  const { data: payoutSettings } = useCookPayoutSettingsQuery();
  const updateProfile = useUpdateCookProfileMutation();
  const { data: availability } = useCookAvailabilityQuery();
  const updateAvailability = useUpdateCookAvailabilityMutation();
  const cook = dashboard?.cook ?? {
    id: user.id || "",
    name: user.name,
    avatar: user.avatar || "",
    cover: "",
    city: user.city || "",
    area: { nl: "", en: "", ar: "" },
    cuisineIds: [],
    rating: 0,
    reviewCount: 0,
    verified: false,
    languages: [],
    bio: { nl: "", en: "", ar: "" },
    since: "",
    orders: 0,
    response: { nl: "", en: "", ar: "" },
    pickupArea: { nl: "", en: "", ar: "" },
    specialties: { nl: "", en: "", ar: "" },
    instructions: { nl: "", en: "", ar: "" },
    yearsCooking: 0,
  };
  const [name, setName] = useState(cook.name);
  const [avatarUrl, setAvatarUrl] = useState(cook.avatar || "");
  const [coverUrl, setCoverUrl] = useState(cook.cover || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImageMutation("cooks");
  const [bio, setBio] = useState(cook.bio[lang]);

  async function handleCookImageUpload(
    file: File | undefined,
    kind: "avatar" | "cover",
  ) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast(t("photoUploadFailed"), { variant: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(t("photoTooLarge"), { variant: "error" });
      return;
    }
    if (kind === "avatar") setUploadingAvatar(true);
    else setUploadingCover(true);
    try {
      const uploaded = await uploadImage.mutateAsync({
        file,
        folder: kind === "avatar" ? "avatars" : "cooks",
      });
      if (kind === "avatar") {
        setAvatarUrl(uploaded.url);
        await updateProfile.mutateAsync({ avatar: uploaded.url });
      } else {
        setCoverUrl(uploaded.url);
        await updateProfile.mutateAsync({ cover: uploaded.url });
      }
      toast(t("photoSelected"));
    } catch (err) {
      toast(errorMessage(err, t("photoUploadFailed")), { variant: "error" });
    } finally {
      if (kind === "avatar") setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  }
  const [instructions, setInstructions] = useState(cook.instructions[lang]);
  const [cuisineIds, setCuisineIds] = useState<string[]>(cook.cuisineIds);
  const paused = availability?.kitchenOpen === false;
  const [newOrders, setNewOrders] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [reviews, setReviews] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [kitchenCity, setKitchenCity] = useState("");
  const [pin, setPin] = useState<MapPoint | null>(null);

  const chooseCity = (name: string) => {
    setKitchenCity(name);
    setPin(CITY_COORDS[name] ?? null);
  };

  // A pin always belongs to a city: clicking elsewhere moves the city with it.
  const placePin = (point: MapPoint) => {
    const current = kitchenCity ? CITY_COORDS[kitchenCity] : null;
    if (current && distanceKm(point, current) <= MAX_PIN_DISTANCE_KM) {
      setPin(point);
      return;
    }
    const near = nearestCity(point, MAX_PIN_DISTANCE_KM);
    if (!near) {
      toast(t("pinOutsideCities"), { variant: "error" });
      return;
    }
    setKitchenCity(near);
    setPin(point);
  };

  const saveLocation = async () => {
    if (!kitchenCity || !pin) {
      toast(t("placePinFirst"), { variant: "error" });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        city: kitchenCity,
        latitude: Number(pin.lat.toFixed(5)),
        longitude: Number(pin.lng.toFixed(5)),
      });
      setEditOpen(false);
      toast(t("profileSaved"));
    } catch {
      toast(t("loadError"), { variant: "error" });
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast(t("locationDenied"), { variant: "error" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => placePin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast(t("locationDenied"), { variant: "error" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const c = dashboard?.cook;
    if (!c) return;
    queueMicrotask(() => {
      setKitchenCity(CITY_NAMES.includes(c.city) ? c.city : "");
      setPin(
        typeof c.latitude === "number" && typeof c.longitude === "number"
          ? { lat: c.latitude, lng: c.longitude }
          : null,
      );
    });
  }, [dashboard?.cook]);
  useEffect(() => {
    const activeCook = dashboard?.cook;
    if (!activeCook) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setName(activeCook.name);
      setAvatarUrl(activeCook.avatar || "");
      setCoverUrl(activeCook.cover || "");
      setBio(activeCook.bio[lang] || "");
      setInstructions(activeCook.instructions[lang] || "");
      setCuisineIds(activeCook.cuisineIds);
    });
    return () => {
      active = false;
    };
  }, [dashboard?.cook, lang]);

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        name,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        ...(coverUrl ? { cover: coverUrl } : {}),
        bio: { ...cook.bio, [lang]: bio },
        instructions: { ...cook.instructions, [lang]: instructions },
        cuisineIds,
      });
      toast(t("profileSaved"));
    } catch {
      toast(t("loadError"), { variant: "error" });
    }
  };

  return (
    <div className="pb-8 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1120px] md:px-8 md:pt-10">
        <CookMobileHeader
          title={t("cookProfileTitle")}
          subtitle={t("cookProfileSub")}
        />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("cookProfileTitle")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">
              {t("cookProfileSub")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/cook/${cook.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="size-3.5" />
                {t("previewProfile")}
              </Button>
            </Link>
            <Button
              size="sm"
              loading={updateProfile.isPending}
              onClick={saveProfile}
            >
              <Check className="size-3.5" />
              {t("saveProfile")}
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-4 md:mt-5 md:grid-cols-[360px_1fr] md:items-start md:gap-6">
          {/* Public preview */}
          <aside className="md:sticky md:top-24">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleCookImageUpload(file, "avatar");
                event.target.value = "";
              }}
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleCookImageUpload(file, "cover");
                event.target.value = "";
              }}
            />
            <Card className="overflow-hidden">
              <div className="relative h-28">
                {coverUrl || cook.cover ? (
                  <Image
                    src={coverUrl || cook.cover}
                    alt=""
                    fill
                    sizes="360px"
                    loading="lazy"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full bg-terracotta/15" />
                )}
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-charcoal/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-charcoal"
                >
                  {uploadingCover ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ImagePlus className="size-3" />
                  )}
                  {t("coverPhoto")}
                </button>
                <span className="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-charcoal/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Eye className="size-3" />
                  {t("publicProfile")}
                </span>
              </div>
              <div className="-mt-8 px-4 pb-4">
                <div className="relative inline-block">
                  {avatarUrl || cook.avatar ? (
                    <Image
                      src={avatarUrl || cook.avatar}
                      alt={name}
                      width={68}
                      height={68}
                      loading="lazy"
                      unoptimized
                      className="size-[68px] rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="size-[68px] rounded-full border-4 border-white bg-terracotta/20" />
                  )}
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label={t("editProfilePic")}
                    className="absolute -bottom-0.5 -end-0.5 grid size-6 place-items-center rounded-full border-2 border-white bg-terracotta text-white"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="size-2.5 animate-spin" />
                    ) : (
                      <Camera className="size-2.5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <h2 className="font-display text-[21px] font-semibold leading-tight text-charcoal">
                    {name}
                  </h2>
                  {cook.verified ? (
                    <BadgeCheck className="size-4 text-olive" />
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                  <MapPin className="size-3" />
                  {cook.area[lang]} · {cook.city}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-saffron-50 px-2 py-1 text-[12px] font-semibold text-[#8a5d13]">
                    <Star className="size-3 fill-saffron text-saffron" />
                    {cook.rating} ({cook.reviewCount})
                  </span>
                  <span className="text-[12px] text-muted">
                    {cook.orders} {t("orders")}
                  </span>
                </div>
                <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-muted">
                  {bio}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {cuisineIds.map((id) => {
                    const cuisine = cuisines.find((item) => item.id === id);
                    return cuisine ? (
                      <span
                        key={id}
                        className="rounded-full bg-cream-100 px-2 py-1 text-[11.5px] font-medium text-muted"
                      >
                        {cuisine.flag} {loc(cuisine.label, lang)}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-terracotta-50 px-3 py-2 text-[11.5px] leading-relaxed text-terracotta-700">
                  {t("publicPreviewNote")}
                </p>
                <Link
                  href={`/cook/${cook.id}`}
                  className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-charcoal"
                >
                  {t("viewPublicPage")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </Card>

            <div className="mt-3 hidden items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-card md:flex">
              <ShieldCheck className="size-4 text-olive" />
              <p className="text-[12px] leading-relaxed text-muted">
                {t("kitchenAddressNote")}
              </p>
            </div>
          </aside>

          <div className="space-y-4">
            {/* Public details */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("publicProfile")}
              </h2>
              <Card className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-cream/40 p-3 text-start transition hover:border-terracotta/50 hover:bg-terracotta-50/30"
                  >
                    {avatarUrl || cook.avatar ? (
                      <Image
                        src={avatarUrl || cook.avatar}
                        alt={name}
                        width={44}
                        height={44}
                        loading="lazy"
                        unoptimized
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-terracotta/15 text-terracotta">
                        <Camera className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-charcoal">
                        {t("profilePhoto")}
                      </span>
                      <span className="block truncate text-[11.5px] text-muted">
                        {uploadingAvatar
                          ? t("uploadingPhoto")
                          : t("editProfilePic")}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-cream/40 p-3 text-start transition hover:border-terracotta/50 hover:bg-terracotta-50/30"
                  >
                    {coverUrl || cook.cover ? (
                      <Image
                        src={coverUrl || cook.cover}
                        alt=""
                        width={44}
                        height={44}
                        loading="lazy"
                        unoptimized
                        className="size-11 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-terracotta/15 text-terracotta">
                        <ImagePlus className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-charcoal">
                        {t("coverPhoto")}
                      </span>
                      <span className="block truncate text-[11.5px] text-muted">
                        {uploadingCover ? t("uploadingPhoto") : t("editPhoto")}
                      </span>
                    </span>
                  </button>
                </div>
                <Field
                  label={t("dishName").replace(t("dishName"), t("fullName"))}
                  htmlFor="cook-name"
                >
                  <Input
                    id="cook-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field
                  label={t("kitchenStory")}
                  htmlFor="cook-bio"
                  hint={`${bio.length}/320`}
                >
                  <Textarea
                    id="cook-bio"
                    value={bio}
                    onChange={(event) =>
                      setBio(event.target.value.slice(0, 320))
                    }
                    rows={4}
                  />
                </Field>
                <div>
                  <p className="text-[15px] font-semibold text-charcoal">
                    {t("cuisinesOffered")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cuisines.map((cuisine) => {
                      const active = cuisineIds.includes(cuisine.id);
                      return (
                        <button
                          key={cuisine.id}
                          type="button"
                          onClick={() =>
                            setCuisineIds((prev) =>
                              prev.includes(cuisine.id)
                                ? prev.filter((id) => id !== cuisine.id)
                                : [...prev, cuisine.id],
                            )
                          }
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[12.5px] font-semibold transition",
                            active
                              ? "border-terracotta bg-terracotta text-white"
                              : "border-line bg-white text-charcoal",
                          )}
                        >
                          {active ? <Check className="size-3" /> : null}
                          {cuisine.flag} {loc(cuisine.label, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label={t("languagesSpoken")} htmlFor="cook-languages">
                  <Select id="cook-languages" defaultValue="nl">
                    <option value="nl">Nederlands · العربية · English</option>
                    <option value="en">English · العربية · Nederlands</option>
                  </Select>
                </Field>
                <Field
                  label={t("pickupInstructionsLabel")}
                  htmlFor="cook-instructions"
                  hint={t("exactAddressNote")}
                >
                  <Textarea
                    id="cook-instructions"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    rows={3}
                    placeholder={t("pickupInstructionsPh")}
                  />
                </Field>
                <div className="flex items-center justify-between rounded-2xl bg-cream/60 p-3">
                  <div>
                    <p className="text-[13.5px] font-semibold text-charcoal">
                      {t("profileVisibility")}
                    </p>
                    <p className="text-[11.5px] text-muted">
                      {t("kitchenAddressNote")}
                    </p>
                  </div>
                  <Badge variant="olive" size="sm">
                    <Eye className="size-3" />
                    {t("publicProfile")}
                  </Badge>
                </div>
              </Card>
            </section>

            {/* Kitchen + payouts */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("kitchen")}
              </h2>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<MapPin className="size-4" />}
                  title={t("kitchenAddress")}
                  description={`${cook.name.split(" ")[0]} · ${cook.pickupArea[lang]}, ${cook.city}`}
                  right={
                    <span className="flex items-center gap-1 text-[11.5px] font-medium text-olive-600">
                      <ShieldCheck className="size-3" />
                      {t("verified")}
                    </span>
                  }
                  onClick={() => setEditOpen(true)}
                />
                <SettingRow
                  icon={<Banknote className="size-4" />}
                  title={t("payoutSettingsShort")}
                  description={t("accountEnding", {
                    last4: payoutSettings?.bank?.ibanLast4 || "—",
                  })}
                  href="/cook/earnings"
                />
                <SettingRow
                  icon={<Globe2 className="size-4" />}
                  title={t("pickupInstructionsLabel")}
                  description={t("exactAddressNote")}
                  onClick={() => setEditOpen(true)}
                />
                <SettingRow
                  icon={<Store className="size-4" />}
                  title={t("previewProfile")}
                  href={`/cook/${cook.id}`}
                />
              </div>
            </section>

            {/* Notifications */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("cookNotifications")}
              </h2>
              <Card className="divide-y divide-line/70">
                <ToggleRow
                  icon={<Bell className="size-4" />}
                  title={t("newOrderAlert")}
                  description={t("newOrderAlertDesc")}
                  checked={newOrders}
                  onChange={(value) => {
                    setNewOrders(value);
                    toast(t("cookSettingsSaved"));
                  }}
                  label={t("newOrderAlert")}
                />
                <ToggleRow
                  icon={<Banknote className="size-4" />}
                  title={t("payoutAlerts")}
                  description={t("payoutAlertsDesc")}
                  checked={payoutAlerts}
                  onChange={(value) => {
                    setPayoutAlerts(value);
                    toast(t("cookSettingsSaved"));
                  }}
                  label={t("payoutAlerts")}
                />
                <ToggleRow
                  icon={<Star className="size-4" />}
                  title={t("reviewAlerts")}
                  description={t("reviewAlertsDesc")}
                  checked={reviews}
                  onChange={setReviews}
                  label={t("reviewAlerts")}
                />
              </Card>
            </section>

            {/* Pause selling */}
            <div className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-4 shadow-card">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  paused
                    ? "bg-saffron-50 text-[#8a5d13]"
                    : "bg-olive-50 text-olive-600",
                )}
              >
                <Pause className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold text-charcoal">
                  {t("pauseSelling")}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {t("pauseSellingDesc")}
                </p>
              </div>
              <Switch
                checked={paused}
                onCheckedChange={(value) => {
                  updateAvailability.mutate({ kitchenOpen: !value });
                  toast(value ? t("kitchenClosed") : t("kitchenOpen"), {
                    variant: value ? "info" : "success",
                  });
                }}
                label={t("pauseSelling")}
              />
            </div>

            {/* Account */}
            <section>
              <h2 className="mb-2 px-1 text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("accountManagement")}
              </h2>
              <div className="divide-y divide-line/70 overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <SettingRow
                  icon={<BadgeCheck className="size-4" />}
                  title={t("accountEmail")}
                  description="rana@example.nl"
                  right={
                    <Badge variant="olive" size="sm">
                      {t("emailVerified")}
                    </Badge>
                  }
                />
                <SettingRow
                  icon={<UtensilsCrossed className="size-4" />}
                  title={t("accountPhone")}
                  description="+31 6 24 18 33 90"
                  right={
                    <Badge variant="outline" size="sm">
                      {t("phoneVerified")}
                    </Badge>
                  }
                />
                <SettingRow
                  icon={<ChefHat className="size-4" />}
                  title={t("cookSupport")}
                  href="/help"
                />
                <SettingRow
                  icon={<Trash2 className="size-4" />}
                  title={t("deactivateAccount")}
                  description={t("deleteAccountDesc")}
                  destructive
                  onClick={() => setDeactivateOpen(true)}
                />
              </div>
            </section>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="h-11"
                loading={updateProfile.isPending}
                onClick={saveProfile}
              >
                <Check className="size-4" />
                {t("saveProfile")}
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => router.push("/")}
              >
                {t("switchToCustomer")}
              </Button>
            </div>

            <p className="text-center text-[11.5px] text-muted-soft">
              {t("cookSettingsSaved")} · {t("demoNotice")}
            </p>
          </div>
        </div>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("kitchenAddress")}
        description={t("kitchenAddressNote")}
        footer={
          <Button className="w-full" onClick={saveLocation}>
            {t("saveChanges")}
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label={t("addressLabel")} htmlFor="kitchen-street">
            <Input id="kitchen-street" defaultValue="Westzeedijk 112" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("postcodeShort")} htmlFor="kitchen-postcode">
              <Input id="kitchen-postcode" defaultValue="3016 AH" />
            </Field>
            <Field label={t("cityShort")} htmlFor="kitchen-city">
              <Select
                id="kitchen-city"
                value={kitchenCity}
                onChange={(e) => chooseCity(e.target.value)}
                className="h-12 text-[15px]"
              >
                <option value="" disabled>
                  {t("chooseCity")}
                </option>
                {CITY_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="pt-1 text-[13px] font-semibold text-charcoal">
            {t("mapLocation")}
          </p>
          <div className="h-56 overflow-hidden rounded-2xl border border-line bg-cream-100">
            <LocationMap point={pin} onSelect={placePin} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={useCurrentLocation}>
              <MapPin className="size-3.5" />
              {t("useMyLocation")}
            </Button>
            {pin ? (
              <span className="text-[11.5px] text-muted-soft" dir="ltr">
                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
              </span>
            ) : null}
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
            {t("mapPinHint")}
          </p>
          <p className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
            {t("exactAddress")}
          </p>
        </div>
      </Sheet>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => {
          setDeactivateOpen(false);
          toast(t("accountDeleted"), { variant: "info" });
        }}
        title={t("deleteAccountTitle")}
        description={t("deleteAccountWarning")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("keepAccount")}
        variant="destructive"
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  label,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-100 text-charcoal">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold text-charcoal">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
