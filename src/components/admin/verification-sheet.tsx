"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  FileText,
  IdCard,
  MapPin,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/overlays";
import { Checkbox } from "@/components/ui/controls";
import { useApp } from "@/components/providers/app-provider";

export type Applicant = {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  submitted: string;
  documents: number;
  initials: string;
};

export function VerificationSheet({
  applicant,
  open,
  onClose,
  onApprove,
  onReject,
}: {
  applicant: Applicant | null;
  open: boolean;
  onClose: () => void;
  onApprove: (applicant: Applicant) => void;
  onReject: (applicant: Applicant) => void;
}) {
  const { t, toast } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");

  if (!applicant) return null;

  const documents = [
    { key: "id", label: t("verificationDocuments"), icon: IdCard },
    { key: "safety", label: t("hygieneCertificate"), icon: ShieldCheck },
    { key: "address", label: t("address"), icon: MapPin },
  ].slice(0, Math.max(2, applicant.documents));

  const allChecked = documents.every((doc) => checked[doc.key]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={applicant.name}
      description={`${applicant.cuisine} · ${applicant.city}`}
      className="md:max-w-xl"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onReject(applicant)}
          >
            {t("rejectCook")}
          </Button>
          <Button
            className="flex-1"
            disabled={!allChecked}
            onClick={() => onApprove(applicant)}
          >
            <Check className="size-4" />
            {t("approveCook")}
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-terracotta-50 text-[17px] font-bold text-terracotta-700">
            {applicant.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-charcoal">{applicant.name}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {applicant.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <UtensilsCrossed className="size-3" />
                {applicant.cuisine}
              </span>
            </p>
          </div>
          <Badge variant="saffron">{t("pending")}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/70 pt-3 text-[13px]">
          <div>
            <p className="text-muted-soft">{t("submitted")}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-charcoal">
              <CalendarDays className="size-3.5 text-muted" />
              {applicant.submitted}
            </p>
          </div>
          <div>
            <p className="text-muted-soft">{t("documents")}</p>
            <p className="mt-0.5 font-semibold text-charcoal">
              {applicant.documents} / 3 · {t("complete")}
            </p>
          </div>
        </div>
      </div>

      <p className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[0.16em] text-muted-soft">
        {t("verificationDocuments")}
      </p>
      <div className="space-y-2">
        {documents.map((doc) => {
          const Icon = doc.icon;
          const isChecked = Boolean(checked[doc.key]);
          return (
            <div
              key={doc.key}
              className="rounded-xl border border-line bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cream-100 text-charcoal">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-charcoal">
                    {doc.label}
                  </p>
                  <p className="-mt-0.5 flex items-center gap-2 text-[12.5px] text-muted">
                    <FileText className="size-3" />
                    {doc.key}-document.pdf · 1.2 MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast(t("documentPreview"), {
                      description: `${doc.label} · PDF`,
                      variant: "info",
                    })
                  }
                  className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[12.5px] font-semibold text-charcoal transition hover:bg-cream-100"
                >
                  {t("openDocument")}
                </button>
              </div>
              <Checkbox
                checked={isChecked}
                onCheckedChange={(next) =>
                  setChecked((prev) => ({ ...prev, [doc.key]: next }))
                }
                label={t("documentsChecked")}
                className="mt-1 px-0 py-1.5"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-3">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-charcoal">
          <BadgeCheck className="size-4 text-olive" />
          {t("cookVerificationNote")}
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("internalNotes")}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-line bg-cream/50 p-2.5 text-[14px] outline-none transition placeholder:text-muted-soft focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/10"
        />
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!note.trim()) return;
              toast(t("noteAdded"));
              setNote("");
            }}
          >
            {t("addNote")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
