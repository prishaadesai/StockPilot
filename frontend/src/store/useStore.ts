import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, portfolioAPI, wishlistAPI, walletAPI, alertsAPI, stockAPI } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface PortfolioStock {
  sym: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  change?: number;
  changePct?: number;
  nativeCurrency?: string;
}

export interface WishlistStock {
  sym: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface Alert {
  id: string;
  sym: string;
  type: 'above' | 'below' | 'percent';
  value: number;
  triggered: boolean;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;

  // UI
  isDark: boolean;
  walletBalance: number;
  portfolio: PortfolioStock[];
  wishlist: WishlistStock[];
  alerts: Alert[];
  selectedMarket: 'US' | 'India' | 'Crypto';
  selectedStock: string | null;
  loading: boolean;
  currency: 'USD' | 'INR';
  exchangeRate: number;
  activeTab: string;

  // Auth actions
  loginUser: (email: string, password: string) => Promise<void>;
  signupUser: (name: string, email: string, password: string) => Promise<void>;
  login: (user: User, token?: string) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;

  // UI actions
  toggleTheme: () => void;
  setSelectedMarket: (m: 'US' | 'India' | 'Crypto') => void;
  setSelectedStock: (sym: string | null) => void;
  setLoading: (l: boolean) => void;
  setCurrency: (c: 'USD' | 'INR') => void;
  setActiveTab: (tab: string) => void;

  // Data actions (API-backed)
  fetchPortfolio: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchExchangeRate: () => Promise<void>;

  // Trade actions
  buyStock: (sym: string, name: string, price: number, qty: number) => Promise<void>;
  sellStock: (sym: string, qty: number, price: number) => Promise<void>;

  // Wallet
  setWalletBalance: (b: number) => void;
  addFunds: (amount: number) => Promise<{ balance: number }>;

  // Wishlist
  addToWishlist: (stock: WishlistStock) => Promise<void>;
  removeFromWishlist: (sym: string) => Promise<void>;

  // Portfolio local helpers
  addToPortfolio: (stock: PortfolioStock) => void;
  removeFromPortfolio: (sym: string) => void;
  updatePortfolioStock: (sym: string, updates: Partial<PortfolioStock>) => void;

  // Alerts
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => Promise<void>;
  createAlert: (data: { sym: string; type: 'above' | 'below' | 'percent'; value: number }) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDark: true,
      walletBalance: 100000,
      portfolio: [],
      wishlist: [],
      alerts: [],
      selectedMarket: 'US',
      selectedStock: 'AAPL',
      loading: false,
      currency: 'USD',
      exchangeRate: 83.5,
      activeTab: 'dashboard',

      // ─── Auth ───────────────────────────────────────────────
      loginUser: async (email, password) => {
        const { data } = await authAPI.login({ email, password });
        set({
          user: { id: data.user.id, email: data.user.email, name: data.user.name },
          token: data.token,
          walletBalance: data.user.walletBalance,
        });
        // Fetch portfolio + wishlist after login
        setTimeout(() => {
          get().fetchPortfolio();
          get().fetchWishlist();
          get().fetchAlerts();
        }, 100);
      },

      signupUser: async (name, email, password) => {
        const { data } = await authAPI.signup({ name, email, password });
        set({
          user: { id: data.user.id, email: data.user.email, name: data.user.name },
          token: data.token,
          walletBalance: data.user.walletBalance,
        });
      },

      login: (user, token) => set({ user, token: token || get().token }),

      logout: () => set({
        user: null,
        token: null,
        portfolio: [],
        wishlist: [],
        alerts: [],
        walletBalance: 100000,
      }),

      fetchMe: async () => {
        try {
          const { data } = await authAPI.me();
          set({
            user: { id: data.id, email: data.email, name: data.name },
            walletBalance: data.walletBalance,
          });
        } catch {
          set({ user: null, token: null });
        }
      },

      // ─── UI ─────────────────────────────────────────────────
      toggleTheme: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle('dark', next);
      },
      setSelectedMarket: (m) => set({ selectedMarket: m }),
      setSelectedStock: (sym) => set({ selectedStock: sym }),
      setLoading: (l) => set({ loading: l }),
      setCurrency: (c) => set({ currency: c }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ─── Fetch data from API ────────────────────────────────
      fetchPortfolio: async () => {
        try {
          const { data } = await portfolioAPI.get();
          set({ portfolio: data });
        } catch (err) {
          console.error('Failed to fetch portfolio:', err);
        }
      },

      fetchWishlist: async () => {
        try {
          const { data } = await wishlistAPI.get();
          set({ wishlist: data });
        } catch (err) {
          console.error('Failed to fetch wishlist:', err);
        }
      },

      fetchWallet: async () => {
        try {
          const { data } = await walletAPI.get();
          set({ walletBalance: data.balance });
        } catch (err) {
          console.error('Failed to fetch wallet:', err);
        }
      },

      fetchAlerts: async () => {
        try {
          const { data } = await alertsAPI.get();
          set({ alerts: data.map((a: any) => ({ ...a, id: a._id || a.id })) });
        } catch (err) {
          console.error('Failed to fetch alerts:', err);
        }
      },

      fetchExchangeRate: async () => {
        try {
          const { data } = await stockAPI.exchangeRate();
          if (data?.rate) {
            set({ exchangeRate: data.rate });
          }
        } catch (err) {
          console.error('Failed to fetch exchange rate:', err);
        }
      },

      // ─── Trading ────────────────────────────────────────────
      buyStock: async (sym, name, _price, qty) => {
        try {
          const { data } = await portfolioAPI.buy({ sym, name, quantity: qty });
          set({ walletBalance: data.walletBalance });
          get().fetchPortfolio();
        } catch (err: any) {
          const msg = err?.response?.data?.error || 'Buy order failed';
          throw new Error(msg);
        }
      },

      sellStock: async (sym, qty, _price) => {
        try {
          const { data } = await portfolioAPI.sell({ sym, quantity: qty });
          set({ walletBalance: data.walletBalance });
          get().fetchPortfolio();
        } catch (err: any) {
          const msg = err?.response?.data?.error || 'Sell order failed';
          throw new Error(msg);
        }
      },

      // ─── Wallet ─────────────────────────────────────────────
      setWalletBalance: (b) => set({ walletBalance: b }),

      addFunds: async (amount) => {
        const { data } = await walletAPI.addFunds(amount);
        if (data.balance !== undefined) {
          set({ walletBalance: data.balance });
        }
        return data;
      },

      // ─── Wishlist ───────────────────────────────────────────
      addToWishlist: async (stock) => {
        try {
          await wishlistAPI.add({ sym: stock.sym, name: stock.name });
          set((s) => ({
            wishlist: [...s.wishlist, stock],
          }));
        } catch {
          // Optimistically add to local state anyway
          set((s) => ({
            wishlist: s.wishlist.some((w) => w.sym === stock.sym) ? s.wishlist : [...s.wishlist, stock],
          }));
        }
      },

      removeFromWishlist: async (sym) => {
        try {
          await wishlistAPI.remove(sym);
        } catch { }
        set((s) => ({ wishlist: s.wishlist.filter((w) => w.sym !== sym) }));
      },

      // ─── Local portfolio helpers ────────────────────────────
      addToPortfolio: (stock) => set((s) => ({ portfolio: [...s.portfolio, stock] })),
      removeFromPortfolio: (sym) => set((s) => ({ portfolio: s.portfolio.filter((p) => p.sym !== sym) })),
      updatePortfolioStock: (sym, updates) =>
        set((s) => ({
          portfolio: s.portfolio.map((p) => (p.sym === sym ? { ...p, ...updates } : p)),
        })),

      // ─── Alerts ─────────────────────────────────────────────
      addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
      removeAlert: async (id) => {
        try {
          await alertsAPI.remove(id);
        } catch { }
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }));
      },
      createAlert: async (data) => {
        const { data: alert } = await alertsAPI.create(data);
        set((s) => ({
          alerts: [...s.alerts, { ...alert, id: alert._id || alert.id }],
        }));
      },
    }),
    {
      name: 'stockpilot-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isDark: state.isDark,
        walletBalance: state.walletBalance,
        portfolio: state.portfolio,
        wishlist: state.wishlist,
        alerts: state.alerts,
        selectedMarket: state.selectedMarket,
        currency: state.currency,
      }),
    }
  )
);
