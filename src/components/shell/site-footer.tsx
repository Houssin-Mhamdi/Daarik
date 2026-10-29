"use client";

import Link from "next/link";
import { Camera, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";

export function SiteFooter() {
  const { t } = useApp();
  return (
    <footer className="mt-16 hidden border-t border-line/70 bg-cream-100/50 md:block">
      <div className="mx-auto max-w-[1240px] px-6 py-12">
        <div className="grid grid-cols-4 gap-10">
          <div>
            <Logo />
            <p className="mt-4 max-w-[220px] text-[14.5px] leading-relaxed text-muted">
              {t("tagline")}
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-[13.5px] text-muted">
              <MapPin className="size-3.5" /> {t("madeIn")}
            </p>
          </div>
          <div>
            <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-charcoal">
              {t("exploreDaarik")}
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-[14.5px] text-muted">
              <li>
                <Link href="/explore" className="hover:text-terracotta">
                  {t("explore")}
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-terracotta">
                  {t("favorites")}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-terracotta">
                  {t("myOrders")}
                </Link>
              </li>
              <li>
                <Link href="/cook" className="hover:text-terracotta">
                  {t("forCooks")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-charcoal">
              {t("support")}
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-[14.5px] text-muted">
              <li>
                <Link href="/help" className="hover:text-terracotta">
                  {t("helpCenter")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-terracotta">
                  {t("termsTitle")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-terracotta">
                  {t("privacyTitle")}
                </Link>
              </li>
              <li>
                <Link href="/install" className="hover:text-terracotta">
                  {t("getApp")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-charcoal">
              {t("contactUs")}
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-[14.5px] text-muted">
              <li className="flex items-center gap-2">
                <Mail className="size-3.5" /> hello@daarik.nl
              </li>
              <li className="flex items-center gap-2">
                <Camera className="size-3.5" /> @daarik.food
              </li>
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-soft">
              {t("prototypeFooter")}
            </p>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-line pt-5 text-[13px] text-muted-soft">
          <span>{t("allRightsReserved")}</span>
          <span className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-charcoal">
              {t("privacyShort")}
            </Link>
            <Link href="/terms" className="hover:text-charcoal">
              {t("termsShort")}
            </Link>
            <span>NL · €</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
