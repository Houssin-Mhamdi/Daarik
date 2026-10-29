"use client";

import { Check, Globe2 } from "lucide-react";
import {
  Sheet,
} from "@/components/ui/overlays";
import { useApp } from "@/components/providers/app-provider";
import { langMeta, locales, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang, setLang, t, toast } = useApp();

  const choose = (next: Lang) => {
    setLang(next);
    toast(t("languageChanged"), { variant: "success" });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("chooseLanguage")}
      description={t("languageNote")}
    >
      <div className="space-y-2 pt-1">
        {locales.map((code) => {
          const meta = langMeta[code];
          const active = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => choose(code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-start transition",
                active
                  ? "border-terracotta bg-terracotta-50/60"
                  : "border-line bg-white hover:border-line-strong",
              )}
            >
              <span className="text-2xl" aria-hidden>
                {meta.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-charcoal">
                  {meta.native}
                </span>
                <span className="mt-0.5 block text-[13.5px] text-muted">
                  {meta.label}
                  {code === "ar" ? " · RTL" : ""}
                </span>
              </span>
              {active ? (
                <span className="grid size-6 place-items-center rounded-full bg-terracotta text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : (
                <Globe2 className="size-4 text-muted-soft" />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 rounded-2xl bg-cream-100 p-3 text-[13.5px] leading-relaxed text-muted">
        {t("rtlReady")} · AR / EN / NL
      </p>
    </Sheet>
  );
}
