"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  FileCheck2,
  FileText,
  Fingerprint,
  Home,
  Loader2,
  MapPin,
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
import { useApplyCookMutation } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Doc = { id: string; label: string; hint: string; icon: typeof FileText };

const docs: Doc[] = [
  { id: "docId", label: "docId", hint: "Passport or ID card", icon: Fingerprint },
  { id: "docHealth", label: "docHealth", hint: "PDF, JPG or PNG · max 10 MB", icon: FileCheck2 },
  { id: "docAddress", label: "docAddress", hint: "Utility bill or registration", icon: Home },
];

export default function CookApplyPage() {
  const { t, toast } = useApp();
  const applyCookMutation = useApplyCookMutation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const [email, setEmail] = useState("rana@example.nl");
  const [phone, setPhone] = useState("+31 6 24 18 33 90");
  const [password, setPassword] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState<"email" | "phone" | null>(null);

  const [fullName, setFullName] = useState("Rana El Amri");
  const [dob, setDob] = useState("1988-04-12");
  const [address, setAddress] = useState("Westzeedijk 112");
  const [postcode, setPostcode] = useState("3016 AH");
  const [city, setCity] = useState("Rotterdam");
  const [kitchen, setKitchen] = useState("home");
  const [about, setAbout] = useState("");

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
      if (!emailVerified) next.email = t("verifyEmail");
      if (!phoneVerified) next.phone = t("verifyPhone");
      if (password.length < 8) next.password = t("requiredField");
    }
    if (step === 1) {
      if (!fullName.trim()) next.fullName = t("requiredField");
      if (!postcode.trim()) next.postcode = t("requiredField");
      else if (!/^\d{4}\s?[A-Za-z]{2}$/.test(postcode.trim()))
        next.postcode = t("invalidPostcode");
      if (!city.trim()) next.city = t("requiredField");
    }
    if (step === 2) {
      const required = ["hygiene", "allergens", "registration", "insurance", "terms"];
      if (required.some((key) => !checks[key]))
        next.checks = t("selectOption");
    }
    if (step === 3) {
      if (docs.some((doc) => !uploaded[doc.id])) next.docs = t("docRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      applyCookMutation.mutate({
        name: fullName,
        email,
        phone,
        city,
        area: postcode,
        cuisine: kitchen,
        bio: about,
        hygieneCertificate: Boolean(checks.hygiene),
        idVerified: Boolean(uploaded.docId),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  function sendCode(kind: "email" | "phone") {
    setCodeSent(kind);
    toast(t("codeSent"), {
      description: kind === "email" ? email : phone,
    });
  }

  function verifyCode() {
    if (code.replace(/\D/g, "").length < 4) {
      toast(t("validationErrors"), { variant: "error" });
      return;
    }
    if (codeSent === "email") setEmailVerified(true);
    if (codeSent === "phone") setPhoneVerified(true);
    setCodeSent(null);
    setCode("");
    toast(t("verifiedLabel"));
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-cream pb-12">
        <div className="mx-auto w-full max-w-[520px] px-4 pt-10 md:max-w-[720px] md:pt-20">
          <div className="text-center">
            <div className="mx-auto grid size-[76px] place-items-center rounded-full bg-olive text-white shadow-[0_16px_36px_-16px_rgba(105,118,83,0.8)] animate-pop">
              <FileCheck2 className="size-9" />
            </div>
            <h1 className="mt-5 font-display text-[31px] font-semibold leading-tight text-charcoal md:text-[38px]">
              {t("applicationSubmitted")}
            </h1>
            <p className="mx-auto mt-2 max-w-[380px] text-[14.5px] leading-relaxed text-muted">
              {t("applicationSubmittedSub")}
            </p>
            <Badge variant="saffron" size="lg" className="mt-4">
              <Loader2 className="size-3.5 animate-spin" />
              {t("verificationPending")}
            </Badge>
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
                  { label: t("verificationPending"), done: false },
                  { label: t("accountTitle"), done: false },
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

          <div className="mt-4 rounded-2xl bg-terracotta-50 p-4">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-terracotta-700">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              {t("verificationNote")}
            </p>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button
              className="h-12"
              onClick={() => router.push("/cook/dashboard")}
            >
              {t("goDashboard")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => router.push("/cook")}
            >
              {t("backToCook")}
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
            onClick={() => router.push("/cook")}
            aria-label={t("back")}
            className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal hover:bg-cream-100"
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
          <button
            type="button"
            onClick={() => {
              setSaved(true);
              toast(t("draftSaved"));
            }}
            className="ms-auto flex h-9 items-center gap-1 rounded-full border border-line bg-white px-3 text-[12.5px] font-semibold text-muted md:text-[13.5px]"
          >
            {saved ? <Check className="size-3.5 text-olive" /> : null}
            {t("saveAndExit")}
          </button>
        </div>

        {/* Stepper */}
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
                <Field label={t("emailLabel")} htmlFor="apply-email" error={errors.email} required>
                  <div className="flex gap-2">
                    <Input
                      id="apply-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className={cn(emailVerified && "border-olive/50 bg-olive-50/30")}
                    />
                    {emailVerified ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-2xl bg-olive-50 px-3 text-[12.5px] font-semibold text-olive-600">
                        <BadgeCheck className="size-3.5" />
                        {t("verifiedLabel")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 shrink-0 px-3 text-[13.5px]"
                        onClick={() => sendCode("email")}
                      >
                        {t("sendCode")}
                      </Button>
                    )}
                  </div>
                </Field>
                <Field label={t("phoneLabel")} htmlFor="apply-phone" error={errors.phone} required>
                  <div className="flex gap-2">
                    <Input
                      id="apply-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      className={cn(phoneVerified && "border-olive/50 bg-olive-50/30")}
                    />
                    {phoneVerified ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-2xl bg-olive-50 px-3 text-[12.5px] font-semibold text-olive-600">
                        <BadgeCheck className="size-3.5" />
                        {t("verifiedLabel")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 shrink-0 px-3 text-[13.5px]"
                        onClick={() => sendCode("phone")}
                      >
                        {t("sendCode")}
                      </Button>
                    )}
                  </div>
                </Field>
                {codeSent ? (
                  <div className="rounded-2xl border border-terracotta/25 bg-terracotta-50/50 p-3 animate-fade-in">
                    <p className="text-[13px] font-semibold text-charcoal">
                      {t("codeSent")} ·{" "}
                      {codeSent === "email" ? email : phone}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        inputMode="numeric"
                        placeholder="123456"
                        className="h-11 tracking-[0.3em]"
                        aria-label={t("codeLabel")}
                      />
                      <Button
                        type="button"
                        className="h-11 shrink-0 px-4"
                        onClick={verifyCode}
                      >
                        {t("verify")}
                      </Button>
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted">
                      {t("demoNotice")}
                    </p>
                  </div>
                ) : null}
                <Field
                  label={t("passwordLabel")}
                  htmlFor="apply-password"
                  error={errors.password}
                  hint={t("securityNote")}
                  required
                >
                  <Input
                    id="apply-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </Field>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card className="space-y-4 p-4 md:p-5">
                <Field label={t("fullName")} htmlFor="apply-name" error={errors.fullName} required>
                  <Input
                    id="apply-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("dateOfBirth")} htmlFor="apply-dob">
                    <Input
                      id="apply-dob"
                      type="date"
                      value={dob}
                      onChange={(event) => setDob(event.target.value)}
                    />
                  </Field>
                  <Field label={t("kitchenType")} htmlFor="apply-kitchen">
                    <Select
                      id="apply-kitchen"
                      value={kitchen}
                      onChange={(event) => setKitchen(event.target.value)}
                    >
                      <option value="home">{t("homeKitchen")}</option>
                      <option value="shared">{t("sharedKitchen")}</option>
                    </Select>
                  </Field>
                </div>
                <Field label={t("addressLabel")} htmlFor="apply-address">
                  <Input
                    id="apply-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    autoComplete="street-address"
                  />
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
                      onChange={(event) => setPostcode(event.target.value.toUpperCase())}
                      autoComplete="postal-code"
                      placeholder="1234 AB"
                    />
                  </Field>
                  <Field label={t("cityLabel")} htmlFor="apply-city" error={errors.city} required>
                    <Input
                      id="apply-city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      autoComplete="address-level2"
                    />
                  </Field>
                </div>
                <Field label={t("aboutKitchen")} htmlFor="apply-about" hint={t("kitchenPhotoSub")}>
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
                          {done ? `${doc.id === "docId" ? "id-scan.pdf" : doc.id === "docHealth" ? "food-safety.pdf" : "address.pdf"} · 1.2 MB` : doc.hint}
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
                      onClick={() => setStep(index)}
                      className="flex w-full items-center gap-2.5 text-start"
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
        <Button variant="ghost" onClick={() => { setStep(Math.max(0, step - 1)); setErrors({}); }} disabled={step === 0}>
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
