"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AdminPayoutRecord,
  type CookApplicationStatus,
  type CookAvailabilityRecord,
  clearAuthTokens,
  darnaApi,
  getAccessToken,
  setAuthTokens,
} from "@/lib/api";
import {
  buildPickupOptions,
  expandPickupIds,
  parseSchedule,
} from "@/lib/pickup";
import type {
  Cook,
  CookOrder,
  CustomerOrder,
  Dish,
  Localized,
  Review,
} from "@/lib/data";

export const queryKeys = {
  authMe: ["auth", "me"] as const,
  catalog: ["catalog"] as const,
  cooks: (filters?: Record<string, string | undefined>) =>
    ["cooks", filters ?? {}] as const,
  cook: (id: string) => ["cook", id] as const,
  cookDashboard: ["cook", "me", "dashboard"] as const,
  cookProfile: ["cook", "me", "profile"] as const,
  cookApplication: ["cook", "me", "application"] as const,
  cookAvailability: ["cook", "me", "availability"] as const,
  cookEarnings: ["cook", "me", "earnings"] as const,
  cookOrders: (status?: string) =>
    ["cook", "me", "orders", status ?? "all"] as const,
  cookDishes: ["cook", "me", "dishes"] as const,
  dishes: (filters?: Record<string, string | undefined>) =>
    ["dishes", filters ?? {}] as const,
  dish: (id: string) => ["dish", id] as const,
  cart: ["cart"] as const,
  favorites: ["favorites"] as const,
  notifications: ["notifications"] as const,
  orders: ["orders", "me"] as const,
  order: (id: string) => ["orders", id] as const,
  reviews: (filters?: { cookId?: string; dishId?: string }) =>
    ["reviews", filters ?? {}] as const,
  adminOverview: (range: "30d" | "90d") =>
    ["admin", "overview", range] as const,
  adminOrders: (filters?: { status?: string; q?: string }) =>
    ["admin", "orders", filters ?? {}] as const,
  adminCooks: (filters?: { status?: string; q?: string }) =>
    ["admin", "cooks", filters ?? {}] as const,
  adminCookWorkspace: (id: string) => ["admin", "cook", id] as const,
  adminDishes: (filters?: { filter?: string; q?: string }) =>
    ["admin", "dishes", filters ?? {}] as const,
  adminPayouts: ["admin", "payouts"] as const,
  adminDisputes: (status?: string) =>
    ["admin", "disputes", status ?? "all"] as const,
  adminSettings: ["admin", "settings"] as const,
};

export type AdminCookRecord = {
  id: string;
  name: string;
  city: string;
  avatar: string | null;
  cuisineIds: string[];
  status: string;
  rating: number;
  ordersCount: number;
  createdAt: string;
};

export type AdminCookApplicationRecord = {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  email: string;
  phone: string;
  documentsCount: number;
  submittedAt: string;
};

export type AdminCooksResponse = {
  cooks: AdminCookRecord[];
  verificationQueue: AdminCookApplicationRecord[];
};

export type AdminDishRecord = {
  id: string;
  name: { nl: string; en: string; ar: string } | string;
  desc: { nl: string; en: string; ar: string } | string;
  image: string;
  cook: string;
  cookId: string;
  cuisine: string;
  price: number;
  rating: number;
  reviewCount: number;
  portionsLeft: number;
  status: "live" | "paused" | "draft";
  reported: boolean;
};

export type AdminOrderRecord = {
  id: string;
  code: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  cook: string;
  amount: number;
  serviceFee: number;
  status: "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  paymentStatus: string;
  paid: boolean;
  pickup: string;
  createdAt: string;
  items: {
    qty: number;
    unitPrice: number;
    dish?: { name: { nl: string; en: string; ar: string } | string } | null;
  }[];
};

export type AdminDisputeRecord = {
  id: string;
  code: string;
  customer: string;
  cook: string;
  reason: string;
  customerNote: string | null;
  resolutionNote: string | null;
  amount: number;
  refundAmount: number | null;
  status: "open" | "review" | "resolved";
  opened: string;
  resolvedAt: string | null;
};

export type CookDashboardResponse = {
  cook: Cook | null;
  stats: {
    gross: number;
    commission: number;
    net: number;
    refunds: number;
    activeDishes: number;
    incomingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    weeklySales: number[];
  };
  recentOrders: unknown[];
  dishes: Dish[];
  payouts: unknown[];
};

const EMPTY_LOCALIZED: Localized = { nl: "", en: "", ar: "" };

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function localizedValue(value: unknown, fallback = EMPTY_LOCALIZED): Localized {
  if (typeof value === "string") {
    return { nl: value, en: value, ar: value };
  }
  const record = toRecord(value);
  return {
    nl: stringValue(record.nl, fallback.nl),
    en: stringValue(record.en, fallback.en),
    ar: stringValue(record.ar, fallback.ar),
  };
}

function localizedList(value: unknown): Localized[] {
  return Array.isArray(value) ? value.map((item) => localizedValue(item)) : [];
}

function normalizeReview(value: unknown): Review {
  const raw = toRecord(value);
  return {
    id: stringValue(raw.id),
    cookId: stringValue(raw.cookId),
    dishId: stringValue(raw.dishId) || undefined,
    author: stringValue(raw.author),
    initials: stringValue(raw.initials),
    rating: numberValue(raw.rating),
    date: localizedValue(raw.date),
    text: localizedValue(raw.text),
  };
}

export function normalizeDish(value: unknown): Dish {
  const raw = toRecord(value);
  const cook = toRecord(raw.cook);
  return {
    id: stringValue(raw.slug) || stringValue(raw.id),
    cookId: stringValue(cook.slug) || stringValue(raw.cookId),
    name: localizedValue(raw.name),
    desc: localizedValue(raw.desc),
    image: stringValue(raw.image),
    price: numberValue(raw.price),
    cuisineId: stringValue(raw.cuisineId, "moroccan") as Dish["cuisineId"],
    rating: numberValue(raw.rating),
    reviewCount: numberValue(raw.reviewCount),
    serves: numberValue(raw.serves, 1),
    portions: numberValue(raw.portions, 8),
    portionsLeft: numberValue(raw.portionsLeft),
    allergens: stringList(raw.allergens),
    dietary: stringList(raw.dietary),
    ingredients: localizedList(raw.ingredients),
    pickup: expandPickupIds(parseSchedule(raw), buildPickupOptions()),
    schedule: parseSchedule(raw),
    featured: raw.featured === true,
    weekend: raw.weekend === true,
    family: raw.family === true,
    badge: raw.badge ? localizedValue(raw.badge) : undefined,
    prepTime: localizedValue(raw.prepTime),
    status:
      raw.status === "LIVE" || raw.status === "live"
        ? "live"
        : raw.status === "PAUSED" || raw.status === "paused"
          ? "paused"
          : raw.status === "DRAFT" || raw.status === "draft"
            ? "draft"
            : undefined,
  };
}

export function normalizeCook(value: unknown): Cook {
  const raw = toRecord(value);
  return {
    id: stringValue(raw.slug) || stringValue(raw.id),
    name: stringValue(raw.name),
    avatar: stringValue(raw.avatar),
    cover: stringValue(raw.cover),
    city: stringValue(raw.city),
    area: localizedValue(raw.area),
    cuisineIds: stringList(raw.cuisineIds) as Cook["cuisineIds"],
    rating: numberValue(raw.rating),
    reviewCount: numberValue(raw.reviewCount),
    verified: raw.verified === true,
    languages: stringList(raw.languages),
    bio: localizedValue(raw.bio),
    since: stringValue(raw.since),
    orders: numberValue(raw.ordersCount ?? raw.orders),
    response: localizedValue(raw.response),
    pickupArea: localizedValue(raw.pickupArea),
    specialties: localizedValue(raw.specialties),
    instructions: localizedValue(raw.instructions),
    yearsCooking: numberValue(raw.yearsCooking),
    latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
    longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
  };
}

// ---------------------------------------------------------------------------
// CATALOG META
// ---------------------------------------------------------------------------
export function useCatalogQuery() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: () => darnaApi.support.catalog(),
    staleTime: 5 * 60 * 1000,
  });
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
      try {
        return await darnaApi.auth.me();
      } catch {
        clearAuthTokens();
        return null;
      }
    },
    retry: false,
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
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
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
        if (getAccessToken()) {
          await darnaApi.auth.logout();
        }
      } catch {
        // Ignore 401 / network errors on logout when token is already expired
      } finally {
        clearAuthTokens();
      }
    },
    onSettled: () => {
      qc.setQueryData(queryKeys.authMe, null);
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useUpdateUserProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.users.updateProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.authMe });
    },
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      if (!getAccessToken()) return [];
      return darnaApi.users.notifications();
    },
  });
}

export function useFavoritesQuery() {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: async () => {
      if (!getAccessToken()) return { dishes: [], cooks: [] };
      return darnaApi.users.favorites();
    },
  });
}

export function useToggleFavoriteDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dishId: string) => darnaApi.users.toggleFavoriteDish(dishId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

export function useToggleFavoriteCookMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cookId: string) => darnaApi.users.toggleFavoriteCook(cookId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

export function useMarkNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => darnaApi.users.markNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
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
      const list = await darnaApi.dishes.list(clean);
      return list.map(normalizeDish).filter((dish) => dish.id);
    },
  });
}

export function useDishQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.dish(id),
    queryFn: async () => {
      const raw = await darnaApi.dishes.get(id);
      return normalizeDish(raw);
    },
    enabled: Boolean(id),
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
      const list = await darnaApi.cooks.list(filters);
      return list.map(normalizeCook).filter((cook) => cook.id);
    },
  });
}

export function useCookQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.cook(id),
    queryFn: async () => {
      const raw = toRecord(await darnaApi.cooks.get(id));
      return {
        cook: normalizeCook(raw),
        dishes: Array.isArray(raw.dishes) ? raw.dishes.map(normalizeDish) : [],
        reviews: Array.isArray(raw.reviews)
          ? raw.reviews.map(normalizeReview)
          : [],
      };
    },
    enabled: Boolean(id),
  });
}

export function useUploadDishImageMutation() {
  return useMutation({
    mutationFn: (file: File) => darnaApi.dishes.uploadImage(file),
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
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
    },
  });
}

export function useDeleteDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => darnaApi.dishes.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dishes"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookDishes });
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (typeof window !== "undefined" && typeof body.email === "string") {
        window.localStorage.setItem(
          "darna.cookApplicationEmail",
          body.email.trim(),
        );
      }
      return (await darnaApi.cooks.apply(body)) as CookApplicationStatus;
    },
    onSuccess: (data) => {
      if (data) {
        qc.setQueryData(queryKeys.cookApplication, data);
      }
      qc.invalidateQueries({ queryKey: queryKeys.cookApplication });
    },
  });
}

export function useMyCookApplicationQuery(enabled = true, userEmail?: string) {
  return useQuery<CookApplicationStatus | null>({
    queryKey: [...queryKeys.cookApplication, userEmail ?? ""] as const,
    queryFn: async () => {
      const token = getAccessToken();
      const storedEmail =
        typeof window !== "undefined"
          ? window.localStorage.getItem("darna.cookApplicationEmail")
          : null;
      const emailToLookup = userEmail || storedEmail;
      if (!token && !emailToLookup) return null;
      return darnaApi.cooks.myApplication(emailToLookup ?? undefined);
    },
    enabled,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 10_000 : false,
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
      if (!token) return [] as CustomerOrder[];
      return (await darnaApi.orders.myOrders()) as CustomerOrder[];
    },
  });
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: async () => {
      return (await darnaApi.orders.get(id)) as CustomerOrder;
    },
    enabled: Boolean(id) && Boolean(getAccessToken()),
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
      qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}

export function useReviewsQuery(filters?: {
  cookId?: string;
  dishId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.reviews(filters),
    queryFn: async () => {
      return (await darnaApi.reviews.list(filters)) as Review[];
    },
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
      qc.invalidateQueries({
        queryKey: queryKeys.reviews({ cookId: vars.cookId }),
      });
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
export function useCookDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.cookDashboard,
    queryFn: async () => {
      if (!getAccessToken()) return null;
      const raw = toRecord(await darnaApi.cooks.myDashboard());
      return {
        ...raw,
        cook: raw.cook ? normalizeCook(raw.cook) : null,
        dishes: Array.isArray(raw.dishes) ? raw.dishes.map(normalizeDish) : [],
      } as unknown as CookDashboardResponse;
    },
  });
}

export function useCookProfileQuery() {
  return useQuery({
    queryKey: queryKeys.cookProfile,
    queryFn: async () => {
      if (!getAccessToken()) return null;
      return normalizeCook(await darnaApi.cooks.myProfile());
    },
  });
}

export function useUpdateCookProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.cooks.updateMyProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cookProfile });
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
      qc.invalidateQueries({ queryKey: ["cooks"] });
    },
  });
}

export function useCookOrdersQuery(status?: string) {
  return useQuery({
    queryKey: queryKeys.cookOrders(status),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return [] as CookOrder[];
      return (await darnaApi.orders.cookOrders(status)) as CookOrder[];
    },
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
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
    },
  });
}

export function useCookAvailabilityQuery() {
  return useQuery({
    queryKey: queryKeys.cookAvailability,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return null;
      return darnaApi.cooks.myAvailability() as Promise<CookAvailabilityRecord>;
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
      qc.invalidateQueries({ queryKey: queryKeys.cookDashboard });
    },
  });
}

export function useCookEarningsQuery() {
  return useQuery({
    queryKey: queryKeys.cookEarnings,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return null;
      return darnaApi.payments.getCookEarnings();
    },
  });
}

// ---------------------------------------------------------------------------
// ADMIN QUERIES & MUTATIONS
// ---------------------------------------------------------------------------
export function useAdminOverviewQuery(range: "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: queryKeys.adminOverview(range),
    queryFn: async () => {
      if (!getAccessToken()) return null;
      return darnaApi.admin.overview(range);
    },
  });
}

export function useAdminOrdersQuery(params?: { status?: string; q?: string }) {
  return useQuery({
    queryKey: queryKeys.adminOrders(params),
    queryFn: async () => {
      if (!getAccessToken()) return [] as AdminOrderRecord[];
      return (await darnaApi.admin.orders(params)) as AdminOrderRecord[];
    },
  });
}

export function useAdminUpdateOrderStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      darnaApi.admin.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });
}

export function useAdminCooksQuery(params?: { status?: string; q?: string }) {
  return useQuery({
    queryKey: queryKeys.adminCooks(params),
    queryFn: async () => {
      if (!getAccessToken()) {
        return {
          cooks: [],
          verificationQueue: [],
        } satisfies AdminCooksResponse;
      }
      return (await darnaApi.admin.cooks(params)) as AdminCooksResponse;
    },
  });
}

export function useAdminUpdateCookStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      darnaApi.admin.updateCookStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cooks"] });
      qc.invalidateQueries({ queryKey: ["cooks"] });
    },
  });
}

export function useAdminUpdateCookComplianceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: string;
      note?: string;
      kvkNumber?: string;
      nvwaRegistered?: boolean;
      payoutHoldDays?: number;
    }) => darnaApi.admin.updateCookCompliance(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cooks"] });
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });
}

export function useAdminApproveVerificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      darnaApi.admin.approveVerification(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cooks"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminRequestVerificationChangesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      darnaApi.admin.requestVerificationChanges(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cooks"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminCookWorkspaceQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.adminCookWorkspace(id),
    queryFn: async () =>
      (await darnaApi.admin.cookWorkspace(id)) as {
        cook: {
          id: string;
          name: string;
          city: string;
          avatar: string;
          cuisineIds: string[];
          status: string;
          verified: boolean;
          kitchenOpen: boolean;
          maxPortionsPerDay: number;
          availableDays: string[];
          availableSlots: string[];
        };
        dishes: Dish[];
      },
    enabled: Boolean(id),
  });
}

export function useAdminCreateCookDishMutation(cookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.admin.createCookDish(cookId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminCookWorkspace(cookId) });
      qc.invalidateQueries({ queryKey: queryKeys.adminDishes() });
      qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}

export function useAdminUpdateCookAvailabilityMutation(cookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.admin.updateCookAvailability(cookId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.adminCookWorkspace(cookId) }),
  });
}

export function useAdminDishesQuery(params?: { filter?: string; q?: string }) {
  return useQuery({
    queryKey: queryKeys.adminDishes(params),
    queryFn: async () => {
      if (!getAccessToken()) return [] as AdminDishRecord[];
      return (await darnaApi.admin.dishes(params)) as AdminDishRecord[];
    },
  });
}

export function useAdminModerateDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      darnaApi.admin.moderateDish(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dishes"] });
      qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}

export function useAdminRemoveDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => darnaApi.admin.removeDish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dishes"] });
      qc.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
}

export function useAdminPayoutsQuery() {
  return useQuery({
    queryKey: queryKeys.adminPayouts,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return [] as AdminPayoutRecord[];
      return darnaApi.admin.payouts();
    },
  });
}

export function useSyncAdminPayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => darnaApi.admin.syncPayout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayouts });
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });
}

export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return null;
      return darnaApi.admin.settings();
    },
  });
}

export function useAdminDisputesQuery(status?: string) {
  return useQuery({
    queryKey: queryKeys.adminDisputes(status),
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return [] as AdminDisputeRecord[];
      return (await darnaApi.admin.disputes(status)) as AdminDisputeRecord[];
    },
  });
}

export function useAdminResolveDisputeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      refundAmount?: number;
      resolutionNote?: string;
      status?: string;
    }) => darnaApi.admin.resolveDispute(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "disputes"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });
}

export function useCreateSupportTicketMutation() {
  return useMutation({
    mutationFn: (body: {
      email?: string;
      orderCode?: string;
      message: string;
    }) => darnaApi.support.createTicket(body),
  });
}

// ---------------------------------------------------------------------------
// STRIPE CONNECT: CHECKOUT, ONBOARDING & EARNINGS
// ---------------------------------------------------------------------------
export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (body: {
      orderCode: string;
      paymentMethod?: "ideal" | "card" | "bancontact";
    }) => darnaApi.payments.createCheckoutSession(body),
  });
}

export function useCookPayoutSettingsQuery() {
  return useQuery({
    queryKey: ["cook", "me", "payout-settings"] as const,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return null;
      return darnaApi.payments.getCookPayoutSettings();
    },
  });
}

export function useSyncCookPayoutSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => darnaApi.payments.syncCookPayoutSettings(),
    onSuccess: (data) => {
      qc.setQueryData(["cook", "me", "payout-settings"], data);
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
    },
  });
}

export function useStripeOnboardingMutation() {
  return useMutation({
    mutationFn: () => darnaApi.payments.createOnboardingLink(),
  });
}

export function useUpdatePayoutScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      interval: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
      weeklyAnchor?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
      monthlyAnchor?: number;
    }) => darnaApi.payments.updatePayoutSchedule(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook", "me", "payout-settings"] });
      qc.invalidateQueries({ queryKey: queryKeys.cookEarnings });
    },
  });
}

// ---------------------------------------------------------------------------
// ADMIN: STRIPE MARKETPLACE PAYMENTS
// ---------------------------------------------------------------------------
export function useAdminMarketplaceQuery() {
  return useQuery({
    queryKey: ["admin", "marketplace"] as const,
    queryFn: async () => darnaApi.admin.marketplace(),
  });
}

export function useReleaseTransfersMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => darnaApi.admin.releaseTransfers(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
      qc.invalidateQueries({ queryKey: queryKeys.adminPayouts });
    },
  });
}

export function useAdminRefundOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      reason,
    }: {
      id: string;
      amount?: number;
      reason?: string;
    }) => darnaApi.admin.refundOrder(id, { amount, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });
}

export function useUpdateAdminSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      darnaApi.admin.updateSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.adminSettings, data);
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: queryKeys.catalog });
    },
  });
}
