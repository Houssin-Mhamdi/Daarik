"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/overlays";
import { StickyActionBar } from "@/components/ui/misc";
import { PickupPicker } from "@/components/app/pickup-picker";
import { useApp } from "@/components/providers/app-provider";
import {
  currentUser,
  getCook,
  getDish,
  loc,
  orderSubtotal,
  pickupOptions,
} from "@/lib/data";
import { useCreatePaymentIntentMutation } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

const idealBanks = [
  { id: "ing", name: "ING" },
  { id: "rabobank", name: "Rabobank" },
  { id: "abn_amro", name: "ABN AMRO" },
  { id: "bunq", name: "bunq" },
  { id: "sns_bank", name: "SNS Bank" },
  { id: "asn_bank", name: "ASN Bank" },
  { id: "knab", name: "Knab" },
  { id: "triodos_bank", name: "Triodos Bank" },
  { id: "revolut", name: "Revolut" },
];

const steps = ["stepContact", "stepPickup", "stepPayment", "stepReview"] as const;
const payments = [
  { id: "ideal", key: "ideal", icon: Smartphone, sub: "iDEAL" },
  { id: "card", key: "card", icon: CreditCard, sub: "Visa · Mastercard" },
  { id: "bancontact", key: "bancontact", icon: Wallet, sub: "Bancontact" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const {
    t,
    lang,
    dir,
    cart,
    cartCookId,
    pickup,
    pickupTime,
    cartNote,
    serviceFee,
    placeOrder,
    toast,
  } = useApp();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState("de Vries");
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [payment, setPayment] = useState<string>("ideal");
  const [idealBank, setIdealBank] = useState<string>("ing");
  const [terms, setTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const createIntentMutation = useCreatePaymentIntentMutation();
  const [stripeIntent, setStripeIntent] = useState<{
    paymentIntentId: string;
    payoutRouting: "STRIPE_CONNECT" | "BANK_TRANSFER";
    cookPayoutDestination: string;
  } | null>(null);

  const lines = cart
    .map((line) => ({ line, dish: getDish(line.dishId) }))
    .filter((item) => item.dish);
  const cook = cartCookId ? getCook(cartCookId) : undefined;
  const subtotal = orderSubtotal(cart);
  const total = subtotal + serviceFee;
  const option = pickupOptions.find((item) => item.id === pickup);

  const availablePickups = useMemo(() => {
    if (!lines.length) return [];
    return pickupOptions
      .filter((item) =>
        lines.every((line) => line.dish?.pickup.includes(item.id)),
      )
      .map((item) => item.id);
  }, [lines]);

  useEffect(() => {
    if (!cart.length && !paying) {
      // allow the confirmation navigation to complete
      const timer = setTimeout(() => {
        if (!cart.length) router.replace("/cart");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [cart.length, paying, router]);

  if (!lines.length) {
    return (
      <div className="px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title={t("cartEmptyTitle")}
          description={t("cartEmptySub")}
          action={
            <Button onClick={() => router.push("/explore")}>
              {t("startShopping")}
            </Button>
          }
        />
      </div>
    );
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!firstName.trim()) next.firstName = t("requiredField");
      if (!lastName.trim()) next.lastName = t("requiredField");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("invalidEmail");
      if (phone.replace(/\D/g, "").length < 9) next.phone = t("invalidPhone");
    }
    if (step === 2) {
      if (!terms) next.terms = t("requiredField");
      if (payment === "card" && cardNumber.replace(/\s/g, "").length < 12) {
        next.card = t("requiredField");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validate()) {
      toast(t("validationErrors"), { variant: "error" });
      return;
    }
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === 2 || nextStep === 3) {
        createIntentMutation
          .mutateAsync({
            amount: total,
            cookId: cartCookId ?? "rana",
            paymentMethod: (payment as "ideal" | "card" | "bancontact") || "ideal",
            idealBank: payment === "ideal" ? idealBank : undefined,
            items: cart.map((line) => ({ dishId: line.dishId, qty: line.qty })),
          })
          .then((res) => {
            setStripeIntent({
              paymentIntentId: res.paymentIntentId,
              payoutRouting: res.payoutRouting,
              cookPayoutDestination: res.breakdown.cookPayoutDestination,
            });
          })
          .catch(() => {});
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!terms) {
      toast(t("validationErrors"), { variant: "error" });
      return;
    }
    setPaying(true);
    setTimeout(() => {
      placeOrder({
        cookId: cartCookId ?? "",
        items: cart.map((line) => ({ dishId: line.dishId, qty: line.qty })),
        pickup,
        pickupTime,
        total,
        email,
        payment,
        note: cartNote || undefined,
      });
      router.push("/order-confirmation");
    }, 1100);
  };

  const back = () => {
    if (step === 0) {
      router.push("/cart");
    } else {
      setStep(step - 1);
    }
  };

  const summary = (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-charcoal">
          {t("orderSummary")}
        </h2>
        <span className="rounded-full bg-cream-100 px-2 py-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
          {t("pickupOnly")}
        </span>
      </div>

      {cook ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-cream/60 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cook.avatar}
            alt={cook.name}
            className="size-9 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-terracotta">
              {t("yourCook")}
            </p>
            <p className="truncate text-[14px] font-semibold text-charcoal">
              {cook.name}
            </p>
            <p className="truncate text-[12px] text-muted">
              {cook.pickupArea[lang]}, {cook.city}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {lines.map(({ line, dish }) =>
          dish ? (
            <div key={line.dishId} className="flex items-center gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[12px] font-bold text-charcoal">
                {line.qty}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-charcoal">
                {loc(dish.name, lang)}
              </span>
              <span className="text-[13.5px] font-medium text-charcoal">
                {formatPrice(dish.price * line.qty, lang)}
              </span>
            </div>
          ) : null,
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream/60 px-3 py-2">
        <CalendarDays className="size-3.5 shrink-0 text-terracotta" />
        <span className="text-[12.5px] text-charcoal">
          {option?.shortDay[lang]} · {pickupTime}
        </span>
      </div>

      <div className="mt-3 space-y-2 border-t border-line pt-3 text-[14px]">
        <div className="flex justify-between">
          <span className="text-muted">{t("subtotal")}</span>
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
        <div className="flex justify-between border-t border-line pt-2.5 text-[16px]">
          <span className="font-semibold text-charcoal">{t("total")}</span>
          <span className="font-semibold text-terracotta">
            {formatPrice(total, lang)}
          </span>
        </div>
      </div>

      <Button
        className="mt-3 hidden w-full md:flex"
        size="lg"
        loading={paying}
        onClick={next}
      >
        {step === steps.length - 1
          ? t("payNow", { amount: formatPrice(total, lang) })
          : t("continue")}
        {!paying ? <ArrowRight className="size-4 rtl:rotate-180" /> : null}
      </Button>

      <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted">
        <Lock className="mt-0.5 size-3 shrink-0 text-olive" />
        {t("billingNote")}
      </p>
    </div>
  );

  return (
    <div className="pb-32 md:pb-10">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1100px] md:px-8 md:pt-8">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={back}
            aria-label={t("back")}
            className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal transition hover:bg-cream-100"
          >
            <ArrowLeft className={cn("size-5", dir === "rtl" && "rotate-180")} />
          </button>
          <div>
            <h1 className="font-sans text-[18px] font-semibold text-charcoal md:font-display md:text-[36px]">
              {t("checkoutTitle")}
            </h1>
            <p className="hidden text-sm text-muted md:block">
              {t("securePayment")}
            </p>
          </div>
          <span className="ms-auto flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-muted">
            <Lock className="size-3 text-olive" />
            {t("demoMode")}
          </span>
        </div>

        {/* Steps */}
        <div className="mt-4 md:max-w-2xl">
          <div className="flex items-center">
            {steps.map((item, index) => {
              const complete = index < step;
              const active = index === step;
              return (
                <div key={item} className="flex flex-1 items-center last:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (index < step) setStep(index);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full border text-[12px] font-bold transition",
                        complete
                          ? "border-olive bg-olive text-white"
                          : active
                            ? "border-terracotta bg-terracotta text-white"
                            : "border-line-strong bg-white text-muted",
                      )}
                    >
                      {complete ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[11.5px] font-semibold",
                        active ? "text-charcoal" : "text-muted",
                      )}
                    >
                      {t(item)}
                    </span>
                  </button>
                  {index < steps.length - 1 ? (
                    <span
                      className={cn(
                        "mx-1.5 -mt-3 h-0.5 flex-1 rounded-full",
                        index < step ? "bg-olive" : "bg-line",
                      )}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 items-start gap-7 md:grid md:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {step === 0 ? (
              <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-cream-100 text-terracotta">
                    <UserRound className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-charcoal">
                      {t("contactInfo")}
                    </h2>
                    <p className="text-[12.5px] text-muted">{t("contactSub")}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Field label={t("firstName")} htmlFor="firstName" error={errors.firstName} required>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label={t("lastName")} htmlFor="lastName" error={errors.lastName} required>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      autoComplete="family-name"
                    />
                  </Field>
                  <Field
                    label={t("email")}
                    htmlFor="email"
                    error={errors.email}
                    className="col-span-2"
                    required
                  >
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                    />
                  </Field>
                  <Field
                    label={t("phone")}
                    htmlFor="phone"
                    error={errors.phone}
                    hint={t("contactSaved")}
                    className="col-span-2"
                    required
                  >
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                    />
                  </Field>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted">
                  <ShieldCheck className="mt-0.5 size-3 shrink-0 text-olive" />
                  {t("securityNote")}
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-cream-100 text-terracotta">
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-charcoal">
                      {t("pickupDetails")}
                    </h2>
                    <p className="text-[12.5px] text-muted">{t("pickupSub")}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <PickupPicker available={availablePickups} compact />
                </div>
                <div className="mt-4 rounded-2xl bg-terracotta-50 p-3">
                  <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-terracotta-700">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {t("pickupNote")}
                  </p>
                </div>
                {cook ? (
                  <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-line p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cook.avatar}
                      alt={cook.name}
                      className="size-9 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-charcoal">
                        {t("collectFrom")} {cook.name.split(" ")[0]}
                      </p>
                      <p className="text-[12px] text-muted">
                        {cook.pickupArea[lang]} · {t("exactAddressNote")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-cream-100 text-terracotta">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-semibold text-charcoal">
                      {t("paymentMethod")}
                    </h2>
                    <p className="text-[12.5px] text-muted">{t("paymentSub")}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {payments.map((method) => {
                    const Icon = method.icon;
                    const active = payment === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPayment(method.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-start transition",
                          active
                            ? "border-terracotta bg-terracotta-50/50"
                            : "border-line bg-white hover:border-line-strong",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-xl",
                            active
                              ? "bg-terracotta text-white"
                              : "bg-cream-100 text-charcoal",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-semibold text-charcoal">
                            {t(method.key)}
                          </span>
                          <span className="block text-[12px] text-muted">
                            {method.sub}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "grid size-4.5 place-items-center rounded-full border",
                            active
                              ? "border-terracotta bg-terracotta"
                              : "border-line-strong",
                          )}
                        >
                          {active ? (
                            <Check className="size-3 text-white" strokeWidth={3} />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {payment === "ideal" ? (
                  <div className="mt-3 rounded-2xl border border-line bg-cream/40 p-3">
                    <Label htmlFor="ideal-bank">iDEAL · Select your Dutch bank</Label>
                    <select
                      id="ideal-bank"
                      value={idealBank}
                      onChange={(e) => setIdealBank(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] font-medium text-charcoal outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
                    >
                      {idealBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {payment === "card" ? (
                  <div className="mt-3 rounded-2xl border border-line bg-cream/40 p-3">
                    <Label htmlFor="card">{t("card")}</Label>
                    <Input
                      id="card"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      className={cn(errors.card && "border-[#b3402f]")}
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input placeholder="MM / YY" inputMode="numeric" />
                      <Input placeholder="CVC" inputMode="numeric" />
                    </div>
                  </div>
                ) : null}

                {stripeIntent ? (
                  <div className="mt-3 rounded-2xl border border-olive/30 bg-olive-50/60 p-3 text-[13px] text-charcoal">
                    <p className="font-semibold text-olive-700">
                      Stripe PaymentIntent Ready · {stripeIntent.paymentIntentId}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Cook payout routing: {stripeIntent.cookPayoutDestination}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <Checkbox
                    checked={terms}
                    onCheckedChange={setTerms}
                    label={t("acceptTerms")}
                    className="px-1"
                  />
                  {errors.terms ? (
                    <p className="mt-1 px-1 text-[13px] font-medium text-[#b3402f]">
                      {errors.terms}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-start gap-1.5 rounded-2xl bg-cream-100 p-3 text-[12px] leading-relaxed text-muted">
                  <Lock className="mt-0.5 size-3 shrink-0 text-olive" />
                  {t("demoNotice")}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-charcoal">
                      {t("reviewOrder")}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="text-[13px] font-semibold text-terracotta"
                    >
                      {t("editDetails")}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {t("reviewSub")}
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
                        <UserRound className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                          {t("contactDetails")}
                        </p>
                        <p className="mt-0.5 text-[14.5px] font-medium text-charcoal">
                          {firstName} {lastName}
                        </p>
                        <p className="text-[13px] text-muted">{email}</p>
                        <p className="text-[13px] text-muted">{phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-[12.5px] font-semibold text-terracotta"
                      >
                        {t("change")}
                      </button>
                    </div>

                    <div className="flex items-start gap-3 border-t border-line pt-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
                        <MapPin className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                          {t("pickup")}
                        </p>
                        <p className="mt-0.5 text-[14.5px] font-medium text-charcoal">
                          {option?.day[lang]}
                        </p>
                        <p className="text-[13px] text-muted">
                          {pickupTime} · {cook?.pickupArea[lang]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[12.5px] font-semibold text-terracotta"
                      >
                        {t("change")}
                      </button>
                    </div>

                    <div className="flex items-start gap-3 border-t border-line pt-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-terracotta">
                        <CreditCard className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                          {t("paymentMethod")}
                        </p>
                        <p className="mt-0.5 text-[14.5px] font-medium text-charcoal">
                          {t(payment)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-[12.5px] font-semibold text-terracotta"
                      >
                        {t("change")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
                  <h2 className="text-[16px] font-semibold text-charcoal">
                    {t("itemsLabel")}
                  </h2>
                  <div className="mt-3 space-y-2.5">
                    {lines.map(({ line, dish }) =>
                      dish ? (
                        <div key={line.dishId} className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={dish.image}
                            alt={loc(dish.name, lang)}
                            className="size-11 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium text-charcoal">
                              {loc(dish.name, lang)}
                            </p>
                            <p className="text-[12px] text-muted">
                              {line.qty} × {formatPrice(dish.price, lang)}
                            </p>
                          </div>
                          <span className="text-[13.5px] font-semibold text-charcoal">
                            {formatPrice(dish.price * line.qty, lang)}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                  {cartNote ? (
                    <div className="mt-3 rounded-xl bg-cream/60 p-2.5">
                      <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted-soft">
                        {t("noteForCook")}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-charcoal">
                        {cartNote}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted">{t("subtotal")}</span>
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
                    <div className="flex justify-between border-t border-line pt-2 text-[15.5px]">
                      <span className="font-semibold text-charcoal">
                        {t("total")}
                      </span>
                      <span className="font-semibold text-terracotta">
                        {formatPrice(total, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-2xl bg-olive-50 p-3.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-olive" />
                  <p className="text-[12.5px] leading-relaxed text-olive-600">
                    {t("billingNote")} {t("thanks")}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="md:hidden">{summary}</div>

            <div className="hidden items-center justify-between md:flex">
              <Link
                href="/cart"
                className="text-[14px] font-semibold text-muted hover:text-charcoal"
              >
                {t("backToCart")}
              </Link>
              <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <Lock className="size-3 text-olive" />
                {t("securePayment")}
              </span>
            </div>
          </div>

          <aside className="hidden md:block md:sticky md:top-24">{summary}</aside>
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
            loading={paying}
            onClick={next}
          >
            {paying
              ? t("paying")
              : step === steps.length - 1
                ? t("payNow", { amount: formatPrice(total, lang) })
                : t("continue")}
            {!paying ? <ArrowRight className="size-4 rtl:rotate-180" /> : null}
          </Button>
        </StickyActionBar>
      </div>
    </div>
  );
}
