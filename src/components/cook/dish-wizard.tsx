"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  Upload,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Progress, QuantityStepper } from "@/components/ui/controls";
import { Card } from "@/components/ui/misc";
import { useApp } from "@/components/providers/app-provider";
import { allergenNames, dietaryNames, loc, type Dish } from "@/lib/data";
import {
  useCreateDishMutation,
  useUpdateDishMutation,
  useUploadDishImageMutation,
} from "@/lib/queries";
import { cn, errorMessage, formatPrice } from "@/lib/utils";
import {
  ALL_PICKUP_SLOTS,
  DEFAULT_PICKUP_SLOTS,
  SAME_DAY_RADII,
  WEEK_ORDER,
} from "@/lib/pickup";

export function DishWizard({ dish }: { dish?: Dish }) {
  const { t, lang, toast, cuisines } = useApp();
  const router = useRouter();
  const createDishMutation = useCreateDishMutation();
  const updateDishMutation = useUpdateDishMutation();
  const isEdit = Boolean(dish);
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const [photo, setPhoto] = useState(dish?.image ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadDishImageMutation();

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast(t("photoUploadFailed"), { variant: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(t("photoTooLarge"), { variant: "error" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setPhoto(uploaded.url);
      setError("");
      toast(t("photoSelected"));
    } catch (err) {
      toast(errorMessage(err, t("photoUploadFailed")), { variant: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  }
  const [name, setName] = useState(dish ? loc(dish.name, lang) : "");
  const [description, setDescription] = useState(
    dish ? loc(dish.desc, lang) : "",
  );
  const [cuisine, setCuisine] = useState(dish?.cuisineId ?? "tunisian");
  const [ingredients, setIngredients] = useState<string[]>(
    dish ? dish.ingredients.map((item) => loc(item, lang)).filter(Boolean) : [],
  );
  const [ingredientDraft, setIngredientDraft] = useState("");

  function addIngredients(raw: string) {
    const parts = raw
      .split(/[,،;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setIngredients((current) => {
      const next = [...current];
      for (const part of parts) {
        if (!next.some((i) => i.toLowerCase() === part.toLowerCase())) {
          next.push(part.slice(0, 120));
        }
      }
      return next;
    });
  }
  const [allergens, setAllergens] = useState<string[]>(dish?.allergens ?? []);
  const [dietary, setDietary] = useState<string[]>(dish?.dietary ?? []);
  const [price, setPrice] = useState(dish ? String(dish.price) : "14.50");
  const [serves, setServes] = useState(dish?.serves ?? 2);
  const [minPortions, setMinPortions] = useState(1);
  const [prepTime, setPrepTime] = useState(
    dish ? loc(dish.prepTime, lang) : "2 uur",
  );
  const [windows, setWindows] = useState<Record<string, string[]>>(
    () => dish?.schedule?.windows ?? {},
  );
  const [sameDay, setSameDay] = useState(dish?.schedule?.sameDay ?? false);
  const [sameDayRadius, setSameDayRadius] = useState(
    dish?.schedule?.sameDayRadiusKm ?? 5,
  );
  const [nextDay, setNextDay] = useState(dish?.schedule?.nextDay ?? true);
  const [weekend, setWeekend] = useState(dish?.weekend ?? false);
  const [activeDay, setActiveDay] = useState<string>(
    () => WEEK_ORDER.find((d) => dish?.schedule?.windows?.[d]) ?? "",
  );
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
  const selectedDays = WEEK_ORDER.filter((d) => windows[d]);
  const selectedSlots = [
    ...new Set(selectedDays.flatMap((d) => windows[d])),
  ].sort();
  const currentDay = windows[activeDay] ? activeDay : (selectedDays[0] ?? "");

  function toggleDay(key: string) {
    if (!windows[key]) setActiveDay(key);
    setWindows((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = [...DEFAULT_PICKUP_SLOTS];
      return next;
    });
  }

  function toggleSlot(day: string, slot: string) {
    setWindows((current) => {
      const slots = current[day] ?? [];
      const updated = slots.includes(slot)
        ? slots.filter((s) => s !== slot)
        : [...slots, slot].sort();
      return { ...current, [day]: updated };
    });
  }

  function copySlotsToAll(day: string) {
    setWindows((current) => {
      const source = current[day] ?? [];
      return Object.fromEntries(
        Object.keys(current).map((d) => [d, [...source]]),
      );
    });
  }
  const parsedPrice = Number.parseFloat(price.replace(",", ".")) || 0;

  const previewDish = useMemo(
    () => ({
      image: photo,
      name: name || t("dishNamePh"),
      price: parsedPrice,
      serves,
      cuisine: cuisines.find((item) => item.id === cuisine),
    }),
    [photo, name, parsedPrice, serves, cuisine, cuisines, t],
  );

  function validate() {
    if (step === 0 && !photo) return t("photoRequired");
    if (step === 1 && !name.trim()) return t("nameRequired");
    if (step === 3 && parsedPrice <= 0) return t("priceRequired");
    if (step === 4) {
      if (!selectedDays.length && !sameDay && !nextDay)
        return t("pickAtLeastOneDay");
      if (selectedDays.some((d) => !windows[d].length))
        return t("slotRequired");
    }
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

  async function publish() {
    const payload = {
      name: { nl: name, en: name, ar: name },
      desc: { nl: description, en: description, ar: description },
      image: photo,
      price: parsedPrice,
      cuisineId: cuisine,
      serves,
      portions: capacity,
      portionsLeft: capacity,
      allergens,
      dietary,
      ingredients: [
        ...ingredients,
        ...ingredientDraft
          .split(/[,،;\n]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ].map((s) => ({ nl: s, en: s, ar: s })),
      pickup: selectedDays,
      pickupWindows: windows,
      sameDayPickup: sameDay,
      sameDayRadiusKm: sameDayRadius,
      nextDayPickup: nextDay,
      weekend,
      prepTime: { nl: prepTime, en: prepTime, ar: prepTime },
    };

    try {
      if (isEdit && dish) {
        await updateDishMutation.mutateAsync({ id: dish.id, body: payload });
      } else {
        await createDishMutation.mutateAsync(payload);
      }
      setPublished(true);
      toast(isEdit ? t("savedChanges") : t("dishPublished"), {
        description: isEdit ? undefined : t("dishPublishedDesc"),
      });
      setTimeout(() => router.push("/cook/dishes"), 700);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("loadError"));
      toast(t("loadError"), { variant: "error" });
    }
  }

  function toggle(
    list: string[],
    setList: (value: string[]) => void,
    value: string,
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
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
                <p className="mt-1 text-[13.5px] text-muted">
                  {t("photosSub")}
                </p>

                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleFileSelect(file);
                      event.target.value = "";
                    }}
                  />
                  {photo ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px]">
                      <Image
                        src={photo}
                        alt={name || t("dishPhotoAlt", { dish: "" })}
                        fill
                        sizes="(max-width: 768px) 100vw, 560px"
                        loading="lazy"
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-x-3 bottom-3 flex gap-2">
                        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/92 text-[12.5px] font-semibold text-charcoal backdrop-blur">
                          <Check className="size-3.5 text-olive" />
                          {t("photoSelected")}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
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
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        void handleFileSelect(file);
                      }}
                      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-line-strong bg-cream/50 p-6 text-center transition hover:border-terracotta hover:bg-terracotta-50/30"
                    >
                      <span className="grid size-12 place-items-center rounded-full bg-white text-terracotta shadow-sm">
                        <Upload className="size-5" />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-charcoal">
                          {uploadingPhoto
                            ? t("uploadingPhoto")
                            : t("uploadPhoto")}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          JPG, PNG, WebP · {t("photosSub")}
                        </p>
                      </div>
                    </button>
                  )}

                  <div className="mt-3">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                      {t("samplePhotos")}
                    </p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {[
                        "/img/couscous.jpg",
                        "/img/tagine.jpg",
                        "/img/kibbeh.jpg",
                        "/img/brik.jpg",
                      ].map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setPhoto(sample);
                            setError("");
                          }}
                          className={cn(
                            "relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition",
                            photo === sample
                              ? "border-terracotta ring-2 ring-terracotta/25"
                              : "border-transparent opacity-80 hover:opacity-100",
                          )}
                        >
                          <Image
                            src={sample}
                            alt=""
                            fill
                            sizes="120px"
                            loading="lazy"
                            unoptimized
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
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
                    onChange={(event) =>
                      setDescription(event.target.value.slice(0, 240))
                    }
                    placeholder={t("descriptionPh")}
                    rows={4}
                  />
                </Field>
                <Field label={t("cuisineType")} htmlFor="wizard-cuisine">
                  <Select
                    id="wizard-cuisine"
                    value={cuisine}
                    onChange={(event) =>
                      setCuisine(event.target.value as typeof cuisine)
                    }
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
                  hint={t("ingredientsEnterHint")}
                >
                  <div className="flex gap-2">
                    <Input
                      id="wizard-ingredients"
                      value={ingredientDraft}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (/[,،;]/.test(value)) {
                          addIngredients(value);
                          setIngredientDraft("");
                        } else {
                          setIngredientDraft(value);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addIngredients(ingredientDraft);
                          setIngredientDraft("");
                        }
                      }}
                      onBlur={() => {
                        addIngredients(ingredientDraft);
                        setIngredientDraft("");
                      }}
                      placeholder={t("ingredientsPh")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        addIngredients(ingredientDraft);
                        setIngredientDraft("");
                      }}
                    >
                      {t("addIngredient")}
                    </Button>
                  </div>
                  {ingredients.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ingredients.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setIngredients((cur) =>
                              cur.filter((i) => i !== item),
                            )
                          }
                          aria-label={`${t("remove")} ${item}`}
                          className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-charcoal"
                        >
                          {item}
                          <span aria-hidden className="text-muted">
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Field>
                <div className="flex items-center gap-2 rounded-2xl bg-cream-100 p-3">
                  <Clock3 className="size-4 shrink-0 text-terracotta" />
                  <Field
                    label={t("prepTime")}
                    htmlFor="wizard-prep"
                    className="[&_label]:mb-0"
                  >
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
                      <p className="text-[12.5px] text-muted">
                        {t("allergensSub")}
                      </p>
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
                      <p className="text-[12.5px] text-muted">
                        {t("dietarySub")}
                      </p>
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
                    onChange={(event) =>
                      setMinPortions(Number(event.target.value))
                    }
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
                      const key = [
                        "mon",
                        "tue",
                        "wed",
                        "thu",
                        "fri",
                        "sat",
                        "sun",
                      ][index];
                      const active = selectedDays.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleDay(key)}
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
                  <label className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-[16px] font-semibold text-charcoal">
                        {t("weekendSpecial")}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted">
                        {t("weekendSpecialHint")}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={weekend}
                      onChange={(event) => setWeekend(event.target.checked)}
                      className="mt-1 size-5 shrink-0 accent-[#c65d3a]"
                    />
                  </label>
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
                      {selectedSlots.length} {t("time")}
                    </Badge>
                  </div>
                  {selectedDays.length ? (
                    <>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedDays.map((d) => {
                          const label = weekDays[WEEK_ORDER.indexOf(d)] ?? d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setActiveDay(d)}
                              className={cn(
                                "h-9 rounded-full border px-3 text-[12.5px] font-semibold transition",
                                currentDay === d
                                  ? "border-charcoal bg-charcoal text-cream"
                                  : "border-line bg-white text-muted",
                              )}
                            >
                              {label} · {windows[d].length}
                            </button>
                          );
                        })}
                      </div>
                      {currentDay ? (
                        <>
                          <p className="mt-3 text-[13px] font-semibold text-charcoal">
                            {t("slotsForDay", {
                              day: weekDays[WEEK_ORDER.indexOf(currentDay)],
                            })}
                          </p>
                          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                            {ALL_PICKUP_SLOTS.map((slot) => {
                              const on = windows[currentDay].includes(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => toggleSlot(currentDay, slot)}
                                  className={cn(
                                    "h-9 rounded-lg border text-[12.5px] font-semibold transition",
                                    on
                                      ? "border-terracotta bg-terracotta text-white"
                                      : "border-line bg-white text-muted",
                                  )}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                          {selectedDays.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => copySlotsToAll(currentDay)}
                              className="mt-3 text-[12.5px] font-semibold text-terracotta"
                            >
                              {t("copyToAllDays")}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : null}
                </Card>

                <Card className="space-y-4 p-4 md:p-5">
                  <div>
                    <label className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-[16px] font-semibold text-charcoal">
                          {t("sameDayTitle")}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-muted">
                          {t("sameDayHint")}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={sameDay}
                        onChange={(event) => setSameDay(event.target.checked)}
                        className="size-5 accent-[#c65d3a]"
                      />
                    </label>
                    {sameDay ? (
                      <div className="mt-3">
                        <p className="text-[13px] font-semibold text-charcoal">
                          {t("sameDayRadiusLabel")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {SAME_DAY_RADII.map((km) => (
                            <button
                              key={km}
                              type="button"
                              onClick={() => setSameDayRadius(km)}
                              className={cn(
                                "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition",
                                sameDayRadius === km
                                  ? "border-terracotta bg-terracotta text-white"
                                  : "border-line bg-white text-muted",
                              )}
                            >
                              {km} km
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-[16px] font-semibold text-charcoal">
                        {t("nextDayTitle")}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted">
                        {t("nextDayHint")}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={nextDay}
                      onChange={(event) => setNextDay(event.target.checked)}
                      className="size-5 accent-[#c65d3a]"
                    />
                  </label>
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
                <p className="mt-1 text-[13.5px] text-muted">
                  {t("previewSub")}
                </p>

                <div className="mx-auto mt-4 max-w-[280px]">
                  <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-100">
                      {previewDish.image ? (
                        <Image
                          src={previewDish.image}
                          alt={previewDish.name}
                          fill
                          sizes="280px"
                          loading="lazy"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-muted-soft">
                          <ImagePlus className="size-7" />
                        </div>
                      )}
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
                      {selectedDays.length} ·{" "}
                      {t("cookingDaysCount", { count: selectedDays.length })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("pickupSlots")}</span>
                    <span className="font-medium text-charcoal">
                      {selectedSlots.slice(0, 3).join(", ")}
                      {selectedSlots.length > 3
                        ? " +" + (selectedSlots.length - 3)
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("allergens")}</span>
                    <span className="max-w-[60%] text-end font-medium text-charcoal">
                      {allergens.length
                        ? allergens
                            .map((key) => loc(allergenNames[key], lang))
                            .join(", ")
                        : t("allergensNone")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("dietary")}</span>
                    <span className="max-w-[60%] text-end font-medium text-charcoal">
                      {dietary.length
                        ? dietary
                            .map((key) => loc(dietaryNames[key], lang))
                            .join(", ")
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
                onClick={() =>
                  step === 0 ? router.push("/cook/dishes") : setStep(step - 1)
                }
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
                <Badge
                  variant={photo && name ? "olive" : "outline"}
                  size="sm"
                  className="ms-auto"
                >
                  {photo && name ? t("live") : t("draft")}
                </Badge>
              </div>
              <div className="p-3">
                <div className="overflow-hidden rounded-2xl border border-line">
                  <div className="relative aspect-[4/3] w-full bg-cream-100">
                    {previewDish.image ? (
                      <Image
                        src={previewDish.image}
                        alt={previewDish.name}
                        fill
                        sizes="320px"
                        loading="lazy"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-soft">
                        <ImagePlus className="size-7" />
                      </div>
                    )}
                  </div>
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
                      {selectedDays.length} {t("days")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="text-muted">
                      {t("portionsAvailableLabel")}
                    </span>
                    <span className="font-medium text-charcoal">
                      {capacity}
                    </span>
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
