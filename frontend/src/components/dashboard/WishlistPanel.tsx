import { motion } from 'framer-motion';
import { Heart, ShoppingCart, X, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { generateChartData } from '@/lib/mockData';
import { convertPrice, resolveNativeCurrency, formatCurrency } from '@/lib/currency';
import { TradeModal } from './TradeModal';
import { useState } from 'react';

const WishlistPanel = () => {
  const { wishlist, removeFromWishlist, currency, exchangeRate, setSelectedStock } = useStore();
  
  const [tradeModalConfig, setTradeModalConfig] = useState<{
    isOpen: boolean;
    stock: { sym: string; name: string; currentPrice: number } | null;
  }>({ isOpen: false, stock: null });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-stock-red" /> Wishlist
        </h2>
        <span className="text-sm text-muted-foreground">{wishlist.length} stocks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((stock, i) => {
          const sparkData = generateChartData(30, stock.currentPrice, 0.015);
          const up = stock.change >= 0;

          return (
            <motion.div
              key={stock.sym}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedStock(stock.sym)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{stock.sym}</h3>
                  <p className="text-xs text-muted-foreground">{stock.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWishlist(stock.sym); }}
                  className="text-muted-foreground hover:text-stock-red transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mini sparkline */}
              <div className="h-12 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id={`spark-${stock.sym}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? 'hsl(152,69%,50%)' : 'hsl(0,84%,60%)'} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={up ? 'hsl(152,69%,50%)' : 'hsl(0,84%,60%)'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={up ? 'hsl(152,69%,50%)' : 'hsl(0,84%,60%)'}
                      strokeWidth={1.5}
                      fill={`url(#spark-${stock.sym})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(convertPrice(stock.currentPrice, resolveNativeCurrency(undefined, stock.sym), currency, exchangeRate), currency)}</p>
                  <p className={`text-xs font-semibold flex items-center gap-0.5 ${up ? 'text-stock-green' : 'text-stock-red'}`}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTradeModalConfig({
                      isOpen: true,
                      stock: { sym: stock.sym, name: stock.name, currentPrice: stock.currentPrice }
                    });
                  }}
                >
                  <ShoppingCart className="h-3 w-3" /> Buy
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {wishlist.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Your wishlist is empty</p>
          <p className="text-sm">Browse markets to add stocks you're interested in</p>
        </div>
      )}

      {tradeModalConfig.stock && (
        <TradeModal
          isOpen={tradeModalConfig.isOpen}
          onClose={() => setTradeModalConfig({ ...tradeModalConfig, isOpen: false })}
          type="buy"
          stock={tradeModalConfig.stock}
          onSuccess={() => {
            if (tradeModalConfig.stock) {
              removeFromWishlist(tradeModalConfig.stock.sym);
            }
          }}
        />
      )}
    </motion.div>
  );
};

export default WishlistPanel;
