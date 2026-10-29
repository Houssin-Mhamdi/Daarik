import en from "./en";
import nl from "./nl";
import ar from "./ar";

export const locales = ["nl", "en", "ar"] as const;
export type Lang = (typeof locales)[number];

export const langMeta: Record<
  Lang,
  { label: string; native: string; short: string; flag: string; dir: "ltr" | "rtl" }
> = {
  nl: {
    label: "Dutch",
    native: "Nederlands",
    short: "NL",
    flag: "🇳🇱",
    dir: "ltr",
  },
  en: {
    label: "English",
    native: "English",
    short: "EN",
    flag: "🇬🇧",
    dir: "ltr",
  },
  ar: {
    label: "Arabic",
    native: "العربية",
    short: "AR",
    flag: "🇸🇦",
    dir: "rtl",
  },
};

export type TranslationKey = keyof typeof en;

export const dictionaries: Record<Lang, Record<string, string>> = {
  en,
  nl: { ...en, ...nl },
  ar: { ...en, ...ar },
};

export function translate(
  lang: Lang,
  key: TranslationKey | string,
  vars?: Record<string, string | number>,
) {
  let value = dictionaries[lang][key] ?? en[key as TranslationKey] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}

export function isRtl(lang: Lang) {
  return langMeta[lang].dir === "rtl";
}

export { en };
