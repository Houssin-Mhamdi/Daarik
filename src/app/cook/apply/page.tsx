"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  FileCheck2,
  FileText,
  Fingerprint,
  Home,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import { Card } from "@/components/ui/misc";
import { useApp } from "@/components/providers/app-provider";
import { useApplyCookMutation, useMyCookApplicationQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Doc = { id: string; label: string; hint: string; icon: typeof FileText };

const docs: Doc[] = [
  {
    id: "docId",
    label: "docId",
    hint: "Passport or ID card",
    icon: Fingerprint,
  },
  {
    id: "docHealth",
    label: "docHealth",
    hint: "PDF, JPG or PNG · max 10 MB",
    icon: FileCheck2,
  },
  {
    id: "docAddress",
    label: "docAddress",
    hint: "Utility bill or registration",
    icon: Home,
  },
];

export default function CookApplyPage() {
  const { t, toast, user, isAuthenticated, logout, cuisines } = useApp();
  const router = useRouter();
  const applyCookMutation = useApplyCookMutation();
  const { data: existingApplication, isPending: applicationPending } =
    useMyCookApplicationQuery(true, user.email);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("darna.cookApplicationEmail");
    }
    await logout();
    toast(t("signOut"), { variant: "info" });
    router.push("/login");
  };
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [fullName, setFullName] = useState(user.name);
  const [postcode, setPostcode] = useState("3016 AH");
  const [city, setCity] = useState(user.city || "");
  const [cuisineId, setCuisineId] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setEmail((current) => current || user.email || "");
      setPhone((current) => current || user.phone || "");
      setFullName((current) => current || user.name || "");
      setCity((current) => current || user.city || "");
    });
    return () => {
      active = false;
    };
  }, [user.email, user.phone, user.name, user.city]);

  const [checks, setChecks] = useState<Record<string, boolean>>({
    hygiene: true,
    allergens: true,
    registration: true,
    insurance: false,
    terms: false,
  });
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { key: "stepAccount", icon: UserRound },
    { key: "stepPersonal", icon: MapPin },
    { key: "stepEligibility", icon: ShieldCheck },
    { key: "stepDocuments", icon: FileText },
  ] as const;

  const uploadedCount = docs.filter((doc) => uploaded[doc.id]).length;

  function validate() {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        next.email = t("invalidEmail");
      if (phone.replace(/\D/g, "").length < 7) next.phone = t("requiredField");
    }
    if (step === 1) {
      if (!fullName.trim()) next.fullName = t("requiredField");
      if (!postcode.trim()) next.postcode = t("requiredField");
      else if (!/^\d{4}\s?[A-Za-z]{2}$/.test(postcode.trim()))
        next.postcode = t("invalidPostcode");
      if (!city.trim()) next.city = t("requiredField");
      if (!cuisineId) next.cuisine = t("requiredField");
    }
    if (step === 2) {
      const required = [
        "hygiene",
        "allergens",
        "registration",
        "insurance",
        "terms",
      ];
      if (required.some((key) => !checks[key])) next.checks = t("selectOption");
    }
    if (step === 3) {
      if (docs.some((doc) => !uploaded[doc.id])) next.docs = t("docRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function next() {
    if (!validate()) return;
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      try {
        await applyCookMutation.mutateAsync({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          area: city.trim(),
          cuisine: cuisineId,
          bio: about.trim(),
          hygieneCertificate: Boolean(checks.hygiene),
          idVerified: false,
        });
        setSubmitted(true);
        toast(t("applicationSubmitted"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("paymentFailed");
        setErrors({ application: message });
        toast(message, { variant: "error" });
      }
    }
  }

  function upload(id: string) {
    setUploading(id);
    setTimeout(() => {
      setUploaded((prev) => ({ ...prev, [id]: true }));
      setUploading(null);
      toast(t("uploaded"));
    }, 850);
  }

  const isApproved = existingApplication?.status === "APPROVED";
  const isChangesRequested =
    existingApplication?.status === "CHANGES_REQUESTED";
  const applicationSubmitted =
    submitted ||
    existingApplication?.status === "PENDING" ||
    isApproved;

  if (applicationPending) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">
        {t("loading")}
      </div>
    );
  }

  if (applicationSubmitted) {
    return (
      <div className="min-h-dvh bg-cream pb-12">
        <div className="mx-auto w-full max-w-[520px] px-4 pt-10 md:max-w-[720px] md:pt-20">
          <div className="text-center">
            <div className="mx-auto grid size-[76px] place-items-center rounded-full bg-olive text-white shadow-[0_16px_36px_-16px_rgba(105,118,83,0.8)] animate-pop">
              {isApproved ? (
                <CheckCircle2 className="size-9" />
              ) : (
                <FileCheck2 className="size-9" />
              )}
            </div>
            <h1 className="mt-5 font-display text-[31px] font-semibold leading-tight text-charcoal md:text-[38px]">
              {isApproved ? t("cookDashboard") : t("applicationSubmitted")}
            </h1>
            <p className="mx-auto mt-2 max-w-[380px] text-[14.5px] leading-relaxed text-muted">
              {isApproved
                ? t("dashboardNote")
                : t("applicationSubmittedSub")}
            </p>
            {isApproved ? (
              <Badge variant="olive" size="lg" className="mt-4">
                <Check className="size-3.5" strokeWidth={3} />
                {t("verified")}
              </Badge>
            ) : (
              <Badge variant="saffron" size="lg" className="mt-4">
                <Loader2 className="size-3.5 animate-spin" />
                {t("verificationPending")}
              </Badge>
            )}
          </div>

          <Card className="mt-7 overflow-hidden">
            <div className="border-b border-line/70 bg-cream/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[14.5px] font-semibold text-charcoal">
                  {t("progress")}
                </p>
                <span className="text-[12.5px] text-muted">
                  {t("documentsComplete", { count: 3 })}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {[
                  { label: t("applicationSubmitted"), done: true },
                  { label: t("verificationDocuments"), done: true },
                  { label: t("verificationPending"), done: isApproved },
                  { label: t("cookDashboard"), done: isApproved },
                ].map((item, index) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                        item.done
                          ? "bg-olive text-white"
                          : "border border-line-strong bg-white text-[11px] font-bold text-muted",
                      )}
                    >
                      {item.done ? (
                        <Check className="size-3" strokeWidth={3} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                      <p
                        className={cn(
                          "text-[14px] font-medium",
                          item.done ? "text-charcoal" : "text-muted",
                        )}
                      >
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {isApproved ? (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <Link href="/cook/dashboard">
                <Button className="h-12 w-full">
                  <ChefHat className="size-4" />
                  {t("cookDashboard")}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/cook/dishes/new">
                <Button variant="outline" className="h-12 w-full">
                  <Plus className="size-4" />
                  {t("addNewDish")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-terracotta-50 p-4">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-terracotta-700">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                {t("verificationNote")}
              </p>
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-3.5" />
              {t("signOut")}
            </Button>
          </div>

          <p className="mt-4 text-center text-[12.5px] text-muted">
            {t("applicationNote")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream pb-32 md:pb-14">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-4 md:max-w-[960px] md:px-8 md:pt-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            aria-label={t("back")}
            className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal transition hover:bg-cream-100 disabled:opacity-40"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="font-display text-[24px] font-semibold leading-tight text-charcoal md:text-[34px]">
              {t("applyTitle")}
            </h1>
            <p className="text-[13px] text-muted md:text-[14.5px]">
              {t("applySub")}
            </p>
          </div>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="ms-auto"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-3.5" />
              {t("signOut")}
            </Button>
          ) : null}
        </div>

        {/* Stepper */}
        {isChangesRequested ? (
          <div className="mt-4 rounded-2xl border border-saffron/40 bg-saffron-50/70 p-4 text-[13.5px] text-[#8a5d13]">
            <p className="font-semibold">
              Changes requested by Daarik Admin:
            </p>
            <p className="mt-1">
              {existingApplication?.reviewerNotes ||
                "Please review your details and resubmit your application."}
            </p>
          </div>
        ) : null}
        <div className="mt-5 md:mt-8">
          <div className="flex items-center gap-1.5">
            {steps.map((item, index) => (
              <div key={item.key} className="flex flex-1 items-center gap-1.5">
                <div className="flex-1">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      index <= step ? "bg-terracotta" : "bg-cream-200",
                    )}
                  />
                  <p
                    className={cn(
                      "mt-1.5 hidden text-[11.5px] font-semibold sm:block",
                      index <= step ? "text-charcoal" : "text-muted-soft",
                    )}
                  >
                    {t(item.key)}
                  </p>
                </div>
              </div>
            ))}
            <span className="ms-1 text-[12px] font-semibold text-muted">
              {step + 1}/4
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-terracotta-50 text-terracotta">
              {(() => {
                const Icon = steps[step].icon;
                return <Icon className="size-4" />;
              })()}
            </span>
            <div>
              <p className="text-[16px] font-semibold text-charcoal">
                {t(
                  step === 0
                    ? "accountTitle"
                    : step === 1
                      ? "personalTitle"
                      : step === 2
                        ? "eligibilityTitle"
                        : "documentsTitle",
                )}
              </p>
              <p className="text-[12.5px] text-muted">
                {t(
                  step === 0
                    ? "accountSub"
                    : step === 1
                      ? "personalSub"
                      : step === 2
                        ? "eligibilitySub"
                        : "documentsSub",
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_300px] md:items-start">
          <div>
            {step === 0 ? (
              <Card className="space-y-4 p-4 md:p-5">
                <Field
                  label={t("emailLabel")}
                  htmlFor="apply-email"
                  error={errors.email}
                  required
                >
                  <Input
                    id="apply-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field
                  label={t("phoneLabel")}
                  htmlFor="apply-phone"
                  error={errors.phone}
                  required
                >
                  <Input
                    id="apply-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                  />
                </Field>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  {t("accountSub")}
                </p>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card className="space-y-4 p-4 md:p-5">
                <Field
                  label={t("fullName")}
                  htmlFor="apply-name"
                  error={errors.fullName}
                  required
                >
                  <Input
                    id="apply-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field
                  label={t("filterCuisine")}
                  htmlFor="apply-cuisine"
                  error={errors.cuisine}
                  required
                >
                  <Select
                    id="apply-cuisine"
                    value={cuisineId}
                    onChange={(event) => setCuisineId(event.target.value)}
                  >
                    <option value="">{t("filterCuisine")}</option>
                    {cuisines.map((cuisine) => (
                      <option key={cuisine.id} value={cuisine.id}>
                        {cuisine.label.en}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t("postcode")}
                    htmlFor="apply-postcode"
                    error={errors.postcode}
                    required
                  >
                    <Input
                      id="apply-postcode"
                      value={postcode}
                      onChange={(event) =>
                        setPostcode(event.target.value.toUpperCase())
                      }
                      autoComplete="postal-code"
                      placeholder="1234 AB"
                    />
                  </Field>
                  <Field
                    label={t("cityLabel")}
                    htmlFor="apply-city"
                    error={errors.city}
                    required
                  >
                    <Input
                      id="apply-city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      autoComplete="address-level2"
                    />
                  </Field>
                </div>
                <Field
                  label={t("aboutKitchen")}
                  htmlFor="apply-about"
                  hint={t("kitchenPhotoSub")}
                >
                  <Textarea
                    id="apply-about"
                    value={about}
                    onChange={(event) => setAbout(event.target.value)}
                    placeholder={t("descriptionPh")}
                  />
                </Field>
                <p className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[12.5px] leading-relaxed text-muted">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-olive" />
                  {t("kitchenAddressNote")}
                </p>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card className="p-4 md:p-5">
                <div className="space-y-1">
                  {[
                    ["hygiene", "checkHygiene"],
                    ["allergens", "checkAllergens"],
                    ["registration", "checkRegistration"],
                    ["insurance", "checkInsurance"],
                    ["terms", "checkTerms"],
                  ].map(([id, key]) => (
                    <Checkbox
                      key={id}
                      checked={Boolean(checks[id])}
                      onCheckedChange={(value) =>
                        setChecks((prev) => ({ ...prev, [id]: value }))
                      }
                      label={t(key)}
                      className="px-1"
                    />
                  ))}
                </div>
                {errors.checks ? (
                  <p className="mt-1 rounded-xl bg-[#fdf1ec] px-3 py-2 text-[13px] font-medium text-[#a13a28]">
                    {errors.checks}
                  </p>
                ) : null}
                <div className="mt-4 rounded-2xl bg-terracotta-50 p-3">
                  <p className="text-[12px] leading-relaxed text-terracotta-700">
                    {t("eligibilityNote")}
                  </p>
                </div>
              </Card>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                {docs.map((doc) => {
                  const done = Boolean(uploaded[doc.id]);
                  const Icon = doc.icon;
                  return (
                    <Card
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 p-4 transition",
                        done && "border-olive/30 bg-olive-50/30",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl",
                          done
                            ? "bg-olive text-white"
                            : "bg-cream-100 text-charcoal",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <Icon className="size-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-semibold text-charcoal">
                          {t(doc.label)}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          {done
                            ? `${doc.id === "docId" ? "id-scan.pdf" : doc.id === "docHealth" ? "food-safety.pdf" : "address.pdf"} · 1.2 MB`
                            : doc.hint}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => upload(doc.id)}
                        className={cn(
                          "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition",
                          done
                            ? "border border-line bg-white text-muted"
                            : "bg-terracotta text-white",
                        )}
                      >
                        {uploading === doc.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : done ? (
                          t("replace")
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            {t("upload")}
                          </>
                        )}
                      </button>
                    </Card>
                  );
                })}
                {errors.docs ? (
                  <p className="rounded-xl bg-[#fdf1ec] px-3 py-2 text-[13px] font-medium text-[#a13a28]">
                    {errors.docs}
                  </p>
                ) : null}
                <div className="rounded-2xl bg-cream-100 p-3">
                  <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                    {t("documentsSub")} · {t("verificationNote")}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted-soft">
              <Sparkles className="size-3" />
              {t("applicationNote")}
            </p>
          </div>

          {/* Aside review */}
          <aside className="hidden space-y-3 md:sticky md:top-24 md:block">
            <Card className="p-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
                {t("progress")}
              </p>
              <div className="mt-3 space-y-2.5">
                {steps.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (index <= step) setStep(index);
                      }}
                      disabled={index > step}
                      className="flex w-full items-center gap-2.5 text-start disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full text-[12px] font-bold",
                          index < step
                            ? "bg-olive text-white"
                            : index === step
                              ? "bg-terracotta text-white"
                              : "border border-line bg-white text-muted",
                        )}
                      >
                        {index < step ? (
                          <Check className="size-3.5" strokeWidth={3} />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-[13.5px] font-medium",
                          index === step ? "text-charcoal" : "text-muted",
                        )}
                      >
                        {t(item.key)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[12px] leading-relaxed text-muted">
                  {t("documentsComplete", { count: uploadedCount })}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className="h-full rounded-full bg-olive transition-all"
                    style={{ width: `${(uploadedCount / 3) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
            <div className="rounded-2xl bg-terracotta-50 p-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-terracotta-700">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                {t("verificationNote")}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-cream/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[480px] items-center gap-2 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          {step > 0 ? (
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setStep(step - 1);
                setErrors({});
              }}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t("prevStep")}
            </Button>
          ) : null}
          <Button className="h-12 flex-1" onClick={next}>
            {step === 3 ? t("submitApplication") : t("nextStep")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-4 hidden max-w-[960px] px-8 md:flex md:justify-end">
        <Button
          variant="ghost"
          onClick={() => {
            setStep(Math.max(0, step - 1));
            setErrors({});
          }}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("prevStep")}
        </Button>
        <Button className="ms-2 px-6" onClick={next}>
          {step === 3 ? t("submitApplication") : t("nextStep")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
