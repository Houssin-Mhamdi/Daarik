"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChefHat, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useApp } from "@/components/providers/app-provider";

export default function LoginPage() {
  const router = useRouter();
  const { t, login, toast } = useApp();
  const [email, setEmail] = useState("sarah.devries@example.nl");
  const [password, setPassword] = useState("Daarik2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast(t("savedChanges"));
      if (email.includes("admin@")) {
        router.push("/admin");
      } else if (
        email.includes("rana@") ||
        email.includes("omar@") ||
        email.includes("fatima@") ||
        email.includes("samira@")
      ) {
        router.push("/cook/dashboard");
      } else {
        router.push("/profile");
      }
    } catch (err: any) {
      const msg = err?.message || "Invalid email or password";
      setError(msg);
      toast(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, redirect: string) => {
    setEmail(demoEmail);
    setPassword("Daarik2026!");
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, "Daarik2026!");
      toast(`Signed in as ${demoEmail}`);
      router.push(redirect);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-8 md:py-16">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-card md:p-8">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 font-display text-[28px] font-semibold text-charcoal">
            {t("signIn")}
          </h1>
          <p className="mt-1 text-[14.5px] text-muted">{t("tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <Field label={t("email")} required>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-[#fdf1ec] px-3 py-2 text-[13.5px] font-medium text-[#a13a28]">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t("signIn")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </form>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-center text-[12.5px] font-bold uppercase tracking-[0.14em] text-muted-soft">
            1-Click Demo Accounts (PostgreSQL)
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin("sarah.devries@example.nl", "/profile")}
              className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-cream/60 p-2.5 text-[13px] font-semibold text-charcoal transition hover:border-terracotta"
            >
              <UserRound className="size-4 text-terracotta" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => quickLogin("rana@darna.nl", "/cook/dashboard")}
              className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-cream/60 p-2.5 text-[13px] font-semibold text-charcoal transition hover:border-terracotta"
            >
              <ChefHat className="size-4 text-olive" />
              Cook (Rana)
            </button>
            <button
              type="button"
              onClick={() => quickLogin("admin@darna.nl", "/admin")}
              className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-cream/60 p-2.5 text-[13px] font-semibold text-charcoal transition hover:border-terracotta"
            >
              <ShieldCheck className="size-4 text-charcoal" />
              Admin
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[14px] text-muted">
          New to Daarik?{" "}
          <Link href="/register" className="font-semibold text-terracotta">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
