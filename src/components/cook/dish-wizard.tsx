"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  ImagePlus,
  Info,
  Leaf,
  Minus,
  Plus,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Progress, QuantityStepper } from "@/components/ui/controls";
import { Card, Money } from "@/components/ui/misc";
import { useApp } from "@/components/providers/app-provider";
import {
  allergenNames,
  cuisines,
  dietaryNames,
  loc,
  pickupOptions,
  type Dish,
} from "@/lib/data";
import { useCreateDishMutation, useUpdateDishMutation } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

const samplePhotos = [
  "/img/couscous.jpg",
  "/img/kibbeh.jpg",
  "/img/brik.jpg",
  "/img/tagine.jpg",
  "/img/stuffed.jpg",
  "/img/splash-tajine.jpg",
];

const defaultSlots = ["12:00", "12:30", "17:30", "18:00", "18:30"];
const allSlots = ["12:00", "12:30", "13:00", "17:00", "17:30", "18:00", "18:30", "19:00"];

export function DishWizard({ dish }: { dish?: Dish }) {
  const { t, lang, toast } = useApp();
  const router = useRouter();
  const createDishMutation = useCreateDishMutation();
  const updateDishMutation = useUpdateDishMutation();
  const isEdit = Boolean(dish);
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const [photo, setPhoto] = useState(dish?.image ?? "");
  const [name, setName] = useState(dish ? loc(dish.name, lang) : "");
  const [description, setDescription] = useState(
    dish ? loc(dish.desc, lang) : "",
  );
  const [cuisine, setCuisine] = useState(dish?.cuisineId ?? "tunisian");
  const [ingredients, setIngredients] = useState(
    dish ? dish.ingredients.map((item) => loc(item, lang)).join(", ") : "",
  );
  const [allergens, setAllergens] = useState<string[]>(dish?.allergens ?? []);
  const [dietary, setDietary] = useState<string[]>(dish?.dietary ?? []);
  const [price, setPrice] = useState(dish ? String(dish.price) : "14.50");
  const [serves, setServes] = useState(dish?.serves ?? 2);
  const [minPortions, setMinPortions] = useState(1);
  const [prepTime, setPrepTime] = useState(
    dish ? loc(dish.prepTime, lang) : "2 uur",
  );
  const [days, setDays] = useState<string[]>(["fri", "sat", "sun"]);
  const [slots, setSlots] = useState<string[]>(defaultSlots);
  const [capacity, setCapacity] = useState(dish?.portions ?? 12);

  const steps = [
    "stepPhotos",
    "stepDetails",
    "stepDietary",
    "stepPricing",
    "stepDishAvailability",
    "stepPreview",
  ];

  const weekDays = t("weekDays").split(",");
  const parsedPrice = Number.parseFloat(price.replace(",", ".")) || 0;

  const previewDish = useMemo(
    () => ({
      image: photo || samplePhotos[0],
      name: name || t("dishNamePh"),
      price: parsedPrice,
      serves,
      cuisine: cuisines.find((item) => item.id === cuisine),
    }),
    [photo, name, parsedPrice, serves, cuisine, t],
  );

  function validate() {
    if (step === 0 && !photo) return t("photoRequired");
    if (step === 1 && !name.trim()) return t("nameRequired");
    if (step === 3 && parsedPrice <= 0) return t("priceRequired");
    if (step === 4 && (!days.length || !slots.length)) return t("slotRequired");
    return "";
  }

  function next() {
    const message = validate();
    if (message) {
      setError(message);
      toast(message, { variant: "error" });
      return;
    }
    setError("");
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      publish();
    }
  }

  function publish() {
    const payload = {
      name: { nl: name, en: name, ar: name },
      desc: { nl: description, en: description, ar: description },
      image: photo || samplePhotos[0],
      price: parsedPrice,
      cuisineId: cuisine,
      serves,
      portions: capacity,
      portionsLeft: capacity,
      allergens,
      dietary,
      ingredients: ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ nl: s, en: s, ar: s })),
      pickup: ["fri-30", "sat-31"],
      prepTime: { nl: prepTime, en: prepTime, ar: prepTime },
    };

    if (isEdit && dish) {
      updateDishMutation.mutate({ id: dish.id, body: payload });
    } else {
      createDishMutation.mutate(payload);
    }

    setPublished(true);
    toast(isEdit ? t("savedChanges") : t("dishPublished"), {
      description: isEdit ? undefined : t("dishPublishedDesc"),
    });
    setTimeout(() => router.push("/cook/dishes"), 700);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(list: string[], setList: (value: string[]) => void, value: string) {
    setList(
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }

  if (published) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[480px] flex-col items-center justify-center px-6 text-center">
        <div className="grid size-[76px] place-items-center rounded-full bg-olive text-white shadow-[0_16px_36px_-16px_rgba(105,118,83,0.8)] animate-pop">
          <Check className="size-9" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 font-display text-[28px] font-semibold text-charcoal">
          {isEdit ? t("savedChanges") : t("dishPublished")}
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          {isEdit ? t("dishDetailsNote") : t("dishPublishedDesc")}
        </p>
        <Button className="mt-5" onClick={() => router.push("/cook/dishes")}>
          {t("myDishes")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1100px] md:px-8 md:pt-10">
        {/* header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/cook/dishes")}
            aria-label={t("back")}
            className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal hover:bg-cream-100"
          >
            <ArrowLeft className="size-5 rtl:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[24px] font-semibold leading-tight text-charcoal md:text-[32px]">
              {isEdit ? t("editDishTitle") : t("newDish")}
            </h1>
            <p className="text-[12.5px] text-muted md:text-[14px]">
              {t("stepLabel", { current: step + 1 })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              toast(t("savedDraftToast"));
              router.push("/cook/dishes");
            }}
            className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-[12.5px] font-semibold text-muted"
          >
            {t("saveAndExit")}
          </button>
        </div>

        {/* step bar */}
        <div className="mt-4 md:mt-6">
          <Progress value={((step + 1) / 6) * 100} className="h-1.5" />
          <div className="mt-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {steps.map((key, index) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (index <= step) setStep(index);
                }}
                className={cn(
                  "shrink-0 whitespace-nowrap text-[11.5px] font-semibold transition",
                  index === step
                    ? "text-terracotta"
                    : index < step
                      ? "text-charcoal"
                      : "text-muted-soft",
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_340px] md:items-start">
          <div>
            {step === 0 ? (
              <Card className="p-4 md:p-5">
                <h2 className="text-[17px] font-semibold text-charcoal">
                  {t("photosTitle")}
                </h2>
                <p className="mt-1 text-[13.5px] text-muted">{t("photosSub")}</p>

                <div className="mt-4">
                  {photo ? (
                    <div className="relative overflow-hidden rounded-[22px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={name || t("dishPhotoAlt", { dish: "" })}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="absolute inset-x-3 bottom-3 flex gap-2">
                        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/92 text-[12.5px] font-semibold text-charcoal backdrop-blur">
                          <Check className="size-3.5 text-olive" />
                          {t("photoSelected")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhoto("")}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-charcoal/80 px-3 text-[12.5px] font-semibold text-white backdrop-blur"
                        >
                          <ImagePlus className="size-3.5" />
                          {t("editPhoto")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPhoto(samplePhotos[0])}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-line-strong bg-cream/40 py-10 transition hover:border-terracotta/50 hover:bg-terracotta-50/30"
                    >
                      <span className="grid size-12 place-items-center rounded-full bg-white text-terracotta shadow-sm">
                        <ImagePlus className="size-5" />
                      </span>
                      <span className="text-[14px] font-semibold text-charcoal">
                        {t("choosePhotoHint")}
                      </span>
                      <span className="text-[12px] text-muted">
                        {t("photoHint")}
                      </span>
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {t("samplePhotos")}
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {samplePhotos.slice(0, 4).map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => {
                          setPhoto(src);
                          toast(t("photoSelected"));
                        }}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl border-2 transition",
                          photo === src
                            ? "border-terracotta"
                            : "border-transparent hover:opacity-90",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="size-full object-cover" />
                        {photo === src ? (
                          <span className="absolute end-1 top-1 grid size-4 place-items-center rounded-full bg-terracotta text-white">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card className="space-y-4 p-4 md:p-5">
                <Field label={t("dishName")} htmlFor="wizard-name" required>
                  <Input
                    id="wizard-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("dishNamePh")}
                    maxLength={70}
                  />
                </Field>
                <Field
                  label={t("descriptionLabel")}
                  htmlFor="wizard-desc"
                  hint={`${description.length}/240`}
                >
                  <Textarea
                    id="wizard-desc"
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 240))}
                    placeholder={t("descriptionPh")}
                    rows={4}
                  />
                </Field>
                <Field label={t("cuisineType")} htmlFor="wizard-cuisine">
                  <Select
                    id="wizard-cuisine"
                    value={cuisine}
                    onChange={(event) => setCuisine(event.target.value as typeof cuisine)}
                  >
                    {cuisines.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.flag} {loc(item.label, lang)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t("ingredientsLabel")}
                  htmlFor="wizard-ingredients"
                  hint={t("ingredientsHint")}
                >
                  <Textarea
                    id="wizard-ingredients"
                    value={ingredients}
                    onChange={(event) => setIngredients(event.target.value)}
                    placeholder={t("ingredientsPh")}
                    rows={3}
                  />
                </Field>
                <div className="flex items-center gap-2 rounded-2xl bg-cream-100 p-3">
                  <Clock3 className="size-4 shrink-0 text-terracotta" />
                  <Field label={t("prepTime")} htmlFor="wizard-prep" className="[&_label]:mb-0">
                    <Input
                      id="wizard-prep"
                      value={prepTime}
                      onChange={(event) => setPrepTime(event.target.value)}
                      placeholder={t("prepTimeHint")}
                      className="mt-1 h-9 rounded-xl text-[14px]"
                    />
                  </Field>
                </div>
              </Card>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <Card className="p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-terracotta-50 text-terracotta">
                      <Info className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-semibold text-charcoal">
                        {t("allergensTitle")}
                      </h2>
                      <p className="text-[12.5px] text-muted">{t("allergensSub")}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {t("selectAllergens")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(allergenNames).map(([key, label]) => {
                      const active = allergens.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(allergens, setAllergens, key)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition",
                            active
                              ? "border-terracotta bg-terracotta text-white"
                              : "border-line bg-white text-charcoal",
                          )}
                        >
                          {active ? <Check className="size-3" /> : null}
                          {loc(label, lang)}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-olive-50 text-olive-600">
                      <Leaf className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-semibold text-charcoal">
                        {t("dietaryTitle")}
                      </h2>
                      <p className="text-[12.5px] text-muted">{t("dietarySub")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(dietaryNames).map(([key, label]) => {
                      const active = dietary.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(dietary, setDietary, key)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition",
                            active
                              ? "border-olive bg-olive text-white"
                              : "border-line bg-white text-charcoal",
                          )}
                        >
                          {active ? <Check className="size-3" /> : null}
                          {loc(label, lang)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 rounded-xl bg-cream-100 p-2.5 text-[12px] leading-relaxed text-muted">
                    {t("allergenNote")}
                  </p>
                </Card>
              </div>
            ) : null}

            {step === 3 ? (
              <Card className="space-y-4 p-4 md:p-5">
                <Field
                  label={t("priceEachLabel")}
                  htmlFor="wizard-price"
                  hint={t("priceIncludes")}
                  required
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold text-muted">
                      €
                    </span>
                    <Input
                      id="wizard-price"
                      inputMode="decimal"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      className="ps-8 text-[19px] font-semibold"
                    />
                  </div>
                </Field>

                <div>
                  <p className="text-[15px] font-semibold text-charcoal">
                    {t("servesLabel")}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <QuantityStepper
                      value={serves}
                      onChange={setServes}
                      min={1}
                      max={12}
                    />
                    <span className="text-[13.5px] text-muted">
                      {t("people")}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[15px] font-semibold text-charcoal">
                    {t("portionsAvailableLabel")}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <QuantityStepper
                      value={capacity}
                      onChange={setCapacity}
                      min={1}
                      max={60}
                    />
                    <span className="text-[13.5px] text-muted">
                      {t("portionsPerDay")}
                    </span>
                  </div>
                </div>

                <Field label={t("minPortionsLabel")} htmlFor="wizard-min">
                  <Select
                    id="wizard-min"
                    value={String(minPortions)}
                    onChange={(event) => setMinPortions(Number(event.target.value))}
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>
                        {value} {t("portions").toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="flex items-center justify-between rounded-2xl bg-cream-100 p-3">
                  <span className="text-[13.5px] text-muted">
                    {t("customerPays")}
                  </span>
                  <span className="text-[18px] font-semibold text-charcoal">
                    {formatPrice(parsedPrice, lang)}
                  </span>
                </div>
              </Card>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                <Card className="p-4 md:p-5">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("cookingDays")}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {t("cookingDaysSub")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {weekDays.map((day, index) => {
                      const key = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][index];
                      const active = days.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(days, setDays, key)}
                          className={cn(
                            "flex h-10 min-w-[52px] flex-1 items-center justify-center rounded-xl border text-[13px] font-semibold transition",
                            active
                              ? "border-terracotta bg-terracotta text-white"
                              : "border-line bg-white text-muted",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[16px] font-semibold text-charcoal">
                        {t("timeSlotsShort")}
                      </h2>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {t("pickupSlotsSub")}
                      </p>
                    </div>
                    <Badge variant="outline" size="sm">
                      {slots.length} {t("time")}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {allSlots.map((slot) => {
                      const active = slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggle(slots, setSlots, slot)}
                          className={cn(
                            "flex h-9 items-center justify-center rounded-xl border text-[13px] font-semibold transition",
                            active
                              ? "border-olive bg-olive-50 text-olive-600"
                              : "border-line bg-white text-muted",
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-4 md:p-5">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("capacity")}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {t("capacityHint")}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCapacity(Math.max(1, capacity - 1))}
                      className="grid size-10 place-items-center rounded-full border border-line bg-white text-charcoal"
                      aria-label={t("remove")}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-12 text-center text-[20px] font-semibold text-charcoal">
                      {capacity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCapacity(capacity + 1)}
                      className="grid size-10 place-items-center rounded-full border border-line bg-white text-charcoal"
                      aria-label={t("addAnother")}
                    >
                      <Plus className="size-4" />
                    </button>
                    <span className="text-[13px] text-muted">
                      {t("portionsPerDayShort", { count: capacity })}
                    </span>
                  </div>
                </Card>

                <div className="rounded-2xl bg-cream-100 p-3">
                  <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
                    <Users className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                    {t("saveScheduleNote")}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <Card className="overflow-hidden p-4 md:p-5">
                <h2 className="text-[17px] font-semibold text-charcoal">
                  {t("previewTitle")}
                </h2>
                <p className="mt-1 text-[13.5px] text-muted">{t("previewSub")}</p>

                <div className="mx-auto mt-4 max-w-[280px]">
                  <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewDish.image}
                        alt={previewDish.name}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="absolute start-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-terracotta backdrop-blur">
                        {previewDish.cuisine?.flag}{" "}
                        {previewDish.cuisine
                          ? loc(previewDish.cuisine.label, lang)
                          : ""}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-[15px] font-semibold text-charcoal">
                          {previewDish.name}
                        </p>
                        <span className="flex items-center gap-0.5 text-[12px] font-semibold text-charcoal">
                          <Star className="size-3 fill-saffron text-saffron" />
                          4.9
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                        {description || t("descriptionPh")}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[12px] text-muted">
                          <UtensilsCrossed className="size-3" />
                          {t("serves")} {serves}
                        </span>
                        <span className="text-[16px] font-semibold text-terracotta">
                          {formatPrice(parsedPrice, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[11.5px] text-muted-soft">
                    {t("dishPreviewNote")}
                  </p>
                </div>

                <div className="mt-4 space-y-2 rounded-2xl bg-cream-50 p-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("cookingDays")}</span>
                    <span className="font-medium text-charcoal">
                      {days.length} · {t("cookingDaysCount", { count: days.length })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("pickupSlots")}</span>
                    <span className="font-medium text-charcoal">
                      {slots.slice(0, 3).join(", ")}
                      {slots.length > 3 ? " +" + (slots.length - 3) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("allergens")}</span>
                    <span className="max-w-[60%] text-end font-medium text-charcoal">
                      {allergens.length
                        ? allergens.map((key) => loc(allergenNames[key], lang)).join(", ")
                        : t("allergensNone")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("dietary")}</span>
                    <span className="max-w-[60%] text-end font-medium text-charcoal">
                      {dietary.length
                        ? dietary.map((key) => loc(dietaryNames[key], lang)).join(", ")
                        : t("dietaryNone")}
                    </span>
                  </div>
                </div>

                <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  {t("dishDetailsNote")}
                </p>
              </Card>
            ) : null}

            {error ? (
              <p className="mt-3 rounded-xl bg-[#fdf1ec] px-3 py-2 text-[13px] font-medium text-[#a13a28]">
                {error}
              </p>
            ) : null}

            {/* desktop nav */}
            <div className="mt-4 hidden items-center justify-between md:flex">
              <Button
                variant="ghost"
                onClick={() => (step === 0 ? router.push("/cook/dishes") : setStep(step - 1))}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {step === 0 ? t("cancel") : t("prevStep")}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast(t("savedDraftToast"));
                    router.push("/cook/dishes");
                  }}
                >
                  {t("saveDraft")}
                </Button>
                <Button onClick={next} className="px-6">
                  {step === 5
                    ? isEdit
                      ? t("saveChanges")
                      : t("publishDish")
                    : t("nextStep")}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </div>

          {/* preview aside */}
          <aside className="hidden md:sticky md:top-24 md:block">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line/70 px-3.5 py-2.5">
                <ChefHat className="size-4 text-terracotta" />
                <p className="text-[13.5px] font-semibold text-charcoal">
                  {t("livePreview")}
                </p>
                <Badge variant={photo && name ? "olive" : "outline"} size="sm" className="ms-auto">
                  {photo && name ? t("live") : t("draft")}
                </Badge>
              </div>
              <div className="p-3">
                <div className="overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDish.image}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="line-clamp-1 text-[14.5px] font-semibold text-charcoal">
                      {previewDish.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
                      {description || t("descriptionPh")}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[12px] text-muted">
                        <Users className="size-3" />
                        {serves}
                      </span>
                      <span className="text-[15px] font-semibold text-terracotta">
                        {formatPrice(parsedPrice, lang)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-[12.5px]">
                    <span className="text-muted">{t("availablePickup")}</span>
                    <span className="font-medium text-charcoal">
                      {days.length} {t("days")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="text-muted">{t("portionsAvailableLabel")}</span>
                    <span className="font-medium text-charcoal">{capacity}</span>
                  </div>
                </div>
              </div>
            </Card>
            <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-muted-soft">
              {t("dishPreviewNote")}
            </p>
          </aside>
        </div>
      </div>

      {/* mobile nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-cream/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[480px] items-center gap-2 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          {step > 0 ? (
            <Button
              variant="outline"
              className="h-12"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t("prevStep")}
            </Button>
          ) : null}
          <Button className="h-12 flex-1" onClick={next}>
            {step === 5
              ? isEdit
                ? t("saveChanges")
                : t("publishDish")
              : t("nextStep")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
