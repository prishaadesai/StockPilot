/**
 * Currency conversion utilities for StockPilot
 * 
 * Rules:
 * - Indian stocks (.NS, .BO suffixes) → native INR
 * - US stocks (AAPL, MSFT, etc.) → native USD
 * - Crypto (-USD suffix) → native USD
 * - Wallet balance is always stored in USD in the backend
 */

export type CurrencyCode = 'USD' | 'INR';

/** Determine native currency of a stock by its symbol */
export function getNativeCurrency(symbol: string): CurrencyCode {
  if (!symbol) return 'USD';
  const upper = symbol.toUpperCase();
  if (upper.endsWith('.NS') || upper.endsWith('.BO')) return 'INR';
  return 'USD';
}

/** Determine native currency from backend-provided field, or fall back to symbol heuristic */
export function resolveNativeCurrency(nativeCurrency?: string, symbol?: string): CurrencyCode {
  if (nativeCurrency === 'INR') return 'INR';
  if (nativeCurrency === 'USD') return 'USD';
  if (symbol) return getNativeCurrency(symbol);
  return 'USD';
}

/**
 * Convert a price from its native currency to the display currency.
 * @param value        – the raw price
 * @param native       – 'USD' | 'INR' — what currency the value is natively in
 * @param display      – 'USD' | 'INR' — what the user wants to see
 * @param usdToInr     – the live USD → INR exchange rate
 */
export function convertPrice(
  value: number,
  native: CurrencyCode,
  display: CurrencyCode,
  usdToInr: number
): number {
  if (native === display) return value;
  if (native === 'USD' && display === 'INR') return value * usdToInr;
  if (native === 'INR' && display === 'USD') return value / usdToInr;
  return value;
}

/** Get the display symbol for a currency code */
export function currencySymbol(code: CurrencyCode): string {
  return code === 'INR' ? '₹' : '$';
}

/** Format a number with the correct currency symbol */
export function formatCurrency(
  value: number,
  display: CurrencyCode,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const sym = currencySymbol(display);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: opts?.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  });
  return `${sym}${formatted}`;
}
