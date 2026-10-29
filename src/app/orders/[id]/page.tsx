"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, ConfirmDialog, EmptyState } from "@/components/ui/overlays";
import { Card, KeyValue } from "@/components/ui/misc";
import { OrderStatusBadge } from "@/components/app/order-status";
import { useApp } from "@/components/providers/app-provider";
import {
  customerOrders,
  getCook,
  getDish,
  loc,
  orderSubtotal,
  pickupOptions,
  type CustomerOrder,
  type OrderStatus,
} from "@/lib/data";
import {
  useCancelOrderMutation,
  useCreateReviewMutation,
  useOrderQuery,
} from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    t,
    lang,
    dir,
    serviceFee,
    toast,
    reorderCart,
  } = useApp();

  const { data: queriedOrder } = useOrderQuery(params.id);
  const cancelMutation = useCancelOrderMutation();
  const createReviewMutation = useCreateReviewMutation();

  const initial = useMemo(
    () =>
      queriedOrder ??
      customerOrders.find(
        (order) => order.id === params.id || order.code === params.id,
      ),
    [queriedOrder, params.id],
  );
  const [localOverride, setLocalOverride] = useState<Partial<CustomerOrder> | null>(null);
  const order = initial ? { ...initial, ...localOverride } : undefined;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [reportReason, setReportReason] = useState("late");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [reviewText, setReviewText] = useState("");

  if (!order) {
    return (
      <div className="px-4 pt-10">
        <EmptyState
          icon={<Package className="size-7" />}
          title={t("notFound")}
          description={t("pageNotFoundSub")}
          action={
            <Button onClick={() => router.push("/orders")}>
              {t("myOrders")}
            </Button>
          }
        />
      </div>
    );
  }

  const cook = getCook(order.cookId);
  const pickup = pickupOptions.find((option) => option.id === order.pickup);
  const lines = order.items
    .map((item) => ({ item, dish: getDish(item.dishId) }))
    .filter((line) => line.dish);
  const subtotal = orderSubtotal(order.items);
  const total = subtotal + serviceFee;
  const isUpcoming = ["confirmed", "preparing", "ready"].includes(order.status);
  const isCancelled = order.status === "cancelled";

  const steps: { key: string; status: OrderStatus; time?: string }[] = [
    { key: "orderPlaced", status: "confirmed", time: loc(order.placed, lang) },
    { key: "cookConfirmed", status: "confirmed" },
    {
      key: "beingPrepared",
      status: "preparing",
      time: order.status === "preparing" ? order.pickupTime : undefined,
    },
    { key: "readyForPickup", status: "ready", time: order.pickupTime },
    { key: "pickedUp", status: "completed" },
  ];

  const orderIndex: Record<OrderStatus, number> = {
    confirmed: 1,
    preparing: 2,
    ready: 3,
    completed: 4,
    cancelled: -1,
  };
  const currentStep = orderIndex[order.status];

  const reportReasons = [
    { id: "late", label: t("problemLate") },
    { id: "missing", label: t("problemMissing") },
    { id: "quality", label: t("problemQuality") },
    { id: "other", label: t("problemOther") },
  ];

  function cancelOrder() {
    setLocalOverride({ status: "cancelled", refunded: true, paid: false });
    cancelMutation.mutate(order!.id);
    setCancelOpen(false);
    toast(t("orderCancelledToast"));
  }

  function submitReport() {
    setReportOpen(false);
    toast(t("reportProblemToast"));
  }

  function submitReview() {
    setLocalOverride({ reviewed: true });
    createReviewMutation.mutate({
      cookId: order!.cookId,
      dishId: order!.items[0]?.dishId,
      orderId: order!.id,
      rating,
      text: reviewText || "Delicious homemade meal!",
    });
    setReviewOpen(false);
    toast(t("reviewThanks"));
  }

  function reorder() {
    reorderCart(order!.items);
    toast(t("addedToCart"), { description: t("viewCart") });
    router.push("/cart");
  }

  return (
    <div className="pb-10 md:pb-16">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-[max(10px,env(safe-area-inset-top,0px))] md:max-w-[1120px] md:px-8 md:pt-8">
        {/* Mobile header */}
        <div className="flex h-12 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            aria-label={t("back")}
            className="-ms-2 grid size-10 place-items-center rounded-full text-charcoal hover:bg-cream-100"
          >
            <ArrowLeft className={cn("size-5", dir === "rtl" && "rotate-180")} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold leading-tight text-charcoal">
              {t("orderDetails")}
            </h1>
            <p className="text-[12px] text-muted">
              {t("orderRef")} {order.code}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMessageOpen(true)}
            className="ms-auto grid size-9 place-items-center rounded-full border border-line bg-white text-charcoal"
            aria-label={t("messageCook")}
          >
            <MessageCircle className="size-4" />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <Link
              href="/orders"
              className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted transition hover:text-charcoal"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              {t("myOrders")}
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[32px] font-semibold text-charcoal">
                {t("orderDetails")}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-[14.5px] text-muted">
              {t("orderRef")} {order.code} · {loc(order.placed, lang)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMessageOpen(true)}>
              <MessageCircle className="size-3.5" />
              {t("messageCook")}
            </Button>
            <Button size="sm" onClick={reorder}>
              <RotateCcw className="size-3.5" />
              {t("reorder")}
            </Button>
          </div>
        </div>

        <div className="mt-3 grid items-start gap-4 md:mt-6 md:grid-cols-[1fr_360px] md:gap-6">
          <div className="space-y-3 md:space-y-4">
            {/* Status banner */}
            {isCancelled ? (
              <div className="rounded-[22px] border border-[#f0d2c9] bg-[#fdf1ec] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f9e3dd] text-[#a13a28]">
                    <XCircle className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-[15.5px] font-semibold text-[#8e3524]">
                      {t("statusCancelled")}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#9a5a4c]">
                      {order.refunded ? t("refundNote") : t("cancelPolicy")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-line/70 bg-cream/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-terracotta" />
                    <p className="text-[14px] font-semibold text-charcoal">
                      {order.status === "ready"
                        ? t("readyForPickup")
                        : order.status === "preparing"
                          ? t("beingPrepared")
                          : t("statusConfirmed")}
                    </p>
                  </div>
                  <Badge variant="soft" size="sm">
                    {pickup ? loc(pickup.shortDay, lang) : ""} ·{" "}
                    {order.pickupTime}
                  </Badge>
                </div>
                <div className="px-4 py-4">
                  <div className="flex items-start">
                    {steps.slice(0, 4).map((step, index) => {
                      const done = currentStep >= index;
                      const active = currentStep === index;
                      return (
                        <div key={step.key} className="flex flex-1 flex-col items-center">
                          <div className="flex w-full items-center">
                            <div
                              className={cn(
                                "h-0.5 flex-1",
                                index === 0
                                  ? "bg-transparent"
                                  : done
                                    ? "bg-olive"
                                    : "bg-line",
                              )}
                            />
                            <span
                              className={cn(
                                "grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                                done
                                  ? "border-olive bg-olive text-white"
                                  : "border-line bg-white text-muted-soft",
                                active && "ring-4 ring-olive/15",
                              )}
                            >
                              {done ? (
                                <Check className="size-3.5" strokeWidth={3} />
                              ) : (
                                <span className="size-1.5 rounded-full bg-current" />
                              )}
                            </span>
                            <div
                              className={cn(
                                "h-0.5 flex-1",
                                index === 3
                                  ? "bg-transparent"
                                  : currentStep > index
                                    ? "bg-olive"
                                    : "bg-line",
                              )}
                            />
                          </div>
                          <p
                            className={cn(
                              "mt-2 max-w-[72px] text-center text-[11.5px] font-medium leading-tight",
                              done ? "text-charcoal" : "text-muted-soft",
                            )}
                          >
                            {t(step.key)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 rounded-xl bg-cream/60 px-3 py-2 text-center text-[12.5px] leading-relaxed text-muted">
                    {order.status === "ready"
                      ? t("pickupReminderNote")
                      : order.status === "preparing"
                        ? t("prepareNote")
                        : t("confirmationSent", {
                            email: "sarah.devries@example.nl",
                          })}
                  </p>
                </div>
              </div>
            )}

            {/* Cook + pickup */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                {cook ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cook.avatar}
                      alt={cook.name}
                      className="size-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-terracotta">
                        {t("yourCook")}
                      </p>
                      <Link
                        href={`/cook/${cook.id}`}
                        className="block truncate text-[15.5px] font-semibold text-charcoal"
                      >
                        {cook.name}
                      </Link>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {cook.pickupArea[lang]} · {cook.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessageOpen(true)}
                      aria-label={t("messageCook")}
                      className="grid size-10 place-items-center rounded-full bg-cream-100 text-charcoal transition hover:bg-cream-200"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                  </>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2 rounded-2xl bg-cream/60 p-3 text-[13.5px] sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.08em] text-muted">
                      {t("pickup")}
                    </p>
                    <p className="font-semibold text-charcoal">
                      {pickup ? loc(pickup.day, lang) : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.08em] text-muted">
                      {t("pickupTime")}
                    </p>
                    <p className="font-semibold text-charcoal">
                      {order.pickupTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-start gap-2 rounded-2xl border border-dashed border-line-strong p-3">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                <div>
                  <p className="text-[13px] font-semibold text-charcoal">
                    {t("exactAddressNote")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                    {cook?.instructions[lang]}
                  </p>
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <h2 className="text-[15.5px] font-semibold text-charcoal">
                  {t("itemsLabel")}
                </h2>
                <span className="text-[12.5px] text-muted">
                  {t("from")} {cook?.name.split(" ")[0]}
                </span>
              </div>
              <div className="divide-y divide-line/60 px-4">
                {lines.map(({ item, dish }) => (
                  <div key={item.dishId} className="flex gap-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish!.image}
                      alt={loc(dish!.name, lang)}
                      className="size-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dish/${dish!.id}`}
                        className="line-clamp-1 text-[14.5px] font-semibold text-charcoal"
                      >
                        {loc(dish!.name, lang)}
                      </Link>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {dish!.serves} {t("people")} · {item.qty} ×{" "}
                        {formatPrice(dish!.price, lang)}
                      </p>
                    </div>
                    <p className="text-[14.5px] font-semibold text-charcoal">
                      {formatPrice(dish!.price * item.qty, lang)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-line bg-cream/40 px-4 py-3 text-[13.5px]">
                <div className="flex justify-between text-muted">
                  <span>{t("subtotal")}</span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(subtotal, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t("serviceFee")}</span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(serviceFee, lang)}
                  </span>
                </div>
                {isCancelled && order.refunded ? (
                  <div className="flex justify-between text-olive-600">
                    <span>{t("reimbursement")}</span>
                    <span className="font-semibold">
                      {formatPrice(total, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-2 text-[15.5px]">
                  <span className="font-semibold text-charcoal">
                    {t("total")}
                  </span>
                  <span className="font-semibold text-terracotta">
                    {formatPrice(total, lang)}
                  </span>
                </div>
              </div>
            </Card>

            {order.note ? (
              <Card className="p-4">
                <h2 className="text-[14.5px] font-semibold text-charcoal">
                  {t("customerNote")}
                </h2>
                <p className="mt-1.5 rounded-xl bg-cream/60 p-3 text-[13.5px] italic leading-relaxed text-muted">
                  “{loc(order.note, lang)}”
                </p>
              </Card>
            ) : null}

            {/* Help */}
            <div className="rounded-[22px] border border-line bg-white p-4 shadow-card">
              <p className="text-[14.5px] font-semibold text-charcoal">
                {t("orderHelp")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-semibold text-charcoal transition hover:bg-cream"
                >
                  <Info className="size-3.5 text-terracotta" />
                  {t("reportProblem")}
                </button>
                <Link
                  href="/help"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-semibold text-charcoal transition hover:bg-cream"
                >
                  <ShieldCheck className="size-3.5 text-olive" />
                  {t("helpSupport")}
                </Link>
              </div>
            </div>
          </div>

          {/* Aside */}
          <aside className="space-y-3 md:sticky md:top-24">
            <Card className="p-4">
              <h2 className="text-[15px] font-semibold text-charcoal">
                {t("paymentDetails")}
              </h2>
              <div className="mt-3 space-y-2.5">
                <KeyValue label={t("paymentStatus")} value={order.paid ? t("paid") : t("refunded")} />
                <KeyValue label={t("paymentMethod")} value="iDEAL" />
                <KeyValue label={t("orderRef")} value={order.code} />
                <KeyValue
                  label={t("pickupFrom")}
                  value={cook?.pickupArea[lang] ?? ""}
                />
              </div>
              <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-3 shrink-0 text-olive" />
                {t("billingNote")}
              </p>
            </Card>

            <Card className="p-4">
              <h2 className="text-[15px] font-semibold text-charcoal">
                {t("contactDetails")}
              </h2>
              <div className="mt-3 space-y-2.5 text-[13.5px]">
                <p className="flex items-center gap-2 text-muted">
                  <Phone className="size-3.5 text-terracotta" />
                  {t("phone")}: +31 6 12 34 56 78
                </p>
                <p className="flex items-center gap-2 text-muted">
                  <MapPin className="size-3.5 text-terracotta" />
                  {cook?.pickupArea[lang]}, {cook?.city}
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                  onClick={() => setMessageOpen(true)}
                >
                  <MessageCircle className="size-3.5" />
                  {t("messageCook")}
                </Button>
                {cook ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full"
                    onClick={() => router.push(`/cook/${cook.id}`)}
                  >
                    {t("viewCookProfile")}
                  </Button>
                ) : null}
              </div>
            </Card>

            {isUpcoming ? (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-[13px] font-semibold text-muted transition hover:border-[#e8c9c1] hover:bg-[#fdf1ec] hover:text-[#a13a28]"
              >
                {t("cancelOrder")}
              </button>
            ) : null}
            {order.status === "completed" && !order.reviewed ? (
              <Button
                variant="soft"
                className="w-full"
                onClick={() => setReviewOpen(true)}
              >
                <Star className="size-4" />
                {t("leaveReview")}
              </Button>
            ) : null}

            <p className="px-1 text-center text-[12px] leading-relaxed text-muted-soft">
              {t("cancelWindowNote", { time: t("free") })} ·{" "}
              {t("demoNotice")}
            </p>
          </aside>
        </div>

        {/* Mobile action bar */}
        {isUpcoming ? (
          <div className="mt-4 grid gap-2 md:hidden">
            {order.status === "ready" ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-olive px-4 py-3.5 text-[14.5px] font-semibold text-white">
                <CheckCircle2 className="size-4" />
                {t("readyForPickup")} · {order.pickupTime}
              </div>
            ) : null}
            <Button variant="outline" className="h-11" onClick={reorder}>
              <RotateCcw className="size-4" />
              {t("reorder")}
            </Button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="py-2 text-[13px] font-semibold text-muted"
            >
              {t("cancelOrder")}
            </button>
          </div>
        ) : order.status === "completed" ? (
          <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
            <Button variant="outline" className="h-11" onClick={reorder}>
              <RotateCcw className="size-3.5" />
              {t("reorder")}
            </Button>
            <Button
              className="h-11"
              onClick={() => setReviewOpen(true)}
              disabled={order.reviewed}
            >
              <Star className="size-3.5" />
              {order.reviewed ? t("reviewThanks") : t("leaveReview")}
            </Button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        title={t("cancelOrderTitle")}
        description={t("cancelOrderDesc")}
        confirmLabel={t("cancelConfirm")}
        cancelLabel={t("keepOrder")}
        variant="destructive"
        icon={<X className="size-5" />}
      />

      <Sheet
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title={t("messageSheetTitle", { name: cook?.name.split(" ")[0] ?? "" })}
        description={t("orderRef") + " " + order.code}
        footer={
          <Button
            className="w-full"
            disabled={!message.trim()}
            onClick={() => {
              setMessageOpen(false);
              setMessage("");
              toast(t("messageSent"));
            }}
          >
            {t("send")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        }
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
          {cook ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cook.avatar}
                alt={cook.name}
                className="size-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold text-charcoal">
                  {cook.name}
                </p>
                <p className="text-[12.5px] text-muted">
                  {t("responseTime", { time: cook.response[lang] })}
                </p>
              </div>
            </>
          ) : null}
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder={t("messagePlaceholder")}
          className="mt-3 w-full resize-none rounded-2xl border border-line bg-white p-3 text-[14.5px] leading-relaxed outline-none transition placeholder:text-muted-soft focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
        />
      </Sheet>

      <Sheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t("reportProblemTitle")}
        description={t("reportProblemDesc")}
        footer={
          <Button className="w-full" onClick={submitReport}>
            {t("reportSubmit")}
          </Button>
        }
      >
        <div className="space-y-2">
          {reportReasons.map((reason) => (
            <button
              key={reason.id}
              type="button"
              onClick={() => setReportReason(reason.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-start text-[14.5px] font-medium transition",
                reportReason === reason.id
                  ? "border-terracotta bg-terracotta-50/60 text-charcoal"
                  : "border-line bg-white text-muted hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  reportReason === reason.id
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line-strong bg-white",
                )}
              >
                {reportReason === reason.id ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : null}
              </span>
              {reason.label}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder={t("messagePlaceholder")}
          className="mt-3 w-full resize-none rounded-2xl border border-line bg-white p-3 text-[14.5px] leading-relaxed outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
        />
      </Sheet>

      <Sheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={t("rateExperience")}
        description={t("reviewSheetSub")}
        footer={
          <Button className="w-full" onClick={submitReview}>
            {t("submitReview")}
          </Button>
        }
      >
        <div className="rounded-2xl bg-white p-4">
          <p className="text-center text-[14px] font-semibold text-charcoal">
            {cook?.name}
          </p>
          <div className="mt-2 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} / 5`}
                className="grid size-11 place-items-center"
              >
                <Star
                  className={cn(
                    "size-7 transition",
                    value <= rating
                      ? "fill-saffron text-saffron"
                      : "text-line-strong",
                  )}
                />
              </button>
            ))}
          </div>
          <p className="mt-1 text-center text-[12.5px] text-muted">
            {t("yourRating")} · {rating}/5
          </p>
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={4}
            placeholder={t("reviewPlaceholder")}
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-cream/40 p-3 text-[14.5px] leading-relaxed outline-none transition placeholder:text-muted-soft focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[t("cookedFresh"), t("generous"), t("friendly")].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  setReviewText((prev) =>
                    prev ? `${prev} ${chip.toLowerCase()}` : chip,
                  )
                }
                className="rounded-full bg-cream-100 px-2.5 py-1 text-[12px] font-medium text-muted transition hover:bg-cream-200 hover:text-charcoal"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
