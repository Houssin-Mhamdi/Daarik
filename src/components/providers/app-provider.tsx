"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { darnaApi, getAccessToken, type CartRecord, type CatalogCuisine } from "@/lib/api";
import { buildPickupOptions } from "@/lib/pickup";
import {
  queryKeys,
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
  addToCart: (dishId: string, qty?: number, dish?: Dish) => boolean;
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
  cartSyncing: boolean;
  cartSyncError: boolean;
  flushCart: () => Promise<boolean>;
  guestCartConflict: boolean;
  resolveGuestCartConflict: (keepGuest: boolean) => void;
  serviceFee: number;
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE = {
  lang: "darna.lang",
  cart: "darna.cart",
  cartOwner: "darna.cartOwner",
  cartNote: "darna.cartNote",
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
  const queryClient = useQueryClient();
  const { data: liveDishes = [] } = useDishesQuery();
  const { data: liveCooks = [] } = useCooksQuery();
  const { data: catalog } = useCatalogQuery();
  const { data: apiUser, isPending: authPending } = useCurrentUserQuery();
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
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartSyncing, setCartSyncing] = useState(false);
  const [cartSyncError, setCartSyncError] = useState(false);
  const [guestCartConflict, setGuestCartConflict] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [pickup, setPickupState] = useState<string>("");
  const [pickupTime, setPickupTimeState] = useState<string>("18:00");
  const [cartNote, setCartNoteState] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const orderSeq = useRef(2422);
  const cartOwner = useRef<string | null>(null);
  const currentUserId = useRef<string | null>(null);
  const cartReady = useRef(false);
  const cartQueue = useRef<Promise<void>>(Promise.resolve());
  const cartPending = useRef(0);
  const cartRevision = useRef(0);
  const detailsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictResolver = useRef<((keepGuest: boolean) => void) | null>(null);
  const cartRef = useRef(cart);
  const pickupRef = useRef(pickup);
  const pickupTimeRef = useRef(pickupTime);
  const cartNoteRef = useRef(cartNote);
  useLayoutEffect(() => {
    cartRef.current = cart;
    pickupRef.current = pickup;
    pickupTimeRef.current = pickupTime;
    cartNoteRef.current = cartNote;
    currentUserId.current = apiUser?.id ?? null;
  }, [cart, pickup, pickupTime, cartNote, apiUser?.id]);

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
      cartOwner.current = window.localStorage.getItem(STORAGE.cartOwner);
      if (!cartOwner.current && getAccessToken()) cartOwner.current = "legacy-session";
      const storedPickup = readStored<string | null>(STORAGE.pickup, null);
      if (storedPickup) setPickupState(storedPickup);
      const storedTime = readStored<string | null>(STORAGE.pickupTime, null);
      if (storedTime) setPickupTimeState(storedTime);
      setCartNoteState(readStored<string>(STORAGE.cartNote, ""));
      setCartHydrated(true);
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
    if (!cartHydrated || (authPending && getAccessToken())) return;
    try {
      window.localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
      window.localStorage.setItem(STORAGE.cartNote, JSON.stringify(cartNote));
      if (cartOwner.current) {
        window.localStorage.setItem(STORAGE.cartOwner, cartOwner.current);
      } else {
        window.localStorage.removeItem(STORAGE.cartOwner);
      }
    } catch {
      console.error("Could not save the cart on this device");
    }
  }, [cart, cartNote, cartHydrated, authPending]);

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      window.localStorage.setItem(STORAGE.pickup, JSON.stringify(activePickup));
      window.localStorage.setItem(
        STORAGE.pickupTime,
        JSON.stringify(activePickupTime),
      );
    } catch {
      /* ignore */
    }
  }, [activePickup, activePickupTime, cartHydrated]);

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
    currentUserId.current = null;
    cartReady.current = false;
    if (detailsTimer.current) {
      clearTimeout(detailsTimer.current);
      detailsTimer.current = null;
    }
    conflictResolver.current?.(false);
    await logoutMutation.mutateAsync();
    cartOwner.current = null;
    setCartSyncing(false);
    setCartSyncError(false);
    setGuestCartConflict(false);
    setCart([]);
    setCartNoteState("");
  }, [logoutMutation]);

  const applyServerCart = useCallback((server: CartRecord) => {
    setCart(server.items.map((item) => ({ dishId: item.dishId, qty: item.qty })));
    if (server.pickupSlot) setPickupState(server.pickupSlot);
    if (server.pickupTime) setPickupTimeState(server.pickupTime);
    setCartNoteState(server.note ?? "");
  }, []);

  const resolveGuestCartConflict = useCallback((keepGuest: boolean) => {
    conflictResolver.current?.(keepGuest);
    conflictResolver.current = null;
    setGuestCartConflict(false);
  }, []);

  const runCartMutation = useCallback(
    (action: () => Promise<CartRecord>): Promise<boolean> => {
      const userId = currentUserId.current;
      if (!userId || !cartReady.current) {
        toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
        return Promise.resolve(false);
      }
      cartPending.current += 1;
      cartRevision.current += 1;
      setCartSyncing(true);
      const operation = cartQueue.current.then(async () => {
        if (currentUserId.current !== userId) return null;
        return action();
      });
      const settled = operation.then(
        (server) => {
          cartPending.current -= 1;
          if (currentUserId.current !== userId) return false;
          if (server && cartPending.current === 0 && !detailsTimer.current) {
            applyServerCart(server);
            setCartSyncing(false);
          }
          return Boolean(server);
        },
        (error: unknown) => {
          cartPending.current -= 1;
          if (currentUserId.current === userId) {
            console.error("Cart update failed", error);
            cartReady.current = false;
            setCartSyncError(true);
            setCartSyncing(cartPending.current > 0);
            toast(translate(lang, "cartSyncFailed"), { variant: "error" });
          }
          return false;
        },
      );
      cartQueue.current = settled.then(() => undefined);
      return settled;
    },
    [applyServerCart, lang, toast],
  );

  const saveCartDetails = useCallback(() => {
    if (detailsTimer.current) {
      clearTimeout(detailsTimer.current);
      detailsTimer.current = null;
    }
    if (!currentUserId.current || !cartRef.current.length) {
      if (cartPending.current === 0) setCartSyncing(false);
      return Promise.resolve(true);
    }
    return runCartMutation(() =>
      darnaApi.cart.updateDetails({
        pickupSlot: pickupRef.current,
        pickupTime: pickupTimeRef.current,
        note: cartNoteRef.current,
      }),
    );
  }, [runCartMutation]);

  const scheduleCartDetails = useCallback(() => {
    if (!currentUserId.current || !cartRef.current.length) return;
    if (!cartReady.current) {
      toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
      return;
    }
    cartRevision.current += 1;
    if (detailsTimer.current) clearTimeout(detailsTimer.current);
    setCartSyncing(true);
    detailsTimer.current = setTimeout(() => {
      void saveCartDetails();
    }, 500);
  }, [lang, saveCartDetails, toast]);

  const flushCart = useCallback(async () => {
    if (getAccessToken() && !currentUserId.current) return false;
    if (detailsTimer.current && !(await saveCartDetails())) return false;
    await cartQueue.current;
    return !currentUserId.current || cartReady.current;
  }, [saveCartDetails]);

  useEffect(() => {
    const userId = apiUser?.id;
    if (!userId || !cartHydrated) {
      cartReady.current = false;
      return;
    }
    let active = true;
    let loading = false;
    const sync = async () => {
      if (loading || cartPending.current || detailsTimer.current) return;
      loading = true;
      const revision = cartRevision.current;
      if (!cartReady.current) setCartSyncing(true);
      try {
        let server = await darnaApi.cart.get();
        if (!active || currentUserId.current !== userId) return;
        if (!cartReady.current && !cartOwner.current && cartRef.current.length) {
          const guest = [...cartRef.current];
          const details = {
            pickupSlot: pickupRef.current,
            pickupTime: pickupTimeRef.current,
            note: cartNoteRef.current,
          };
          try {
            server = await darnaApi.cart.merge({ items: guest, ...details });
          } catch (error) {
            const isConflict =
              error instanceof Error &&
              "data" in error &&
              typeof error.data === "object" &&
              error.data !== null &&
              "code" in error.data &&
              error.data.code === "DIFFERENT_COOK";
            if (!isConflict) throw error;
            const keepGuest = await new Promise<boolean>((resolve) => {
              conflictResolver.current = resolve;
              setGuestCartConflict(true);
            });
            if (!active || currentUserId.current !== userId) return;
            if (keepGuest) {
              server = await darnaApi.cart.replaceAll({ items: guest, ...details });
            } else {
              server = await darnaApi.cart.get();
            }
          }
        }
        if (!active || currentUserId.current !== userId || cartPending.current || detailsTimer.current || cartRevision.current !== revision) return;
        cartOwner.current = userId;
        cartReady.current = true;
        setCartSyncError(false);
        applyServerCart(server);
      } catch (error) {
        if (active && currentUserId.current === userId) {
          console.error("Cart synchronization failed", error);
          cartReady.current = false;
          setCartSyncError(true);
          toast(translate(lang, "cartSyncFailed"), { variant: "error" });
        }
      } finally {
        loading = false;
        if (active && !cartPending.current && !detailsTimer.current) setCartSyncing(false);
      }
    };
    void sync();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void sync();
    }, 10000);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", sync);
      window.removeEventListener("online", sync);
      conflictResolver.current?.(false);
      conflictResolver.current = null;
    };
  }, [apiUser?.id, cartHydrated, applyServerCart, lang, toast]);

  const addToCart = useCallback(
    (dishId: string, qty = 1, dishFallback?: Dish) => {
      if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
        toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
        return false;
      }
      const dish = findDish(dishId) ?? dishFallback;
      if (!dish) {
        toast(translate(lang, "dishNotFound"), { variant: "error" });
        return false;
      }
      queryClient.setQueryData<Dish[]>(queryKeys.dishes(), (current = []) =>
        current.some((item) => item.id === dish.id)
          ? current
          : [...current, dish],
      );
      if (liveCooks.find((c) => c.id === dish.cookId)?.kitchenOpen === false) {
        toast(translate(lang, "kitchenClosedBadge"));
        return false;
      }
      const currentDishes =
        queryClient.getQueryData<Dish[]>(queryKeys.dishes()) ?? liveDishes;
      const currentCook = cart.length
        ? (currentDishes.find((item) => item.id === cart[0].dishId)?.cookId ??
          null)
        : null;
      if (currentCook && currentCook !== dish.cookId) {
        setPendingSwitch({ dishId, qty });
        return false;
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
                    findDish(dishId)?.portionsLeft ?? dish.portionsLeft ?? 99,
                  ),
                }
              : line,
          );
        }
        return [...prev, { dishId, qty }];
      });
      if (getAccessToken()) {
        void runCartMutation(() => darnaApi.cart.addItem({
          dishId,
          qty,
          ...(!cart.length ? {
            pickupSlot: pickupRef.current,
            pickupTime: pickupTimeRef.current,
            note: cartNoteRef.current,
          } : {}),
        })).then((saved) => {
          if (saved) toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
        });
      } else {
        toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
      }
      return true;
    },
    [cart, liveCooks, liveDishes, findDish, lang, queryClient, toast, runCartMutation],
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
      toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
      return;
    }
    const dish = findDish(pendingSwitch.dishId);
    setCart([{ dishId: pendingSwitch.dishId, qty: pendingSwitch.qty }]);
    setPendingSwitch(null);
    if (getAccessToken()) {
      void runCartMutation(() => darnaApi.cart.replace({
        dishId: pendingSwitch.dishId,
        qty: pendingSwitch.qty,
        pickupSlot: pickupRef.current,
        pickupTime: pickupTimeRef.current,
        note: cartNoteRef.current,
      })).then((saved) => {
        if (saved && dish) toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
      });
    } else if (dish) {
      toast(translate(lang, "toastCartAdded", { name: dish.name[lang] }));
    }
  }, [pendingSwitch, findDish, lang, toast, runCartMutation]);

  const cancelSwitch = useCallback(() => setPendingSwitch(null), []);

  const setQty = useCallback(
    (dishId: string, qty: number) => {
      if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
        toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
        return;
      }
      if (qty < 1) {
        setCart((prev) => prev.filter((line) => line.dishId !== dishId));
        if (getAccessToken()) {
          void runCartMutation(() => darnaApi.cart.updateQty(dishId, 0));
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
        void runCartMutation(() => darnaApi.cart.updateQty(dishId, nextQty));
      }
    },
    [findDish, lang, runCartMutation, toast],
  );

  const removeFromCart = useCallback((dishId: string) => {
    if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
      toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
      return;
    }
    setCart((prev) => prev.filter((line) => line.dishId !== dishId));
    if (getAccessToken()) {
      void runCartMutation(() => darnaApi.cart.updateQty(dishId, 0));
    }
  }, [lang, runCartMutation, toast]);

  const clearCart = useCallback(() => {
    if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
      toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
      return;
    }
    setCart([]);
    if (getAccessToken()) {
      void runCartMutation(() => darnaApi.cart.clear());
    }
  }, [lang, runCartMutation, toast]);

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
      pickupRef.current = id;
      setPickupState(id);
      const option = catalogPickupOptions.find((p) => p.id === id);
      if (option) {
        pickupTimeRef.current = option.slots[0] ?? "";
        setPickupTimeState(pickupTimeRef.current);
      }
      scheduleCartDetails();
    },
    [catalogPickupOptions, scheduleCartDetails],
  );

  const setPickupTime = useCallback((time: string) => {
    pickupTimeRef.current = time;
    setPickupTimeState(time);
    scheduleCartDetails();
  }, [scheduleCartDetails]);

  const setCartNote = useCallback((note: string) => {
    cartNoteRef.current = note;
    setCartNoteState(note);
    scheduleCartDetails();
  }, [scheduleCartDetails]);

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
      if (getAccessToken() && (!currentUserId.current || !cartReady.current)) {
        toast(translate(lang, "cartSyncUnavailable"), { variant: "error" });
        return;
      }
      const lines = items
        .filter((item) => Boolean(findDish(item.dishId)))
        .map((item) => ({ dishId: item.dishId, qty: item.qty }));
      if (!lines.length) {
        toast(translate(lang, "dishNotFound"), { variant: "error" });
        return;
      }
      setCart(lines);
      if (getAccessToken()) {
        void runCartMutation(() => darnaApi.cart.replaceAll({
          items: lines,
          pickupSlot: pickupRef.current,
          pickupTime: pickupTimeRef.current,
          note: cartNoteRef.current,
        })).then((saved) => {
          if (saved) toast(translate(lang, "addedToCart"));
        });
      } else {
        toast(translate(lang, "addedToCart"));
      }
    },
    [findDish, lang, runCartMutation, toast],
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
    cartSyncing: cartSyncing || (Boolean(getAccessToken()) && (!cartHydrated || authPending)),
    cartSyncError,
    flushCart,
    guestCartConflict,
    resolveGuestCartConflict,
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
