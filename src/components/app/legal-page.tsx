"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/providers/app-provider";
import { getLegalCopy } from "@/lib/legal";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, lang } = useApp();
  const title = kind === "terms" ? t("termsTitle") : t("privacyTitle");
  const intro = kind === "terms" ? t("legalIntro") : t("privacyIntro");
  const sectionList = (kind === "terms" ? t("termsSections") : t("privacySections"))
    .split(",")
    .map((section) => section.trim());
  const paragraphs = getLegalCopy(kind, lang);

  return (
    <div className="pb-12 md:pb-16">
      <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-[1020px] md:px-8 md:pt-8">
        <div className="md:hidden">
          <PageHeader title={title} backHref="/help" />
        </div>

        <Link
          href="/help"
          className="mb-5 hidden items-center gap-1.5 text-[13.5px] font-semibold text-muted transition hover:text-charcoal md:inline-flex"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
          {t("backToHelp")}
        </Link>

        <div className="relative overflow-hidden rounded-[24px] border border-line bg-white p-5 shadow-card md:p-8">
          <div className="absolute -end-10 -top-12 size-44 rounded-full bg-terracotta-50/80" />
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-xl bg-terracotta text-white">
              {kind === "terms" ? (
                <ScrollText className="size-5" />
              ) : (
                <FileText className="size-5" />
              )}
            </span>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] leading-tight text-charcoal md:text-[36px]">{title}</h1>
              <Badge variant="outline">{t("legalPrototype")}</Badge>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-muted-soft">{t("lastUpdated")}</p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted md:text-[16px]">
              {intro}
            </p>
            <p className="mt-3 rounded-xl bg-cream/80 px-3 py-2 text-[12.5px] leading-relaxed text-muted-soft">
              {t("legalNote")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <aside className="hidden md:col-span-3 md:block">
            <div className="sticky top-24 rounded-2xl border border-line bg-white/70 p-4">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-muted-soft">
                {t("onThisPage")}
              </p>
              <nav className="mt-2.5 space-y-1">
                {sectionList.map((section, index) => (
                  <a
                    key={section}
                    href={`#section-${index + 1}`}
                    className="flex gap-2 rounded-lg px-1.5 py-1.5 text-[13px] leading-snug text-muted transition hover:bg-cream-100 hover:text-charcoal"
                  >
                    <span className="font-semibold text-muted-soft">{index + 1}.</span>
                    {section}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="space-y-5 md:col-span-9">
            {sectionList.map((section, index) => (
              <section
                key={section}
                id={`section-${index + 1}`}
                className="scroll-mt-24 rounded-2xl border border-line bg-white p-4 md:p-5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[12px] font-bold text-charcoal">
                    {index + 1}
                  </span>
                  <h2 className="text-[17px] font-semibold leading-snug tracking-normal text-charcoal md:text-[19px]">
                    {section}
                  </h2>
                </div>
                <p className="mt-2 ps-8 text-[14.5px] leading-relaxed text-muted md:text-[15px]">
                  {paragraphs[index]}
                </p>
              </section>
            ))}

            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-charcoal px-4 py-3.5 text-[13.5px] text-cream/80">
              <span className="font-semibold text-cream">{t("needHelp")}</span>
              <a href="mailto:hello@darna.nl" className="text-terracotta-100 underline-offset-2 hover:underline">
                hello@darna.nl
              </a>
              <span className="text-cream/30">·</span>
              <Link href="/privacy" className="underline-offset-2 hover:underline">
                {t("privacyShort")}
              </Link>
              <Link href="/terms" className="underline-offset-2 hover:underline">
                {t("termsShort")}
              </Link>
              <Link href="/help" className="ms-auto font-semibold text-cream">
                {t("backToHelp")}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
