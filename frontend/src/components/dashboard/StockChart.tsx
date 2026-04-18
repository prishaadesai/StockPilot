import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { generateChartData } from '@/lib/mockData';
import { useStore } from '@/store/useStore';
import { stockAPI } from '@/lib/api';
import { Loader2, Bell } from 'lucide-react';
import { getNativeCurrency, currencySymbol, convertPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { TradeModal } from './TradeModal';
import PriceAlertModal from './PriceAlertModal';

const timeframes = [
  { label: '1D', range: '1d' },
  { label: '5D', range: '5d' },
  { label: '1M', range: '1mo' },
  { label: '3M', range: '3mo' },
  { label: '1Y', range: '1y' },
];

function formatVolume(v: number | undefined): string {
  if (!v) return '-';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toString();
}

function formatMarketCap(v: number | undefined): string {
  if (!v) return '-';
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  return '$' + v.toLocaleString();
}

interface StockDetail {
  sym: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: string;
  marketCap: string;
  pe: string;
}

const StockChart = () => {
  const { selectedStock, currency, exchangeRate } = useStore();
  const [tf, setTf] = useState(2); // default 1M
  const sym = selectedStock || 'AAPL';
  const nativeCur = getNativeCurrency(sym);
  // Higher accuracy symbol check for Indian stocks
  const isIndianValue = sym.toUpperCase().endsWith('.NS') || sym.toUpperCase().endsWith('.BO');
  const cs = isIndianValue ? '₹' : currencySymbol(nativeCur);

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [tradeModalConfig, setTradeModalConfig] = useState<{ isOpen: boolean; type: 'buy' | 'sell' }>({ isOpen: false, type: 'buy' });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuote(true);
    stockAPI.quote(sym).then(({ data }) => {
      if (cancelled) return;
      const q = Array.isArray(data) ? data[0] : data;
      if (q) {
        const rawPrice = q.regularMarketPrice ?? 0;
        const rawChange = q.regularMarketChange ?? 0;
        setDetail({
          sym: q.symbol || sym,
          name: q.shortName || q.longName || sym,
          price: rawPrice,
          change: rawChange,
          changePct: q.regularMarketChangePercent ?? 0,
          open: q.regularMarketOpen ?? 0,
          high: q.regularMarketDayHigh ?? 0,
          low: q.regularMarketDayLow ?? 0,
          volume: formatVolume(q.regularMarketVolume),
          marketCap: formatMarketCap(q.marketCap),
          pe: q.trailingPE ? q.trailingPE.toFixed(1) : '-',
        });
      }
    }).catch(() => {
      if (!cancelled) setDetail(null);
    }).finally(() => {
      if (!cancelled) setLoadingQuote(false);
    });
    return () => { cancelled = true; };
  }, [sym]);

  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    stockAPI.history(sym, timeframes[tf].range).then(({ data }) => {
      if (cancelled) return;
      const quotes = data?.quotes || data || [];
      const mapped = quotes.map((q: any) => ({
        time: q.date || q.time,
        price: q.close ?? q.price ?? 0,
      })).filter((q: any) => q.price > 0);
      setChartData(mapped);
    }).catch(() => {
      const price = detail?.price || 180;
      const days = tf === 0 ? 1 : tf === 1 ? 5 : tf === 2 ? 30 : tf === 3 ? 90 : 365;
      if (!cancelled) setChartData(generateChartData(days, price));
    }).finally(() => {
      if (!cancelled) setLoadingChart(false);
    });
    return () => { cancelled = true; };
  }, [tf, sym]);

  const isUp = detail ? detail.change >= 0 : true;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return tf === 0
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5"
    >
      {/* Header */}
      {loadingQuote && !detail ? (
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading {sym}...</span>
        </div>
      ) : detail ? (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{detail.sym}</h2>
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[160px]">{detail.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {cs}{detail.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-sm font-semibold ${isUp ? 'text-stock-green' : 'text-stock-red'}`}>
                {isUp ? '+' : ''}{detail.change.toFixed(2)} ({isUp ? '+' : ''}{detail.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Open</span> <span className="font-mono text-foreground ml-1">{detail.open.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">High</span> <span className="font-mono text-foreground ml-1">{detail.high.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Low</span> <span className="font-mono text-foreground ml-1">{detail.low.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Vol</span> <span className="font-mono text-foreground ml-1">{detail.volume}</span></div>
            <div><span className="text-muted-foreground">MCap</span> <span className="font-mono text-foreground ml-1">{detail.marketCap}</span></div>
            <div><span className="text-muted-foreground">P/E</span> <span className="font-mono text-foreground ml-1">{detail.pe}</span></div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">{sym}</h2>
          <p className="text-sm text-muted-foreground mt-1">Could not load quote data</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-1 bg-secondary/30 p-1 rounded-lg overflow-x-auto">
          {timeframes.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTf(i)}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                tf === i ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1 text-xs text-muted-foreground border-border/50 bg-secondary/30 hover:bg-secondary px-2"
            onClick={() => setIsAlertModalOpen(true)}
          >
            <Bell className="h-3 w-3" />
            <span className="hidden sm:inline">Alert</span>
          </Button>
          <Button 
            size="sm" 
            className="h-8 text-xs bg-stock-red hover:bg-stock-red/90 text-white border-0 shadow-lg shadow-stock-red/20 transition-all active:scale-95 px-3 font-bold rounded-lg"
            onClick={() => { if (detail) setTradeModalConfig({ isOpen: true, type: 'sell' }); }}
          >
            Sell
          </Button>
          <Button 
            size="sm" 
            className="h-8 text-xs bg-stock-green hover:bg-stock-green/90 text-white border-0 px-3"
            onClick={() => { if (detail) setTradeModalConfig({ isOpen: true, type: 'buy' }); }}
          >
            Buy
          </Button>
        </div>
      </div>

      <div className="h-[320px] relative">
        {loadingChart && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 69%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(152, 69%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tickFormatter={formatDate} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${cs}${v.toFixed(0)}`} width={60} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelFormatter={formatDate} formatter={(value: number) => [`${cs}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Price']} />
            <Area type="monotone" dataKey="price" stroke={isUp ? 'hsl(152, 69%, 50%)' : 'hsl(0, 84%, 60%)'} strokeWidth={2} fill={isUp ? 'url(#green-grad)' : 'url(#red-grad)'} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {detail && (
        <TradeModal 
          isOpen={tradeModalConfig.isOpen}
          onClose={() => setTradeModalConfig({ ...tradeModalConfig, isOpen: false })}
          type={tradeModalConfig.type}
          stock={{ sym: sym, name: detail.name, currentPrice: detail.price }}
        />
      )}

      <PriceAlertModal 
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        defaultSymbol={sym}
      />
    </motion.div>
  );
};

export default StockChart;
