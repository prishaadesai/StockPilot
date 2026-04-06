import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateChartData } from '@/lib/mockData';
import { stockAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';

const marketSymbols: Record<string, Array<{ qs: string; display: string; name: string }>> = {
  India: [
    { qs: 'RELIANCE.NS', display: 'RELIANCE', name: 'Reliance Industries' },
    { qs: 'TCS.NS', display: 'TCS', name: 'Tata Consultancy Services' },
    { qs: 'INFY.NS', display: 'INFY', name: 'Infosys Ltd.' },
    { qs: 'HDFCBANK.NS', display: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
    { qs: 'ICICIBANK.NS', display: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
    { qs: 'HINDUNILVR.NS', display: 'HINDUNILVR', name: 'Hindustan Unilever' },
    { qs: 'ITC.NS', display: 'ITC', name: 'ITC Limited' },
    { qs: 'SBIN.NS', display: 'SBIN', name: 'State Bank of India' },
    { qs: 'BHARTIARTL.NS', display: 'BHARTIARTL', name: 'Bharti Airtel' },
    { qs: 'KOTAKBANK.NS', display: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { qs: 'LT.NS', display: 'LT', name: 'Larsen & Toubro' },
    { qs: 'HCLTECH.NS', display: 'HCLTECH', name: 'HCL Technologies' },
    { qs: 'AXISBANK.NS', display: 'AXISBANK', name: 'Axis Bank Ltd.' },
    { qs: 'WIPRO.NS', display: 'WIPRO', name: 'Wipro Ltd.' },
    { qs: 'BAJFINANCE.NS', display: 'BAJFINANCE', name: 'Bajaj Finance' },
    { qs: 'MARUTI.NS', display: 'MARUTI', name: 'Maruti Suzuki' },
    { qs: 'TATAMOTORS.NS', display: 'TATAMOTORS', name: 'Tata Motors' },
    { qs: 'SUNPHARMA.NS', display: 'SUNPHARMA', name: 'Sun Pharma' },
    { qs: 'TITAN.NS', display: 'TITAN', name: 'Titan Company' },
    { qs: 'ADANIENT.NS', display: 'ADANIENT', name: 'Adani Enterprises' },
    { qs: 'POWERGRID.NS', display: 'POWERGRID', name: 'Power Grid Corp' },
    { qs: 'NTPC.NS', display: 'NTPC', name: 'NTPC Limited' },
    { qs: 'TATASTEEL.NS', display: 'TATASTEEL', name: 'Tata Steel' },
    { qs: 'ONGC.NS', display: 'ONGC', name: 'Oil & Natural Gas Corp' },
  ],
  US: [
    { qs: 'AAPL', display: 'AAPL', name: 'Apple Inc.' },
    { qs: 'GOOGL', display: 'GOOGL', name: 'Alphabet Inc.' },
    { qs: 'MSFT', display: 'MSFT', name: 'Microsoft Corp.' },
    { qs: 'TSLA', display: 'TSLA', name: 'Tesla Inc.' },
    { qs: 'AMZN', display: 'AMZN', name: 'Amazon.com Inc.' },
    { qs: 'NVDA', display: 'NVDA', name: 'NVIDIA Corp.' },
    { qs: 'META', display: 'META', name: 'Meta Platforms' },
    { qs: 'NFLX', display: 'NFLX', name: 'Netflix Inc.' },
    { qs: 'AMD', display: 'AMD', name: 'Advanced Micro Devices' },
    { qs: 'CRM', display: 'CRM', name: 'Salesforce Inc.' },
    { qs: 'ORCL', display: 'ORCL', name: 'Oracle Corp.' },
    { qs: 'INTC', display: 'INTC', name: 'Intel Corp.' },
    { qs: 'CSCO', display: 'CSCO', name: 'Cisco Systems' },
    { qs: 'ADBE', display: 'ADBE', name: 'Adobe Inc.' },
    { qs: 'PEP', display: 'PEP', name: 'PepsiCo Inc.' },
    { qs: 'KO', display: 'KO', name: 'Coca-Cola Co.' },
    { qs: 'DIS', display: 'DIS', name: 'Walt Disney Co.' },
    { qs: 'BA', display: 'BA', name: 'Boeing Co.' },
    { qs: 'JPM', display: 'JPM', name: 'JPMorgan Chase' },
    { qs: 'V', display: 'V', name: 'Visa Inc.' },
    { qs: 'MA', display: 'MA', name: 'Mastercard Inc.' },
    { qs: 'WMT', display: 'WMT', name: 'Walmart Inc.' },
    { qs: 'JNJ', display: 'JNJ', name: 'Johnson & Johnson' },
    { qs: 'UNH', display: 'UNH', name: 'UnitedHealth Group' },
  ],
  Crypto: [
    { qs: 'BTC-USD', display: 'BTC', name: 'Bitcoin' },
    { qs: 'ETH-USD', display: 'ETH', name: 'Ethereum' },
    { qs: 'SOL-USD', display: 'SOL', name: 'Solana' },
    { qs: 'ADA-USD', display: 'ADA', name: 'Cardano' },
    { qs: 'XRP-USD', display: 'XRP', name: 'Ripple' },
    { qs: 'DOGE-USD', display: 'DOGE', name: 'Dogecoin' },
    { qs: 'DOT-USD', display: 'DOT', name: 'Polkadot' },
    { qs: 'AVAX-USD', display: 'AVAX', name: 'Avalanche' },
    { qs: 'SHIB-USD', display: 'SHIB', name: 'Shiba Inu' },
    { qs: 'MATIC-USD', display: 'MATIC', name: 'Polygon' },
    { qs: 'LINK-USD', display: 'LINK', name: 'Chainlink' },
    { qs: 'UNI-USD', display: 'UNI', name: 'Uniswap' },
  ],
};

const marketMeta: Record<string, { label: string; currency: string }> = {
  India: { label: '🇮🇳 India Market (NSE/BSE)', currency: '₹' },
  US: { label: '🇺🇸 US Market (NASDAQ/NYSE)', currency: '$' },
  Crypto: { label: '🪙 Crypto Market', currency: '$' },
};

const marketOrder = ['India', 'US', 'Crypto'] as const;

type MarketFilter = 'India' | 'US' | 'Crypto';

const filterOptions: { id: MarketFilter; label: string }[] = [
  { id: 'India', label: '🇮🇳 India' },
  { id: 'US', label: '🇺🇸 US' },
  { id: 'Crypto', label: '🪙 Crypto' },
];

const MarketsPanel = () => {
  const { setSelectedStock, addToWishlist, wishlist, setActiveTab } = useStore();
  const [liveData, setLiveData] = useState<Record<string, any[]>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('India');

  // Fetch quotes for whichever markets are visible
  useEffect(() => {
    const marketsToFetch = [marketFilter];
    marketsToFetch.forEach((mk) => {
      if (liveData[mk]?.length) return; // already fetched
      const syms = marketSymbols[mk]?.map(s => s.qs).join(',');
      if (syms) {
        stockAPI.quote(syms).then(({ data }) => {
          setLiveData(prev => ({ ...prev, [mk]: Array.isArray(data) ? data : [data] }));
        }).catch(() => {});
      }
    });
  }, [marketFilter]);

  const handleStockClick = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('dashboard');
  };

  const visibleMarkets = [marketFilter];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Market filter + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMarketFilter(opt.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                marketFilter === opt.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${marketFilter} stocks...`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 h-9 bg-secondary/50"
          />
        </div>
      </div>

      {visibleMarkets.map((marketKey) => {
        const meta = marketMeta[marketKey];
        const definitions = marketSymbols[marketKey] || [];
        const quotes = liveData[marketKey] || [];

        const filtered = searchFilter.trim()
          ? definitions.filter(
              (d) =>
                d.display.toLowerCase().includes(searchFilter.toLowerCase()) ||
                d.name.toLowerCase().includes(searchFilter.toLowerCase())
            )
          : definitions;

        if (filtered.length === 0) return null;

        return (
          <div key={marketKey}>
            <h2 className="text-lg font-bold text-foreground mb-3">{meta?.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filtered.map((def, i) => {
                const quoteInfo = quotes.find((q: any) => q.symbol === def.qs);
                const price = quoteInfo?.regularMarketPrice ?? 0;
                const changePct = quoteInfo?.regularMarketChangePercent ?? 0;
                const change = quoteInfo?.regularMarketChange ?? 0;
                const up = change >= 0;
                const sparkData = generateChartData(7, price || 100, 0.01);
                const inWishlist = wishlist.some((w) => w.sym === def.display);

                return (
                  <motion.div
                    key={def.display}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5"
                    onClick={() => handleStockClick(def.qs)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{def.display}</h3>
                        <p className="text-xs text-muted-foreground">{def.name}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!inWishlist)
                            addToWishlist({
                              sym: def.display,
                              name: def.name,
                              currentPrice: price,
                              change: change,
                              changePercent: changePct,
                            });
                        }}
                        className={inWishlist ? 'text-stock-red' : 'text-muted-foreground hover:text-stock-red'}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="h-10 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={up ? 'hsl(152,69%,50%)' : 'hsl(0,84%,60%)'}
                            strokeWidth={1.5}
                            fill="transparent"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold font-mono text-foreground">
                        {price > 0
                          ? `${meta?.currency}${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : 'Loading...'}
                      </span>
                      <span
                        className={`text-xs font-semibold flex items-center gap-0.5 ${
                          up ? 'text-stock-green' : 'text-stock-red'
                        }`}
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? '+' : ''}
                        {changePct.toFixed(2)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default MarketsPanel;
