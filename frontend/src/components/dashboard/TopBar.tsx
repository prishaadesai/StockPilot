import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Moon, Sun, Wallet, LogOut, Search, TrendingUp, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { stockAPI } from '@/lib/api';
import { convertPrice, formatCurrency } from '@/lib/currency';

interface SearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  typeDisp?: string;
  quoteType?: string;
}

interface TickerItem {
  sym: string;
  price: number;
  pct: number;
  market: 'India' | 'US' | 'Crypto';
  currencySymbol: string;
}

const TopBar = () => {
  const { isDark, toggleTheme, walletBalance, user, logout, setSelectedStock, setActiveTab, currency, setCurrency, exchangeRate, alerts } = useStore();
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [indianLive, setIndianLive] = useState(false);
  const [usLive, setUSLive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchMovers = () => {
      stockAPI.movers().then(({ data }) => {
        if (data?.quotes && data.quotes.length > 0) {
          setTickerData(data.quotes.map((d: any) => ({
            sym: d.sym,
            price: d.price ?? 0,
            pct: d.changePct ?? d.change ?? 0,
            market: d.market || 'US',
            currencySymbol: d.currencySymbol || '$',
          })));
          setIndianLive(data.indianLive ?? false);
          setUSLive(data.usLive ?? false);
        } else if (Array.isArray(data) && data.length > 0) {
          // Fallback for old format
          setTickerData(data.map((d: any) => ({
            sym: d.sym,
            price: d.price ?? 0,
            pct: d.changePct ?? d.change ?? 0,
            market: 'US' as const,
            currencySymbol: '$',
          })));
        }
      }).catch(() => {});
    };

    fetchMovers();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMovers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const doSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      stockAPI.search(query).then(({ data }) => {
        const filtered = (data || []).filter(
          (r: any) => r.quoteType === 'EQUITY' || r.quoteType === 'ETF' || r.quoteType === 'CRYPTOCURRENCY' || r.quoteType === 'MUTUALFUND' || r.quoteType === 'INDEX'
        );
        setSearchResults(filtered.slice(0, 8));
        setShowDropdown(true);
        setHighlightIdx(-1);
      }).catch(() => {
        setSearchResults([]);
      }).finally(() => {
        setSearching(false);
      });
    }, 300);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    doSearch(value);
  };

  const selectResult = (result: SearchResult) => {
    setSelectedStock(result.symbol);
    setActiveTab('dashboard'); // Switch to dashboard tab to show the chart
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
    navigate('/dashboard');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectResult(searchResults[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Market status badges
  const marketStatusBadges = () => {
    const badges: { label: string; live: boolean }[] = [];
    badges.push({ label: '🇮🇳 NSE', live: indianLive });
    badges.push({ label: '🇺🇸 NYSE', live: usLive });
    badges.push({ label: '🪙 Crypto', live: true }); // 24/7
    return badges;
  };

  return (
    <div className="border-b border-border bg-card">
      {/* Ticker */}
      <div className="h-8 overflow-hidden bg-ticker-bg border-b border-border relative">
        {/* Market status indicators (right side overlay) */}
        <div className="absolute right-0 top-0 h-full flex items-center gap-1.5 px-3 z-10 bg-gradient-to-l from-[hsl(var(--card))] via-[hsl(var(--card))] to-transparent pl-8">
          {marketStatusBadges().map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                background: b.live ? 'hsl(152, 69%, 50%, 0.15)' : 'hsl(var(--muted) / 0.5)',
                color: b.live ? 'hsl(152, 69%, 50%)' : 'hsl(var(--muted-foreground))',
              }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${b.live ? 'bg-stock-green animate-pulse' : 'bg-muted-foreground'}`}
              />
              {b.label}
            </span>
          ))}
        </div>

        <div className="flex animate-ticker whitespace-nowrap h-full items-center">
          {[...tickerData, ...tickerData].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs font-mono">
              <span className="font-semibold text-foreground">{t.sym}</span>
              <span className="text-muted-foreground">
                {t.currencySymbol}{t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={t.pct >= 0 ? 'text-stock-green' : 'text-stock-red'}>
                {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4 flex-1">
          {/* Search with live dropdown */}
          <div className="relative w-80" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
            )}
            {searchQuery && !searching && (
              <button
                onClick={() => { setSearchQuery(''); setShowDropdown(false); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Input
              ref={inputRef}
              placeholder="Search any stock, ETF, crypto..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9 h-9 bg-secondary/50"
            />

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showDropdown && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="py-1 max-h-[360px] overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={r.symbol}
                        onClick={() => selectResult(r)}
                        onMouseEnter={() => setHighlightIdx(i)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          highlightIdx === i ? 'bg-primary/10' : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{r.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                              {r.typeDisp || r.quoteType || 'Stock'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.shortname || r.longname || r.symbol}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {r.exchDisp || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No results message */}
            <AnimatePresence>
              {showDropdown && searchResults.length === 0 && searchQuery.trim() && !searching && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl p-6 text-center z-50"
                >
                  <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            {time.toLocaleTimeString()}
          </span>

          {/* Currency toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs font-bold gap-1"
            onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')}
          >
            {currency === 'USD' ? '$ USD' : '₹ INR'}
          </Button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold font-mono text-foreground">
              {formatCurrency(convertPrice(walletBalance, 'USD', currency, exchangeRate), currency)}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative"
            onClick={() => setActiveTab('alerts')}
          >
            <Bell className="h-4 w-4 text-foreground" />
            {alerts.filter(a => a.triggered).length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-stock-red text-[8px] font-bold text-white border-2 border-card">
                {alerts.filter(a => a.triggered).length}
              </span>
            )}
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
