import type { Lang } from "@/lib/i18n";

export type Localized = Record<Lang, string>;

export const L = (nl: string, en: string, ar: string): Localized => ({
  nl,
  en,
  ar,
});

export function loc(value: Localized | string | undefined, lang: Lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.en;
}

export const SERVICE_FEE = 1.5;

export type CuisineId =
  | "tunisian"
  | "moroccan"
  | "syrian"
  | "lebanese"
  | "turkish"
  | "egyptian";

export const allergenNames: Record<string, Localized> = {
  gluten: L("Gluten", "Gluten", "الغلوتين"),
  egg: L("Ei", "Egg", "البيض"),
  dairy: L("Zuivel", "Dairy", "الألبان"),
  nuts: L("Noten", "Nuts", "المكسرات"),
  sesame: L("Sesam", "Sesame", "السمسم"),
  celery: L("Selderij", "Celery", "الكرفس"),
  fish: L("Vis", "Fish", "السمك"),
  shellfish: L("Schaaldieren", "Shellfish", "المحاريات"),
  soy: L("Soja", "Soy", "الصويا"),
  mustard: L("Mosterd", "Mustard", "الخردل"),
};

export const dietaryNames: Record<string, Localized> = {
  vegetarian: L("Vegetarisch", "Vegetarian", "نباتي"),
  vegan: L("Veganistisch", "Vegan", "نباتي صرف"),
  halal: L("Halal", "Halal", "حلال"),
  glutenFree: L("Glutenvrij", "Gluten-free", "خالٍ من الغلوتين"),
  nutFree: L("Notenvrij", "Nut-free", "خالٍ من المكسرات"),
  dairyFree: L("Zuivelvrij", "Dairy-free", "خالٍ من الألبان"),
  spicy: L("Pittig", "Spicy", "حار"),
};

export type PickupOption = {
  id: string;
  day: Localized;
  shortDay: Localized;
  date: string;
  slots: string[];
};

export type Cook = {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  city: string;
  area: Localized;
  cuisineIds: CuisineId[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  languages: string[];
  bio: Localized;
  since: string;
  orders: number;
  response: Localized;
  pickupArea: Localized;
  specialties: Localized;
  instructions: Localized;
  yearsCooking: number;
  latitude?: number;
  longitude?: number;
};

export type Dish = {
  id: string;
  cookId: string;
  name: Localized;
  desc: Localized;
  image: string;
  price: number;
  cuisineId: CuisineId;
  rating: number;
  reviewCount: number;
  serves: number;
  portions: number;
  portionsLeft: number;
  allergens: string[];
  dietary: string[];
  ingredients: Localized[];
  pickup: string[];
  schedule?: import("@/lib/pickup").PickupSchedule;
  featured?: boolean;
  weekend?: boolean;
  family?: boolean;
  badge?: Localized;
  prepTime: Localized;
  status?: "live" | "paused" | "draft";
};

export type Review = {
  id: string;
  cookId: string;
  dishId?: string;
  author: string;
  initials: string;
  rating: number;
  date: Localized;
  text: Localized;
};

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = { dishId: string; qty: number };

export type CustomerOrder = {
  id: string;
  code: string;
  cookId: string;
  cook?: {
    id: string;
    name: string;
    avatar: string;
    city: string;
    area: string;
    pickupArea: Localized;
    response: Localized;
    instructions?: Localized;
  };
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus?: string;
  pickup: string;
  pickupTime: string;
  subtotal?: number;
  serviceFee?: number;
  total?: number;
  placed: Localized;
  note?: Localized;
  reviewed?: boolean;
  refunded?: boolean;
  paid: boolean;
};

export type CookOrder = {
  id: string;
  code: string;
  customer: string;
  initials: string;
  items: OrderItem[];
  status: "incoming" | "preparing" | "ready" | "completed";
  pickup: Localized;
  pickupTime: string;
  total: number;
  note?: Localized;
  phone: string;
  placed: Localized;
};
