"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { t, register, toast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Rotterdam");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "COOK">("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || "Rotterdam",
        password,
        role,
      });
      toast(t("savedChanges"));
      router.push(role === "COOK" ? "/cook/apply" : "/profile");
    } catch (err: any) {
      const msg = err?.message || "Registration failed";
      setError(msg);
      toast(msg, { variant: "error" });
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
            Create your Daarik account
          </h1>
          <p className="mt-1 text-[14.5px] text-muted">{t("tagline")}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1">
          {(["CUSTOMER", "COOK"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "h-9 rounded-xl text-[14px] font-semibold transition",
                role === r
                  ? "bg-white text-charcoal shadow-xs"
                  : "text-muted hover:text-charcoal",
              )}
            >
              {r === "CUSTOMER" ? t("customerApp") : t("cookApp")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <Field label={t("fullName")} required>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={t("email")} required>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={t("phone")}>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label={t("city")}>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>
          <Field label="Password (min 8 chars)" required>
            <Input
              type="password"
              required
              minLength={8}
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
            Create account
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </form>

        <p className="mt-5 text-center text-[14px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-terracotta">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
