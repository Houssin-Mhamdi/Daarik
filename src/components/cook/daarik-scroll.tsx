"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/components/providers/app-provider";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEP_KEYS = [
  { title: "daarikStep1Title", desc: "daarikStep1Desc", num: "01" },
  { title: "daarikStep2Title", desc: "daarikStep2Desc", num: "02" },
  { title: "daarikStep3Title", desc: "daarikStep3Desc", num: "03" },
  { title: "daarikStep4Title", desc: "daarikStep4Desc", num: "04" },
];

export function DaarikScroll() {
  const { t, lang } = useApp();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>(".daarik-step");
      const title = pin.querySelector(".daarik-title");
      const sub = pin.querySelector(".daarik-sub");
      const scrollHint = pin.querySelector(".daarik-scroll");
      const finalBlock = pin.querySelector(".daarik-final");

      gsap.set(steps, { opacity: 0, y: 60, scale: 0.96 });
      gsap.set([title, sub], { opacity: 0, y: 40 });
      gsap.set(scrollHint, { opacity: 0 });
      gsap.set(finalBlock, { opacity: 0, y: 40 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=320%",
          scrub: 1,
          pin: pin,
          anticipatePin: 1,
        },
      });

      tl.to([title, sub], { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 })
        .to(scrollHint, { opacity: 1, duration: 0.3 }, "<")
        .to(scrollHint, { opacity: 0, duration: 0.2 }, "+=0.2");

      steps.forEach((step, i) => {
        tl.to(
          step,
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.out" },
          i === 0 ? "+=0.2" : "+=0.15",
        );
        // dim previous
        if (i > 0) {
          tl.to(
            steps[i - 1],
            { opacity: 0.35, scale: 0.98, duration: 0.3 },
            "<",
          );
        }
      });

      tl.to(steps, { opacity: 0, y: -40, duration: 0.4, stagger: 0.08 }, "+=0.3");
      tl.to(finalBlock, { opacity: 1, y: 0, duration: 0.6 }, "<");
      tl.to({}, { duration: 0.6 });
    }, section);

    return () => ctx.revert();
  }, [lang]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "420vh" }}
    >
      <div
        ref={pinRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-cream via-cream-100 to-white"
      >
        <div className="mx-auto w-full max-w-[1120px] px-4 md:px-8">
          <div className="text-center">
            <p className="daarik-title font-display text-[40px] font-semibold leading-tight text-charcoal md:text-[64px]">
              {t("daarikHowTitle")}
            </p>
            <p className="daarik-sub mt-3 text-[16px] leading-relaxed text-muted md:text-[20px]">
              {t("daarikHowSub")}
            </p>
            <p className="daarik-scroll mt-6 text-[13px] font-bold uppercase tracking-[0.22em] text-terracotta">
              SCROLL ↓
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4 md:gap-6">
            {STEP_KEYS.map((step, index) => (
              <div
                key={step.title}
                className="daarik-step rounded-[24px] border border-line bg-white p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-terracotta-50 text-terracotta">
                    <span className="font-display text-[20px] font-semibold">
                      {step.num}
                    </span>
                  </span>
                  <span className="font-display text-[40px] font-semibold leading-none text-cream-300">
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-semibold text-charcoal">
                  {t(step.title)}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  {t(step.desc)}
                </p>
              </div>
            ))}
          </div>

          <div className="daarik-final mt-12 text-center">
            <p className="font-arabic text-[30px] font-semibold text-terracotta">
              {t("daarikFinal")}
            </p>
            <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.28em] text-muted-soft">
              {t("daarikBrand")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
