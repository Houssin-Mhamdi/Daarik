"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ToastMessage } from "@/components/providers/app-provider";

function useLockScroll(open: boolean) {
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  const mounted = useMounted();
  useLockScroll(open);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-charcoal/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream shadow-pop animate-sheet-up md:max-w-lg md:animate-scale-in md:rounded-[28px]",
          className,
        )}
      >
        <div className="flex justify-center pt-2.5 md:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong/70" />
        </div>
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 px-5 pb-3 pt-3 md:pt-5">
            <div className="min-w-0 flex-1">
              {title ? (
                <h2 className="text-lg font-semibold leading-tight text-charcoal">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-[15px] leading-relaxed text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {!hideClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-charcoal shadow-sm transition hover:bg-cream-100"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-line bg-cream/95 px-5 py-3.5 pb-[max(14px,env(safe-area-inset-bottom))] backdrop-blur">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  icon,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  const mounted = useMounted();
  useLockScroll(open);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <div
        className="absolute inset-0 animate-fade-in bg-charcoal/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm animate-scale-in rounded-[28px] bg-cream p-6 text-center shadow-pop"
      >
        <div
          className={cn(
            "mx-auto mb-4 grid size-12 place-items-center rounded-full",
            variant === "destructive"
              ? "bg-[#f9e3dd] text-[#a13a28]"
              : "bg-terracotta-50 text-terracotta",
          )}
        >
          {icon ?? <AlertCircle className="size-6" />}
        </div>
        <h2 className="text-lg font-semibold leading-tight text-charcoal">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-0 z-[130] flex flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.variant === "error"
            ? AlertCircle
            : toast.variant === "info"
              ? Info
              : CheckCircle2;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line/80 bg-white/95 p-3.5 shadow-pop backdrop-blur-xl animate-toast-in"
          >
            <span
              className={cn(
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                toast.variant === "error"
                  ? "bg-[#f9e3dd] text-[#a13a28]"
                  : toast.variant === "info"
                    ? "bg-cream-100 text-charcoal"
                    : "bg-olive-50 text-olive",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-charcoal">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="grid size-6 place-items-center rounded-full text-muted-soft transition hover:bg-cream-100 hover:text-charcoal"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[28px] border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="grid size-16 place-items-center rounded-full bg-cream-100 text-terracotta">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-charcoal">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
