"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Phone,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/controls";
import { ConfirmDialog, EmptyState, Sheet } from "@/components/ui/overlays";
import { Card } from "@/components/ui/misc";
import { CookMobileHeader } from "@/components/cook/cook-mobile-header";
import { useApp } from "@/components/providers/app-provider";
import {
  cookOrders as seedOrders,
  getDish,
  loc,
  type CookOrder,
} from "@/lib/data";
import {
  useCookOrdersQuery,
  useUpdateCookOrderStatusMutation,
} from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

type Status = CookOrder["status"];
type Tab = "incoming" | "preparing" | "ready" | "completed";

const tabs: Tab[] = ["incoming", "preparing", "ready", "completed"];
const tabKey: Record<Tab, string> = {
  incoming: "incoming",
  preparing: "preparingTab",
  ready: "readyTab",
  completed: "completedTab",
};

export default function CookOrdersPage() {
  const { t, lang, toast } = useApp();
  const { data: queriedOrders = seedOrders } = useCookOrdersQuery();
  const updateStatusMutation = useUpdateCookOrderStatusMutation();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const orders = useMemo(
    () =>
      (queriedOrders as CookOrder[])
        .filter((o) => !declinedIds.includes(o.id))
        .map((o) =>
          statusOverrides[o.id] ? { ...o, status: statusOverrides[o.id] } : o,
        ),
    [queriedOrders, statusOverrides, declinedIds],
  );
  const [tab, setTab] = useState<Tab>("incoming");
  const [acceptOrder, setAcceptOrder] = useState<CookOrder | null>(null);
  const [declineOrder, setDeclineOrder] = useState<CookOrder | null>(null);
  const [declineReason, setDeclineReason] = useState("soldOut");
  const [messageOrder, setMessageOrder] = useState<CookOrder | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () => orders.filter((order) => order.status === tab),
    [orders, tab],
  );

  const counts = useMemo(
    () =>
      tabs.reduce<Record<Tab, number>>(
        (acc, key) => ({ ...acc, [key]: orders.filter((o) => o.status === key).length }),
        { incoming: 0, preparing: 0, ready: 0, completed: 0 },
      ),
    [orders],
  );

  function update(id: string, status: Status, toastKey: string) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    const apiStatus =
      status === "incoming"
        ? "CONFIRMED"
        : status.toUpperCase();
    updateStatusMutation.mutate({ id, status: apiStatus });
    toast(t(toastKey));
  }

  const emptyFor: Record<Tab, { title: string; sub: string }> = {
    incoming: { title: t("noIncoming"), sub: t("noIncomingSub") },
    preparing: { title: t("noOrdersTab"), sub: t("readyNote") },
    ready: { title: t("noOrdersTab"), sub: t("readyNote") },
    completed: { title: t("noOrdersTab"), sub: t("cashFlowNote") },
  };

  return (
    <div className="pb-6 md:pb-12">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1180px] md:px-8 md:pt-10">
        <CookMobileHeader title={t("cookOrders")} subtitle={t("cookOrdersSub")} />

        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
              {t("cookApp")}
            </p>
            <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-charcoal">
              {t("cookOrders")}
            </h1>
            <p className="mt-1 text-[14.5px] text-muted">{t("cookOrdersSub")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2 shadow-card">
            <Clock3 className="size-4 text-terracotta" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted">
                {t("todayPickups")}
              </p>
              <p className="text-[13.5px] font-semibold text-charcoal">
                18:00 — 19:00
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-5">
          <SegmentedTabs
            value={tab}
            onChange={(value) => setTab(value)}
            scrollable
            tabs={tabs.map((key) => ({
              value: key,
              label: t(tabKey[key]),
              count: counts[key],
            }))}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            {filtered.length} {filtered.length === 1 ? t("item") : t("items")}
          </p>
          <p className="flex items-center gap-1 text-[12px] text-muted-soft">
            <MapPin className="size-3" />
            {t("pickupOnly")} · {t("cashFlowNote")}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="mt-4 bg-white/60"
            icon={<PackageCheck className="size-7" />}
            title={emptyFor[tab].title}
            description={emptyFor[tab].sub}
          />
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 md:gap-4">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={() => setAcceptOrder(order)}
                onDecline={() => {
                  setDeclineOrder(order);
                  setDeclineReason("soldOut");
                }}
                onUpdate={update}
                onMessage={() => setMessageOrder(order)}
              />
            ))}
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-cream-100/80 p-3.5">
          <p className="text-[12.5px] leading-relaxed text-muted">
            {t("cashFlowNote")} {t("pickupNote")}
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(acceptOrder)}
        onClose={() => setAcceptOrder(null)}
        onConfirm={() => {
          if (acceptOrder) update(acceptOrder.id, "preparing", "orderAccepted");
          setAcceptOrder(null);
        }}
        title={t("acceptOrderTitle")}
        description={t("acceptOrderDesc", {
          count: acceptOrder?.items.reduce((n, item) => n + item.qty, 0) ?? 0,
          day: acceptOrder?.pickup[lang] ?? "",
          time: acceptOrder?.pickupTime ?? "",
        })}
        confirmLabel={t("accept")}
        cancelLabel={t("cancel")}
        icon={<Check className="size-5" />}
      />

      <Sheet
        open={Boolean(declineOrder)}
        onClose={() => setDeclineOrder(null)}
        title={t("declineOrderTitle")}
        description={t("declineOrderDesc")}
        footer={
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              if (declineOrder) {
                setDeclinedIds((prev) => [...prev, declineOrder.id]);
                updateStatusMutation.mutate({
                  id: declineOrder.id,
                  status: "CANCELLED",
                });
                toast(t("orderDeclined"), { variant: "info" });
              }
              setDeclineOrder(null);
            }}
          >
            {t("decline")}
          </Button>
        }
      >
        <p className="text-[13px] font-semibold text-charcoal">
          {t("declineReason")}
        </p>
        <div className="mt-2 space-y-2">
          {[
            ["soldOut", t("reasonSoldOut")],
            ["busy", t("reasonTooBusy")],
            ["other", t("reasonOther")],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDeclineReason(id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-2xl border p-3 text-start text-[14px] font-medium transition",
                declineReason === id
                  ? "border-terracotta bg-terracotta-50/60 text-charcoal"
                  : "border-line bg-white text-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-full border",
                  declineReason === id
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line-strong",
                )}
              >
                {declineReason === id ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : null}
              </span>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          {t("declineNote")}
        </p>
      </Sheet>

      <Sheet
        open={Boolean(messageOrder)}
        onClose={() => setMessageOrder(null)}
        title={t("messageSheetTitle", {
          name: messageOrder?.customer.split(" ")[0] ?? "",
        })}
        description={messageOrder?.code}
        footer={
          <Button
            className="w-full"
            disabled={!message.trim()}
            onClick={() => {
              setMessageOrder(null);
              setMessage("");
              toast(t("messageSent"));
            }}
          >
            {t("send")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        }
      >
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder={t("messagePlaceholder")}
          className="w-full resize-none rounded-2xl border border-line bg-white p-3 text-[14.5px] leading-relaxed outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/10"
        />
        <p className="mt-2 text-[12px] text-muted">{t("customerPhone")}: {messageOrder?.phone}</p>
      </Sheet>
    </div>
  );
}

function OrderCard({
  order,
  onAccept,
  onDecline,
  onUpdate,
  onMessage,
}: {
  order: CookOrder;
  onAccept: () => void;
  onDecline: () => void;
  onUpdate: (id: string, status: Status, toastKey: string) => void;
  onMessage: () => void;
}) {
  const { t, lang } = useApp();
  const lines = order.items
    .map((item) => ({ item, dish: getDish(item.dishId) }))
    .filter((line) => line.dish);

  const statusBadge = {
    incoming: (
      <Badge variant="terracotta" size="sm">
        {t("actionNeeded")}
      </Badge>
    ),
    preparing: (
      <Badge variant="saffron" size="sm">
        {t("beingPrepared")}
      </Badge>
    ),
    ready: (
      <Badge variant="olive" size="sm">
        {t("readyForPickup")}
      </Badge>
    ),
    completed: (
      <Badge variant="success" size="sm">
        {t("completed")}
      </Badge>
    ),
  }[order.status];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line/70 px-3.5 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-[12px] font-bold text-charcoal">
          {order.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-charcoal">
            {order.customer}
          </p>
          <p className="text-[11.5px] text-muted">
            {order.code} · {loc(order.placed, lang)}
          </p>
        </div>
        {statusBadge}
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 className="size-3.5 shrink-0 text-terracotta" />
            <p className="text-[13.5px] font-semibold text-charcoal">
              {order.pickup[lang]} · {order.pickupTime}
            </p>
          </div>
          <p className="shrink-0 text-[15px] font-semibold text-charcoal">
            {formatPrice(order.total, lang)}
          </p>
        </div>

        <div className="mt-2.5 space-y-1.5">
          {lines.map(({ item, dish }) => (
            <div key={item.dishId} className="flex items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-cream-100 text-[11px] font-bold text-charcoal">
                {item.qty}
              </span>
              <p className="min-w-0 flex-1 truncate text-[13px] text-charcoal">
                {loc(dish!.name, lang)}
              </p>
              <p className="text-[12px] text-muted">
                {formatPrice(dish!.price * item.qty, lang)}
              </p>
            </div>
          ))}
        </div>

        {order.note ? (
          <div className="mt-2.5 rounded-xl bg-saffron-50/80 p-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a5d13]">
              {t("customerNote")}
            </p>
            <p className="mt-0.5 text-[12.5px] italic leading-relaxed text-charcoal/80">
              “{order.note[lang]}”
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          {order.status === "incoming" ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:bg-cream"
                aria-label={t("decline")}
              >
                <X className="size-4" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-terracotta text-[13.5px] font-semibold text-white"
              >
                <Check className="size-4" />
                {t("accept")}
                <span className="ms-1 text-white/60">·</span>
                <span className="text-[12px] font-normal text-white/80">
                  {order.pickupTime}
                </span>
              </button>
            </>
          ) : null}
          {order.status === "preparing" ? (
            <button
              type="button"
              onClick={() => onUpdate(order.id, "ready", "orderReadyToast")}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-olive text-[13.5px] font-semibold text-white"
            >
              <Truck className="size-4" />
              {t("markReady")}
            </button>
          ) : null}
          {order.status === "ready" ? (
            <button
              type="button"
              onClick={() => onUpdate(order.id, "completed", "orderCompletedToast")}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-charcoal text-[13.5px] font-semibold text-white"
            >
              <PackageCheck className="size-4" />
              {t("markCompleted")}
            </button>
          ) : null}
          {order.status === "completed" ? (
            <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-olive-50 text-[13px] font-semibold text-olive-600">
              <Check className="size-4" />
              {t("completed")} · {formatPrice(order.total, lang)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onMessage}
            aria-label={t("contactCustomer")}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-charcoal transition hover:bg-cream"
          >
            <MessageCircle className="size-4" />
          </button>
          <a
            href={`tel:${order.phone.replace(/\s/g, "")}`}
            aria-label={t("customerPhone")}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-charcoal transition hover:bg-cream"
          >
            <Phone className="size-4" />
          </a>
        </div>

        {order.status === "preparing" ? (
          <p className="mt-2 text-center text-[11.5px] text-muted">
            {t("readyNote")}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
