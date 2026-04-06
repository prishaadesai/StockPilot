import axios from 'axios';

// ─── Axios instance with base URL and JWT interceptor ───────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('stockpilot-store');
  if (stored) {
    try {
      const state = JSON.parse(stored)?.state;
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {}
  }
  return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stockpilot-store');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ───────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  me: () => api.get('/auth/me'),
};

// ─── Portfolio API ──────────────────────────────────────────────
export const portfolioAPI = {
  get: () => api.get('/portfolio'),

  buy: (data: { sym: string; name: string; quantity: number }) =>
    api.post('/portfolio/buy', data),

  sell: (data: { sym: string; quantity: number }) =>
    api.post('/portfolio/sell', data),

  transactions: () => api.get('/portfolio/transactions'),
};

// ─── Wishlist API ───────────────────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),

  add: (data: { sym: string; name: string }) =>
    api.post('/wishlist', data),

  remove: (sym: string) => api.delete(`/wishlist/${sym}`),
};

// ─── Stock Data API ─────────────────────────────────────────────
export const stockAPI = {
  quote: (sym: string) => api.get(`/stocks/quote/${sym}`),

  history: (sym: string, range: string = '1mo') =>
    api.get(`/stocks/history/${sym}?range=${range}`),

  search: (q: string) => api.get(`/stocks/search?q=${q}`),

  movers: () => api.get('/stocks/movers'),

  exchangeRate: () => api.get('/stocks/exchange-rate'),
};

// ─── Chat API ───────────────────────────────────────────────────
export const chatAPI = {
  send: (message: string, history?: Array<{ role: string; content: string }>, currency?: string, exchangeRate?: number) =>
    api.post('/chat', { message, history, currency, exchangeRate }),
};

// ─── News API ───────────────────────────────────────────────────
export const newsAPI = {
  get: (market: string = 'US') => api.get(`/news?market=${market}`),
};

// ─── Alerts API ─────────────────────────────────────────────────
export const alertsAPI = {
  get: () => api.get('/alerts'),

  create: (data: { sym: string; type: 'above' | 'below' | 'percent'; value: number }) =>
    api.post('/alerts', data),

  remove: (id: string) => api.delete(`/alerts/${id}`),

  notifications: () => api.get('/alerts/notifications'),
};

// ─── Wallet API ─────────────────────────────────────────────────
export const walletAPI = {
  get: () => api.get('/wallet'),
  addFunds: (amount: number) => api.post('/wallet/add-funds', { amount }),
  confirmPayment: (paymentIntentId: string) =>
    api.post('/wallet/confirm-payment', { paymentIntentId }),
};

export default api;
