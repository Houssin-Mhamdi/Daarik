"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  translate,
  isRtl,
  locales,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n";
import {
  SERVICE_FEE,
  type Cook,
  type Dish,
  type OrderItem,
  type PickupOption,
} from "@/lib/data";
import { darnaApi, getAccessToken, type CatalogCuisine } from "@/lib/api";
import { buildPickupOptions } from "@/lib/pickup";
import {
  useCatalogQuery,
  useCooksQuery,
  useCreateOrderMutation,
  useCurrentUserQuery,
  useFavoritesQuery,
  useDishesQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useToggleFavoriteCookMutation,
  useToggleFavoriteDishMutation,
} from "@/lib/queries";

export type CartLine = { dishId: string; qty: number };
export type ToastVariant = "success" | "error" | "info";
export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type PendingSwitch = { dishId: string; qty: number } | null;

export type PlacedOrder = {
  code: string;
  cookId: string;
  items: OrderItem[];
  pickup: string;
  pickupTime: string;
  total: number;
  email: string;
  payment: string;
  note?: string;
};

export type AuthUser = {
  id?: string;
  name: string;
  firstName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  postcode?: string;
  city?: string;
  role?: "CUSTOMER" | "COOK" | "ADMIN" | "GUEST";
};

type AppContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  t: (
    key: TranslationKey | string,
    vars?: Record<string, string | number>,
  ) => string;
  dishes: Dish[];
  cooks: Cook[];
  cuisines: CatalogCuisine[];
  pickupOptions: PickupOption[];
  user: AuthUser;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    city?: string;
    role?: "CUSTOMER" | "COOK";
  }) => Promise<void>;
  logout: () => Promise<void>;
  cart: CartLine[];
  cartCount: number;
  cartCookId: string | null;
  addToCart: (dishId: string, qty?: number) => void;
  setQty: (dishId: string, qty: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  pendingSwitch: PendingSwitch;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  favorites: string[];
  toggleFavorite: (dishId: string) => boolean;
  isFavorite: (dishId: string) => boolean;
  favoriteCooks: string[];
  toggleFavoriteCook: (cookId: string) => boolean;
  isFavoriteCook: (cookId: string) => boolean;
  toasts: ToastMessage[];
  toast: (
    title: string,
    options?: { description?: string; variant?: ToastVariant },
  ) => void;
  dismissToast: (id: number) => void;
  lastOrder: PlacedOrder | null;
  placeOrder: (order: Omit<PlacedOrder, "code">) => string;
  reorderCart: (items: OrderItem[]) => void;
  pickup: string;
  setPickup: (id: string) => void;
  pickupTime: string;
  setPickupTime: (time: string) => void;
  cartNote: string;
  setCartNote: (note: string) => void;
  serviceFee: number;
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE = {
  lang: "darna.lang",
  cart: "darna.cart",
  pickup: "darna.pickup",
  pickupTime: "darna.pickupTime",
};

const defaultCart: CartLine[] = [];

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

let toastSeq = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: liveDishes = [] } = useDishesQuery();
  const { data: liveCooks = [] } = useCooksQuery();
  const { data: catalog } = useCatalogQuery();
  const { data: apiUser } = useCurrentUserQuery();
  const { data: apiFavorites } = useFavoritesQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const createOrderMutation = useCreateOrderMutation();
  const toggleFavoriteDishMutation = useToggleFavoriteDishMutation();
  const toggleFavoriteCookMutation = useToggleFavoriteCookMutation();

  const [lang, setLangState] = useState<Lang>("nl");
  const [langHydrated, setLangHydrated] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(defaultCart);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [pickup, setPickupState] = useState<string>("");
  const [pickupTime, setPickupTimeState] = useState<string>("18:00");
  const [cartNote, setCartNote] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const orderSeq = useRef(2422);

  const findDish = useCallback(
    (id: string) => liveDishes.find((d) => d.id === id),
    [liveDishes],
  );

  const favoriteDishIds = useMemo(
    () =>
      apiUser
        ? (apiFavorites?.dishes ?? []).map((dish) => dish.slug || dish.id)
        : [],
    [apiUser, apiFavorites],
  );
  const favoriteCookIds = useMemo(
    () =>
      apiUser
        ? (apiFavorites?.cooks ?? []).map((cook) => cook.slug || cook.id)
        : [],
    [apiUser, apiFavorites],
  );
  const catalogPickupOptions = useMemo(() => buildPickupOptions(), []);
  const catalogCuisines = useMemo(
    () => (catalog?.cuisines ?? []).map((c) => ({ ...c, flag: "" })),
    [catalog?.cuisines],
  );
  const selectedPickupOption =
    catalogPickupOptions.find((option) => option.id === pickup) ??
    catalogPickupOptions[0];
  const activePickup = selectedPickupOption?.id ?? pickup;
  const activePickupTime = pickupTime;

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    try {
      window.localStorage.setItem(STORAGE.lang, JSON.stringify(nextLang));
    } catch {
      /* ignore */
    }
  }, []);

  // Hydrate preferences from localStorage (never auto-login a demo user)
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const storedLang = readStored<Lang | null>(STORAGE.lang, null);
      if (storedLang && locales.includes(storedLang)) {
        setLangState(storedLang);
      }
      setLangHydrated(true);
      const storedCart = readStored<CartLine[] | null>(STORAGE.cart, null);
      if (storedCart) setCart(storedCart);
      const storedPickup = readStored<string | null>(STORAGE.pickup, null);
      if (storedPickup) setPickupState(storedPickup);
      const storedTime = readStored<string | null>(STORAGE.pickupTime, null);
      if (storedTime) setPickupTimeState(storedTime);
    });
    return () => {
      active = false;
    };
  }, []);

  // sync <html lang/dir>
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = isRtl(lang) ? "rtl" : "ltr";
    if (!langHydrated) return;
    try {
      window.localStorage.setItem(STORAGE.lang, JSON.stringify(lang));
    } catch {
      /* ignore */
    }
  }, [lang, langHydrated]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.pickup, JSON.stringify(activePickup));
      window.localStorage.setItem(
        STORAGE.pickupTime,
        JSON.stringify(activePickupTime),
      );
    } catch {
      /* ignore */
    }
  }, [activePickup, activePickupTime]);

  useEffect(() => {
    const scheduledTimers = timers.current;
    return () => {
      scheduledTimers.forEach(clearTimeout);
    };
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (
      title: string,
      options?: { description?: string; variant?: ToastVariant },
    ) => {
      const id = ++toastSeq;
      const message: ToastMessage = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? "success",
      };
      setToasts((prev) => [...prev.slice(-2), message]);
      const timer = setTimeout(() => dismissToast(id), 3800);
      timers.current.push(timer);
    },
    [dismissToast],
  );

  const t = useCallback(
    (key: TranslationKey | string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      city?: string;
      role?: "CUSTOMER" | "COOK";
    }) => {
      await registerMutation.mutateAsync({
        ...data,
        preferredLang: lang,
      });
    },
    [registerMutation, lang],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const addToCart = useCallback(
    (dishId: string, qty = 1) => {
      const dish = findDish(dishId);
      if (!dish) return;
      if (liveCooks.find((c) => c.id === dish.cookId)?.kitchenOpen === false) {
        toast(translate(lang, "kitchenClosedBadge"));
        return;
      }
      const currentCook = cart.length ? findDish(cart[0].dishId)?.cookId : null;
      if (currentCook && currentCook !== dish.cookId) {
        setPendingSwitch({ dishId, qty });
        return;
      }
      setCart((prev) => {
        const existing = prev.find((line) => line.dishId === dishId);
        if (existing) {
          return prev.map((line) =>
            line.dishId === dishId
              ? {
                  ...line,
                  qty: Math.min(
                    line.qty + qty,
                    findDish(dishId)?.portionsLeft ?? 99,
                  ),
                }
              : line,
          );
        }
        return [...prev, { dishId, qty }];
      });
      toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));

      if (getAccessToken()) {
        darnaApi.cart.addItem({ dishId, qty }).catch(() => {});
      }
    },
    [cart, liveCooks, findDish, lang, toast],
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    const dish = findDish(pendingSwitch.dishId);
    setCart([{ dishId: pendingSwitch.dishId, qty: pendingSwitch.qty }]);
    setPendingSwitch(null);
    if (dish) {
      toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
    }
    if (getAccessToken()) {
      darnaApi.cart
        .replace({ dishId: pendingSwitch.dishId, qty: pendingSwitch.qty })
        .catch(() => {});
    }
  }, [pendingSwitch, findDish, lang, toast]);

  const cancelSwitch = useCallback(() => setPendingSwitch(null), []);

  const setQty = useCallback(
    (dishId: string, qty: number) => {
      if (qty < 1) {
        setCart((prev) => prev.filter((line) => line.dishId !== dishId));
        if (getAccessToken()) {
          darnaApi.cart.updateQty(dishId, 0).catch(() => {});
        }
        return;
      }
      const max = findDish(dishId)?.portionsLeft ?? 99;
      const nextQty = Math.min(qty, max);
      setCart((prev) =>
        prev.map((line) =>
          line.dishId === dishId ? { ...line, qty: nextQty } : line,
        ),
      );
      if (getAccessToken()) {
        darnaApi.cart.updateQty(dishId, nextQty).catch(() => {});
      }
    },
    [findDish],
  );

  const removeFromCart = useCallback((dishId: string) => {
    setCart((prev) => prev.filter((line) => line.dishId !== dishId));
    if (getAccessToken()) {
      darnaApi.cart.updateQty(dishId, 0).catch(() => {});
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    if (getAccessToken()) {
      darnaApi.cart.clear().catch(() => {});
    }
  }, []);

  const toggleFavorite = useCallback(
    (dishId: string) => {
      if (!apiUser) return false;
      const added = !favoriteDishIds.includes(dishId);
      toggleFavoriteDishMutation.mutate(dishId);
      return added;
    },
    [apiUser, favoriteDishIds, toggleFavoriteDishMutation],
  );

  const isFavorite = useCallback(
    (dishId: string) => favoriteDishIds.includes(dishId),
    [favoriteDishIds],
  );

  const toggleFavoriteCook = useCallback(
    (cookId: string) => {
      if (!apiUser) return false;
      const added = !favoriteCookIds.includes(cookId);
      toggleFavoriteCookMutation.mutate(cookId);
      return added;
    },
    [apiUser, favoriteCookIds, toggleFavoriteCookMutation],
  );

  const isFavoriteCook = useCallback(
    (cookId: string) => favoriteCookIds.includes(cookId),
    [favoriteCookIds],
  );

  const cartCookId = useMemo(() => {
    if (!cart.length) return null;
    return findDish(cart[0].dishId)?.cookId ?? null;
  }, [cart, findDish]);

  const setPickup = useCallback(
    (id: string) => {
      setPickupState(id);
      const option = catalogPickupOptions.find((p) => p.id === id);
      if (option) {
        setPickupTimeState(option.slots[0] ?? "");
      }
    },
    [catalogPickupOptions],
  );

  const setPickupTime = useCallback((time: string) => {
    setPickupTimeState(time);
  }, []);

  const user = useMemo<AuthUser>(() => {
    if (apiUser) {
      const fullName = apiUser.name || "";
      const firstName =
        apiUser.firstName || (fullName ? fullName.split(/\s+/)[0] : "");
      return {
        id: apiUser.id,
        name: fullName,
        firstName,
        email: apiUser.email || "",
        phone: apiUser.phone || "",
        avatar: apiUser.avatar || "",
        address: apiUser.address || "",
        postcode: apiUser.postcode || "",
        city: apiUser.city || "",
        role: apiUser.role || "CUSTOMER",
      };
    }
    return {
      id: undefined,
      name: "",
      firstName: "",
      email: "",
      phone: "",
      avatar: "",
      address: "",
      postcode: "",
      city: "",
      role: "GUEST",
    };
  }, [apiUser]);

  const placeOrder = useCallback(
    (order: Omit<PlacedOrder, "code">) => {
      const code = `DR-${++orderSeq.current}`;
      setLastOrder({ ...order, code });
      setCart([]);

      if (getAccessToken()) {
        createOrderMutation
          .mutateAsync({
            items: order.items,
            pickup: order.pickup,
            pickupTime: order.pickupTime,
            customerName: user.name,
            customerEmail: order.email || user.email,
            customerPhone: user.phone || "+31 6 12 34 56 78",
            note: order.note,
            paymentMethod:
              order.payment?.toUpperCase() === "CARD"
                ? "CARD"
                : order.payment?.toUpperCase() === "BANCONTACT"
                  ? "BANCONTACT"
                  : "IDEAL",
          })
          .then((created) => {
            if (created?.code) {
              setLastOrder((prev) =>
                prev ? { ...prev, code: created.code } : prev,
              );
            }
          })
          .catch(() => {});
      }

      return code;
    },
    [createOrderMutation, user],
  );

  const reorderCart = useCallback(
    (items: OrderItem[]) => {
      setCart(
        items
          .filter((item) => Boolean(findDish(item.dishId)))
          .map((item) => ({ dishId: item.dishId, qty: item.qty })),
      );
    },
    [findDish],
  );

  const value: AppContextValue = {
    lang,
    setLang,
    dir: isRtl(lang) ? "rtl" : "ltr",
    t,
    dishes: liveDishes,
    cooks: liveCooks,
    cuisines: catalogCuisines,
    pickupOptions: catalogPickupOptions,
    user,
    isAuthenticated: Boolean(apiUser),
    login,
    register,
    logout,
    cart,
    cartCount: cart.reduce((n, line) => n + line.qty, 0),
    cartCookId,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    pendingSwitch,
    confirmSwitch,
    cancelSwitch,
    favorites: favoriteDishIds,
    toggleFavorite,
    isFavorite,
    favoriteCooks: favoriteCookIds,
    toggleFavoriteCook,
    isFavoriteCook,
    toasts,
    toast,
    dismissToast,
    lastOrder,
    placeOrder,
    reorderCart,
    pickup: activePickup,
    setPickup,
    pickupTime: activePickupTime,
    setPickupTime,
    cartNote,
    setCartNote,
    serviceFee: catalog?.serviceFee ?? SERVICE_FEE,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
