import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useStore } from '@/store/useStore';
import { generateChartData } from '@/lib/mockData';
import StockChart from './StockChart';
import { stockAPI } from '@/lib/api';
import { convertPrice, resolveNativeCurrency, formatCurrency, currencySymbol } from '@/lib/currency';

const DashboardHome = () => {
  const { portfolio, walletBalance, wishlist, currency, exchangeRate } = useStore();

  // Convert each stock's value to the user's display currency
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

  // Wallet is always stored in USD on the backend
  const displayWallet = convertPrice(walletBalance, 'USD', currency, exchangeRate);

  const [portfolioGrowth, setPortfolioGrowth] = useState<any[]>([]);

  useEffect(() => {
    if (totalCurrent === 0) {
      setPortfolioGrowth(generateChartData(90, 10000, 0.008));
      return;
    }
    
    stockAPI.history('SPY', '3mo').then(({ data }) => {
      const quotes = data?.quotes || data || [];
      if (quotes.length > 0) {
        const mapped = quotes.map((q: any) => ({
          time: q.date || q.time,
          price: q.close ?? q.price ?? 0,
        })).filter((q: any) => q.price > 0);
        if (mapped.length > 0) {
          const spyLatest = mapped[mapped.length - 1].price || 1;
          const ratio = totalCurrent / spyLatest;
          setPortfolioGrowth(mapped.map((d: any) => ({
            time: d.time,
            price: d.price * ratio
          })));
        }
      }
    }).catch(() => {
      setPortfolioGrowth(generateChartData(90, totalCurrent * 0.85, 0.008));
    });
  }, [totalCurrent]);

  const cs = currencySymbol(currency);
  const stats = [
    { label: 'Portfolio Value', value: formatCurrency(totalCurrent, currency), icon: Briefcase, change: totalReturn, color: 'text-primary' },
    { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : '-'}${formatCurrency(Math.abs(totalPnL), currency)}`, icon: totalPnL >= 0 ? TrendingUp : TrendingDown, change: totalReturn, color: totalPnL >= 0 ? 'text-stock-green' : 'text-stock-red' },
    { label: 'Wallet Balance', value: formatCurrency(displayWallet, currency), icon: DollarSign, change: 0, color: 'text-primary' },
    { label: 'Active Positions', value: portfolio.length.toString(), icon: BarChart3, change: 0, color: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
            {s.change !== 0 && (
              <p className={`text-xs font-semibold mt-1 ${s.change >= 0 ? 'text-stock-green' : 'text-stock-red'}`}>
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Main chart */}
      <StockChart />

      {/* Portfolio growth */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Portfolio Growth (3M)</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioGrowth}>
              <defs>
                <linearGradient id="growth-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={(v) => new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${cs}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [formatCurrency(v, currency), 'Value']}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="price" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#growth-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
