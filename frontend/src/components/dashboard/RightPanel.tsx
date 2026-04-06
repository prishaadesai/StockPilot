import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Newspaper, Bell, BellOff, Plus, Heart, Trash2 } from 'lucide-react';
import { topMovers as defaultMovers, newsItems as defaultNews } from '@/lib/mockData';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { stockAPI, newsAPI } from '@/lib/api';
import PriceAlertModal from './PriceAlertModal';

const RightPanel = () => {
  const { selectedMarket, setSelectedStock, setActiveTab, addToWishlist, wishlist, alerts, removeAlert } = useStore();
  const [movers, setMovers] = useState<Array<{ sym: string; name: string; price: number; change: number; currencySymbol: string }>>(
    defaultMovers.map(m => ({ ...m, currencySymbol: '$' }))
  );
  const [news, setNews] = useState(defaultNews);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Fetch live movers
  useEffect(() => {
    stockAPI.movers().then(({ data }) => {
      if (data?.quotes && data.quotes.length > 0) {
        setMovers(data.quotes.slice(0, 8).map((d: any) => ({
          sym: d.sym,
          name: d.name || d.sym,
          price: d.price ?? 0,
          change: d.changePct ?? d.change ?? 0,
          currencySymbol: d.currencySymbol || '$',
        })));
      } else if (Array.isArray(data) && data.length > 0) {
        setMovers(data.slice(0, 8).map((d: any) => ({
          sym: d.sym,
          name: d.name || d.sym,
          price: d.price ?? 0,
          change: d.changePct ?? d.change ?? 0,
          currencySymbol: '$',
        })));
      }
    }).catch(() => { /* keep defaults */ });
  }, []);

  // Fetch news by market
  useEffect(() => {
    newsAPI.get(selectedMarket).then(({ data }) => {
      if (data && data.length > 0) {
        setNews(data);
      }
    }).catch(() => { /* keep defaults */ });
  }, [selectedMarket]);

  const filteredNews = news.filter((n: any) =>
    n.category === selectedMarket || !n.category
  );

  const handleMoverClick = (sym: string) => {
    setSelectedStock(sym);
    setActiveTab('dashboard');
  };

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto h-full p-4 space-y-6">
      {/* Top Movers */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" /> Top Movers
        </h3>
        <div className="space-y-2">
          {movers.map((m, i) => {
            const up = m.change >= 0;
            const inWishlist = wishlist.some((w) => w.sym === m.sym);
            return (
              <motion.div
                key={m.sym + i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleMoverClick(m.sym)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{m.sym}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {m.currencySymbol}{m.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${up ? 'text-stock-green' : 'text-stock-red'}`}>
                    {up ? '+' : ''}{m.change.toFixed(2)}%
                  </span>
                  {!inWishlist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWishlist({ sym: m.sym, name: m.name, currentPrice: m.price, change: m.change, changePercent: m.change });
                      }}
                      className="text-muted-foreground hover:text-stock-red transition-colors"
                    >
                      <Heart className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Alerts Section (Moved up for visibility) */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Price Alerts
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-primary/20 transition-all"
            onClick={() => setIsAlertModalOpen(true)}
          >
            <Plus className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-xl">
              <p className="text-[10px] text-muted-foreground">No active alerts</p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-[10px] h-auto p-0 mt-1" 
                onClick={() => setIsAlertModalOpen(true)}
              >
                Set your first alert
              </Button>
            </div>
          ) : (
            [...alerts].reverse().map((alert) => (
              <div 
                key={alert.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all group ${
                  alert.triggered 
                    ? 'bg-secondary/20 border-border/50 opacity-60' 
                    : 'bg-primary/5 border-primary/20 shadow-sm'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-tight">{alert.sym}</span>
                    {alert.triggered ? (
                      <BellOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Bell className="h-3 w-3 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase font-medium">Hits</span>
                    <span className={`text-[10px] font-bold ${alert.type === 'above' ? 'text-stock-green' : 'text-stock-red'}`}>
                      {alert.type === 'above' ? '≥' : '≤'} ${alert.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="text-muted-foreground hover:text-stock-red p-1.5 rounded-lg hover:bg-stock-red/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* News Section Removed (Now in Dedicated News Hub) */}

      <PriceAlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
      />
    </div>
  );
};

export default RightPanel;
