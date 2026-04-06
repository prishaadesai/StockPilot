import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { convertPrice, resolveNativeCurrency, formatCurrency, currencySymbol, getNativeCurrency } from '@/lib/currency';
import { TradeModal } from './TradeModal';
import { useState } from 'react';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(152, 69%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 60%)',
  'hsl(190, 90%, 50%)',
];

/** Classify a portfolio stock into a market category */
function classifyMarket(sym: string, nativeCurrency?: string): 'India' | 'US' | 'Crypto' {
  const upper = sym.toUpperCase();
  if (upper.endsWith('.NS') || upper.endsWith('.BO')) return 'India';
  if (upper.endsWith('-USD')) return 'Crypto';
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT', 'AVAX', 'SHIB', 'MATIC', 'LINK', 'UNI', 'BNB', 'USDT', 'USDC'];
  if (cryptoSymbols.includes(upper)) return 'Crypto';
  if (nativeCurrency === 'INR') return 'India';
  return 'US';
}

/** Get the native currency symbol for display */
function nativeCurrencySymbol(sym: string, nativeCurrency?: string): string {
  const market = classifyMarket(sym, nativeCurrency);
  return market === 'India' ? '₹' : '$';
}

const sectionMeta = [
  { key: 'India' as const, label: '🇮🇳 Indian Market', nativeSym: '₹', gradient: 'from-orange-500/10 to-transparent', borderColor: 'border-l-orange-500' },
  { key: 'US' as const, label: '🇺🇸 US Market', nativeSym: '$', gradient: 'from-blue-500/10 to-transparent', borderColor: 'border-l-blue-500' },
  { key: 'Crypto' as const, label: '🪙 Crypto Market', nativeSym: '$', gradient: 'from-yellow-500/10 to-transparent', borderColor: 'border-l-yellow-500' },
];

const PortfolioPanel = () => {
  const { portfolio, setSelectedStock, currency, exchangeRate } = useStore();
  const { toast } = useToast();
  const [tradeModalConfig, setTradeModalConfig] = useState<{
    isOpen: boolean;
    stock: { sym: string; name: string; currentPrice: number } | null;
  }>({ isOpen: false, stock: null });

  // Summary values use currency toggle
  const totalInvested = portfolio.reduce((s, p) => {
    const nc = resolveNativeCurrency(p.nativeCurrency, p.sym);
    return s + convertPrice(p.avgPrice * p.quantity, nc, currency, exchangeRate);
  }, 0);
  const totalCurrent = portfolio.reduce((s, p) => {
    const nc = resolveNativeCurrency(p.nativeCurrency, p.sym);
    return s + convertPrice(p.currentPrice * p.quantity, nc, currency, exchangeRate);
  }, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Group portfolio by market
  const grouped = useMemo(() => {
    const groups: Record<string, typeof portfolio> = { India: [], US: [], Crypto: [] };
    portfolio.forEach((p) => {
      const market = classifyMarket(p.sym, p.nativeCurrency);
      groups[market].push(p);
    });
    return groups;
  }, [portfolio]);

  const pieData = portfolio.map((p) => ({
    name: p.sym,
    value: convertPrice(p.currentPrice * p.quantity, resolveNativeCurrency(p.nativeCurrency, p.sym), currency, exchangeRate),
  }));

  const barData = portfolio.map((p) => ({
    sym: p.sym,
    pnl: convertPrice((p.currentPrice - p.avgPrice) * p.quantity, resolveNativeCurrency(p.nativeCurrency, p.sym), currency, exchangeRate),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Summary cards — these use currency toggle */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Invested</p>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(totalInvested, currency)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Current Value</p>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(totalCurrent, currency)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total P&L</p>
          <div className="flex items-center gap-1">
            {totalPnL >= 0 ? <TrendingUp className="h-4 w-4 text-stock-green" /> : <TrendingDown className="h-4 w-4 text-stock-red" />}
            <p className={`text-lg font-bold font-mono ${totalPnL >= 0 ? 'text-stock-green' : 'text-stock-red'}`}>
              {totalPnL >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalPnL), currency)} ({totalReturn.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      {portfolio.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No holdings yet</p>
          <p className="text-sm">Browse markets and buy stocks to build your portfolio</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Holdings grouped by market */}
          <div className="col-span-2 space-y-5">
            {sectionMeta.map((section) => {
              const stocks = grouped[section.key];
              if (!stocks || stocks.length === 0) return null;

              // Section P&L in the user's chosen currency
              const sectionInvested = stocks.reduce((s, p) => {
                const nc = resolveNativeCurrency(p.nativeCurrency, p.sym);
                return s + convertPrice(p.avgPrice * p.quantity, nc, currency, exchangeRate);
              }, 0);
              const sectionCurrent = stocks.reduce((s, p) => {
                const nc = resolveNativeCurrency(p.nativeCurrency, p.sym);
                return s + convertPrice(p.currentPrice * p.quantity, nc, currency, exchangeRate);
              }, 0);
              const sectionPnl = sectionCurrent - sectionInvested;
              const sectionUp = sectionPnl >= 0;

              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card rounded-xl border border-border overflow-hidden border-l-4 ${section.borderColor}`}
                >
                  {/* Section header with gradient background */}
                  <div className={`px-4 py-3 border-b border-border flex items-center justify-between bg-gradient-to-r ${section.gradient}`}>
                    <h3 className="text-sm font-bold text-foreground">{section.label}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {stocks.length} stock{stocks.length > 1 ? 's' : ''}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        sectionUp
                          ? 'bg-stock-green/10 text-stock-green'
                          : 'bg-stock-red/10 text-stock-red'
                      }`}>
                        {sectionUp ? '+' : ''}{formatCurrency(sectionPnl, currency)} P&L
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="text-left px-4 py-2">Stock</th>
                          <th className="text-right px-4 py-2">Qty</th>
                          <th className="text-right px-4 py-2">Avg Price (Native)</th>
                          <th className="text-right px-4 py-2">Current (Native)</th>
                          <th className="text-right px-4 py-2">P&L ({currency})</th>
                          <th className="text-right px-4 py-2">Returns</th>
                          <th className="text-right px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((s, i) => {
                          const pnl = (s.currentPrice - s.avgPrice) * s.quantity;
                          const ret = ((s.currentPrice - s.avgPrice) / s.avgPrice) * 100;
                          const up = pnl >= 0;
                          // Stock prices always in their NATIVE currency
                          const cs = nativeCurrencySymbol(s.sym, s.nativeCurrency);
                          return (
                            <motion.tr
                              key={s.sym}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                              onClick={() => setSelectedStock(s.sym)}
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-foreground">{s.sym}</div>
                                <div className="text-xs text-muted-foreground">{s.name}</div>
                              </td>
                              <td className="text-right px-4 py-3 font-mono text-foreground">{s.quantity}</td>
                              <td className="text-right px-4 py-3 font-mono text-foreground">
                                {cs}{s.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-4 py-3 font-mono text-foreground">
                                {cs}{s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`text-right px-4 py-3 font-mono font-semibold ${up ? 'text-stock-green' : 'text-stock-red'}`}>
                                <div className="flex items-center justify-end gap-1">
                                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {formatCurrency(Math.abs(convertPrice(pnl, resolveNativeCurrency(s.nativeCurrency, s.sym), currency, exchangeRate)), currency)}
                                </div>
                              </td>
                              <td className={`text-right px-4 py-3 font-mono text-xs ${up ? 'text-stock-green' : 'text-stock-red'}`}>
                                {up ? '+' : ''}{ret.toFixed(2)}%
                              </td>
                              <td className="text-right px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 bg-stock-red/10 text-stock-red hover:bg-stock-red hover:text-white transition-all border border-stock-red/20 font-bold px-4 rounded-lg"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setTradeModalConfig({
                                      isOpen: true,
                                      stock: { sym: s.sym, name: s.name, currentPrice: s.currentPrice }
                                    }); 
                                  }}
                                >
                                  Sell
                                </Button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right column: charts */}
          <div className="space-y-4">
            {/* Donut chart */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Allocation</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => [formatCurrency(v, currency), 'Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>

            {/* P&L bar chart */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">P&L by Stock</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="sym" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => [formatCurrency(v, currency), 'P&L']}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.pnl >= 0 ? 'hsl(152, 69%, 50%)' : 'hsl(0, 84%, 60%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tradeModalConfig.stock && (
        <TradeModal
          isOpen={tradeModalConfig.isOpen}
          onClose={() => setTradeModalConfig({ ...tradeModalConfig, isOpen: false })}
          type="sell"
          stock={tradeModalConfig.stock}
        />
      )}
    </motion.div>
  );
};

export default PortfolioPanel;
