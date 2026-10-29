"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  clearAuthTokens,
  darnaApi,
  getAccessToken,
  setAuthTokens,
} from "@/lib/api";
import {
  adminDisputes,
  adminKpis,
  adminOrders,
  adminPayouts,
  cookEarnings,
  cookOrders,
  cooks as fallbackCooks,
  currentUser as fallbackUser,
  customerOrders,
  dishes as fallbackDishes,
  getCook,
  getDish,
  pickupOptions,
  reviews as fallbackReviews,
  revenueSeries,
  topCuisines,
  verificationQueue,
  type Cook,
  type CustomerOrder,
  type Dish,
  type Review,
} from "@/lib/data";

export const queryKeys = {
  authMe: ["auth", "me"] as const,
  catalog: ["catalog"] as const,
  cooks: (filters?: Record<string, string | undefined>) =>
    ["cooks", filters ?? {}] as const,
  cook: (id: string) => ["cook", id] as const,
  cookDashboard: ["cook", "me", "dashboard"] as const,
  cookAvailability: ["cook", "me", "availability"] as const,
  cookEarnings: ["cook", "me", "earnings"] as const,
  cookOrders: (status?: string) => ["cook", "me", "orders", status ?? "all"] as const,
  cookDishes: ["cook", "me", "dishes"] as const,
  dishes: (filters?: Record<string, string | undefined>) =>
    ["dishes", filters ?? {}] as const,
  dish: (id: string) => ["dish", id] as const,
  cart: ["cart"] as const,
  favorites: ["favorites"] as const,
  orders: ["orders", "me"] as const,
  order: (id: string) => ["orders", id] as const,
  reviews: (filters?: { cookId?: string; dishId?: string }) =>
    ["reviews", filters ?? {}] as const,
  adminOverview: (range: "30d" | "90d") => ["admin", "overview", range] as const,
  adminOrders: (filters?: { status?: string; q?: string }) =>
    ["admin", "orders", filters ?? {}] as const,
  adminCooks: (filters?: { status?: string; q?: string }) =>
    ["admin", "cooks", filters ?? {}] as const,
  adminDishes: (filters?: { filter?: string; q?: string }) =>
    ["admin", "dishes", filters ?? {}] as const,
  adminPayouts: ["admin", "payouts"] as const,
  adminDisputes: (status?: string) =>
    ["admin", "disputes", status ?? "all"] as const,
  adminSettings: ["admin", "settings"] as const,
};

function normalizeDish(raw: any): Dish {
  const fallback = getDish(raw.id || raw.slug);
  return {
    id: raw.slug || raw.id,
    cookId: raw.cook?.slug || raw.cookId || fallback?.cookId || "rana",
    name: raw.name ?? fallback?.name ?? { nl: "Gerecht", en: "Dish", ar: "طبق" },
    desc: raw.desc ?? fallback?.desc ?? { nl: "", en: "", ar: "" },
    image: raw.image || fallback?.image || "/img/couscous.jpg",
    price: Number(raw.price ?? fallback?.price ?? 12),
    cuisineId: (raw.cuisineId || fallback?.cuisineId || "moroccan") as Dish["cuisineId"],
    rating: Number(raw.rating ?? fallback?.rating ?? 4.9),
    reviewCount: Number(raw.reviewCount ?? fallback?.reviewCount ?? 12),
    serves: Number(raw.serves ?? fallback?.serves ?? 2),
    portions: Number(raw.portions ?? fallback?.portions ?? 8),
    portionsLeft: Number(raw.portionsLeft ?? fallback?.portionsLeft ?? 5),
    allergens: Array.isArray(raw.allergens)
      ? raw.allergens
      : (fallback?.allergens ?? []),
    dietary: Array.isArray(raw.dietary) ? raw.dietary : (fallback?.dietary ?? []),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients
      : (fallback?.ingredients ?? []),
    pickup: Array.isArray(raw.pickup)
      ? raw.pickup
      : (fallback?.pickup ?? ["fri-30", "sat-31"]),
    featured: Boolean(raw.featured ?? fallback?.featured),
    weekend: Boolean(raw.weekend ?? fallback?.weekend),
    family: Boolean(raw.family ?? fallback?.family),
    badge: raw.badge ?? fallback?.badge,
    prepTime: raw.prepTime ??
      fallback?.prepTime ?? { nl: "1 uur", en: "1 hour", ar: "ساعة" },
  };
}

function normalizeCook(raw: any): Cook {
  const fallback = getCook(raw.id || raw.slug);
  return {
    id: raw.slug || raw.id,
    name: raw.name || fallback?.name || "Darna Cook",
    avatar: raw.avatar || fallback?.avatar || "/img/cook-rana.jpg",
    cover: raw.cover || fallback?.cover || "/img/couscous.jpg",
    city: raw.city || fallback?.city || "Rotterdam",
    area: raw.area ?? fallback?.area ?? { nl: "Centrum", en: "Centre", ar: "الوسط" },
    cuisineIds: (Array.isArray(raw.cuisineIds)
      ? raw.cuisineIds
      : fallback?.cuisineIds ?? ["tunisian"]) as Cook["cuisineIds"],
    rating: Number(raw.rating ?? fallback?.rating ?? 4.9),
    reviewCount: Number(raw.reviewCount ?? fallback?.reviewCount ?? 40),
    verified: Boolean(raw.verified ?? true),
    languages: Array.isArray(raw.languages)
      ? raw.languages
      : (fallback?.languages ?? ["Nederlands", "العربية"]),
    bio: raw.bio ?? fallback?.bio ?? { nl: "", en: "", ar: "" },
    since: String(raw.since ?? fallback?.since ?? "2024"),
    orders: Number(raw.ordersCount ?? raw.orders ?? fallback?.orders ?? 120),
    response: raw.response ??
      fallback?.response ?? { nl: "1 uur", en: "1 hour", ar: "ساعة" },
    pickupArea: raw.pickupArea ??
      fallback?.pickupArea ?? { nl: "Centrum", en: "Centre", ar: "الوسط" },
    specialties: raw.specialties ??
      fallback?.specialties ?? { nl: "", en: "", ar: "" },
    instructions: raw.instructions ??
      fallback?.instructions ?? {
        nl: "Adres volgt na bestelling.",
        en: "Address shared after ordering.",
        ar: "يتم مشاركة العنوان بعد الطلب.",
      },
    yearsCooking: Number(raw.yearsCooking ?? fallback?.yearsCooking ?? 10),
  };
}

// ---------------------------------------------------------------------------
// AUTH QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return null;
      const user = (await darnaApi.auth.me()) as any;
      return user;
    },
    staleTime: 60 * 1000,
  });
}

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await darnaApi.auth.login(body);
      setAuthTokens(res.accessToken, res.refreshToken);
      return res;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.authMe, data.user);
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: queryKeys.favorites });
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      city?: string;
      preferredLang?: "nl" | "en" | "ar";
      role?: "CUSTOMER" | "COOK";
    }) => {
      const res = await darnaApi.auth.register(body);
      setAuthTokens(res.accessToken, res.refreshToken);
      return res;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.authMe, data.user);
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await darnaApi.auth.logout();
      } finally {
        clearAuthTokens();
      }
    },
    onSuccess: () => {
      qc.setQueryData(queryKeys.authMe, null);
    },
  });
}

// ---------------------------------------------------------------------------
// DISHES & COOKS QUERIES
// ---------------------------------------------------------------------------
export function useDishesQuery(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: queryKeys.dishes(filters),
    queryFn: async () => {
      const clean = Object.fromEntries(
        Object.entries(filters ?? {}).filter(([, v]) => Boolean(v)),
      ) as Record<string, string>;
      const list = (await darnaApi.dishes.list(clean)) as any[];
      const apiDishes = list.map(normalizeDish);
      // Merge with fallback dishes so all 12 demo dishes remain available alongside DB dishes
      const byId = new Map<string, Dish>();
      for (const d of apiDishes) byId.set(d.id, d);
      for (const f of fallbackDishes) {
        if (!byId.has(f.id)) byId.set(f.id, f);
      }
      return Array.from(byId.values());
    },
    placeholderData: fallbackDishes,
  });
}

export function useDishQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.dish(id),
    queryFn: async () => {
      try {
        const raw = (await darnaApi.dishes.get(id)) as any;
        return normalizeDish(raw);
      } catch {
        const local = getDish(id);
        if (!local) throw new Error("Dish not found");
        return local;
      }
    },
    placeholderData: () => getDish(id),
  });
}

export function useCooksQuery(filters?: {
  city?: string;
  cuisine?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: queryKeys.cooks(filters),
    queryFn: async () => {
      const list = (await darnaApi.cooks.list(filters)) as any[];
      const apiCooks = list.map(normalizeCook);
      const byId = new Map<string, Cook>();
      for (const c of apiCooks) byId.set(c.id, c);
      for (const f of fallbackCooks) {
        if (!byId.has(f.id)) byId.set(f.id, f);
      }
      return Array.from(byId.values());
    },
    placeholderData: fallbackCooks,
  });
}

export function useCookQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.cook(id),
    queryFn: async () => {
      try {
        const raw = (await darnaApi.cooks.get(id)) as any;
        return {
          cook: normalizeCook(raw),
          dishes: Array.isArray(raw.dishes)
            ? raw.dishes.map(normalizeDish)
            : fallbackDishes.filter((d) => d.cookId === id),
          reviews: (Array.isArray(raw.reviews) && raw.reviews.length
            ? raw.reviews
            : fallbackReviews.filter((r) => r.cookId === id)) as Review[],
        };
      } catch {
        const cook = getCook(id);
        if (!cook) throw new Error("Cook not found");
        return {
          cook,
          dishes: fallbackDishes.filter((d) => d.cookId === id),
          reviews: fallbackReviews.filter((r) => r.cookId === id),
        };
      }
    },
    placeholderData: () => {
      const cook = getCook(id);
      if (!cook) return undefined;
      return {
        cook,
        dishes: fallbackDishes.filter((d) => d.cookId === id),
        reviews: fallbackReviews.filter((r) => r.cookId === id),
      };
    },
  });
}

export function useCreateDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => darnaApi.dishes.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dishes"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookDishes });
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
    },
  });
}

export function useUpdateDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      darnaApi.dishes.update(id, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["dishes"] });
      qc.invalidateQueries({ queryKey: queryKeys.dish(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.cookDishes });
    },
  });
}

export function useReportDishMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      darnaApi.dishes.report(id, reason),
  });
}

export function useApplyCookMutation() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => darnaApi.cooks.apply(body),
  });
}

// ---------------------------------------------------------------------------
// ORDERS & REVIEWS QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useMyOrdersQuery() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return customerOrders;
      const list = (await darnaApi.orders.myOrders()) as any[];
      if (!list.length) return customerOrders;
      return list as CustomerOrder[];
    },
    placeholderData: customerOrders,
  });
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: async () => {
      const token = getAccessToken();
      if (token) {
        try {
          return (await darnaApi.orders.get(id)) as CustomerOrder;
        } catch {
          // fallback below
        }
      }
      const found = customerOrders.find((o) => o.id === id || o.code === id);
      if (!found) throw new Error("Order not found");
      return found;
    },
    placeholderData: () =>
      customerOrders.find((o) => o.id === id || o.code === id),
  });
}

export function useCreateOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => darnaApi.orders.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders });
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => darnaApi.orders.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders });
      qc.invalidateQueries({ queryKey: queryKeys.order(id) });
    },
  });
}

export function useReviewsQuery(filters?: { cookId?: string; dishId?: string }) {
  return useQuery({
    queryKey: queryKeys.reviews(filters),
    queryFn: async () => {
      const list = (await darnaApi.reviews.list(filters)) as Review[];
      return list.length ? list : fallbackReviews;
    },
    placeholderData: fallbackReviews,
  });
}

export function useCreateReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      cookId: string;
      dishId?: string;
      orderId?: string;
      rating: number;
      text: string;
    }) => darnaApi.reviews.create(body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews({ cookId: vars.cookId }) });
      qc.invalidateQueries({ queryKey: queryKeys.cook(vars.cookId) });
      if (vars.orderId) {
        qc.invalidateQueries({ queryKey: queryKeys.order(vars.orderId) });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// COOK APP QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useCookOrdersQuery(status?: string) {
  return useQuery({
    queryKey: queryKeys.cookOrders(status),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return cookOrders;
      const list = (await darnaApi.orders.cookOrders(status)) as any[];
      return list.length ? list : cookOrders;
    },
    placeholderData: cookOrders,
  });
}

export function useUpdateCookOrderStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      darnaApi.orders.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook", "me", "orders"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
    },
  });
}

export function useCookAvailabilityQuery() {
  return useQuery({
    queryKey: queryKeys.cookAvailability,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        return {
          kitchenOpen: true,
          maxPortionsPerDay: 16,
          availableDays: ["fri-30", "sat-31", "sun-01"],
          availableSlots: ["17:00", "17:30", "18:00", "18:30"],
          pickupOptions,
        };
      }
      return (await darnaApi.cooks.myAvailability()) as any;
    },
  });
}

export function useUpdateCookAvailabilityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.cooks.updateAvailability(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cookAvailability });
    },
  });
}

export function useCookEarningsQuery() {
  return useQuery({
    queryKey: queryKeys.cookEarnings,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return cookEarnings;
      return (await darnaApi.cooks.myEarnings()) as typeof cookEarnings;
    },
    placeholderData: cookEarnings,
  });
}

// ---------------------------------------------------------------------------
// ADMIN QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useAdminOverviewQuery(range: "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: queryKeys.adminOverview(range),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        return {
          kpis: adminKpis,
          revenueSeries,
          weeklyOrders: [148, 176, 152, 196, 214, 246, 91],
          topCuisines,
          topCooks: fallbackCooks,
          verificationQueue,
          recentOrders: adminOrders,
          payoutsSummary: { due: 1493.36, pendingCount: 3 },
        };
      }
      return (await darnaApi.admin.overview(range)) as any;
    },
    placeholderData: {
      kpis: adminKpis,
      revenueSeries,
      weeklyOrders: [148, 176, 152, 196, 214, 246, 91],
      topCuisines,
      topCooks: fallbackCooks,
      verificationQueue,
      recentOrders: adminOrders,
      payoutsSummary: { due: 1493.36, pendingCount: 3 },
    },
  });
}

export function useAdminPayoutsQuery() {
  return useQuery({
    queryKey: queryKeys.adminPayouts,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return adminPayouts;
      const list = (await darnaApi.admin.payouts()) as typeof adminPayouts;
      return list.length ? list : adminPayouts;
    },
    placeholderData: adminPayouts,
  });
}

export function useAdminDisputesQuery() {
  return useQuery({
    queryKey: queryKeys.adminDisputes(),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return adminDisputes;
      const list = (await darnaApi.admin.disputes()) as typeof adminDisputes;
      return list.length ? list : adminDisputes;
    },
    placeholderData: adminDisputes,
  });
}

export function useCreateSupportTicketMutation() {
  return useMutation({
    mutationFn: (body: { email?: string; orderCode?: string; message: string }) =>
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/support/tickets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ).then((r) => r.json()),
  });
}

// ---------------------------------------------------------------------------
// STRIPE, IDEAL & COOK PAYOUT ROUTING QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useCreatePaymentIntentMutation() {
  return useMutation({
    mutationFn: (body: {
      amount: number;
      cookId: string;
      paymentMethod: "ideal" | "card" | "bancontact";
      idealBank?: string;
      items?: { dishId: string; qty: number }[];
    }) => darnaApi.payments.createIntent(body),
  });
}

export function useCookPayoutSettingsQuery() {
  return useQuery({
    queryKey: ["cook", "me", "payout-settings"] as const,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        return {
          cookId: "rana",
          name: "Rana El Amri",
          payoutPreference: "BANK_TRANSFER" as const,
          stripeAccountId: null,
          stripeOnboarded: false,
          walletBalance: 287.35,
          iban: "NL91 ABNA 0417 1643 00",
          accountHolder: "Rana El Amri",
          payoutDay: "tuesday",
          explanation:
            "Customer payments are stored safely in your Daarik app wallet and sent to your IBAN via bank transfer.",
        };
      }
      return darnaApi.payments.getCookPayoutSettings();
    },
    placeholderData: {
      cookId: "rana",
      name: "Rana El Amri",
      payoutPreference: "BANK_TRANSFER" as const,
      stripeAccountId: null,
      stripeOnboarded: false,
      walletBalance: 287.35,
      iban: "NL91 ABNA 0417 1643 00",
      accountHolder: "Rana El Amri",
      payoutDay: "tuesday",
      explanation:
        "Customer payments are stored safely in your Daarik app wallet and sent to your IBAN via bank transfer.",
    },
  });
}

export function useConnectCookStripeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stripeAccountId?: string }) =>
      darnaApi.payments.connectCookStripe(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook", "me", "payout-settings"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
    },
  });
}

export function useUpdateCookPayoutSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      payoutPreference: "STRIPE" | "BANK_TRANSFER";
      iban?: string;
      accountHolder?: string;
      stripeAccountId?: string;
    }) => darnaApi.payments.updateCookPayoutSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook", "me", "payout-settings"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
    },
  });
}

export function useRequestBankTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => darnaApi.payments.requestBankTransfer(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook", "me", "payout-settings"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
      qc.invalidateQueries({ queryKey: queryKeys.adminPayouts });
    },
  });
}

export { fallbackUser };
