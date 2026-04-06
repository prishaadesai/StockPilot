import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNativeCurrency, formatCurrency, currencySymbol, convertPrice } from '@/lib/currency';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  stock: {
    sym: string;
    name: string;
    currentPrice: number;
  };
  onSuccess?: () => void;
}

export const TradeModal = ({ isOpen, onClose, type, stock, onSuccess }: TradeModalProps) => {
  const { buyStock, sellStock, portfolio, walletBalance, currency, exchangeRate } = useStore();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity('1');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nativeCur = getNativeCurrency(stock.sym);
  const cs = currencySymbol(nativeCur);
  
  const qty = parseInt(quantity) || 0;
  const totalValue = qty * stock.currentPrice;

  // Find if user already owns this stock
  const holding = portfolio.find(p => p.sym === stock.sym);
  const holdingQty = holding?.quantity || 0;
  const holdingAvg = holding?.avgPrice || 0;

  // Estimated P&L calculation for selling
  const isBuy = type === 'buy';
  const estimatedPnL = (stock.currentPrice - holdingAvg) * qty;
  const isProfit = estimatedPnL >= 0;

  // Wallet balance is in the user's selected currency. Convert totalValue to compare.
  const costInWallerCurrency = convertPrice(totalValue, nativeCur, currency, exchangeRate);
  const isInsufficientFunds = isBuy && costInWallerCurrency > walletBalance;

  const handleConfirm = async () => {
    if (qty <= 0) {
      toast({ title: 'Invalid quantity', description: 'Please enter a valid amount.', variant: 'destructive' });
      return;
    }

    if (type === 'sell' && qty > holdingQty) {
      toast({ title: 'Insufficient holding', description: `You only own ${holdingQty} shares of ${stock.sym}.`, variant: 'destructive' });
      return;
    }

    if (isInsufficientFunds) {
      toast({ title: 'Insufficient funds', description: 'Your wallet balance is too low.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === 'buy') {
        await buyStock(stock.sym, stock.name, stock.currentPrice, qty);
        toast({ title: 'Order Filled', description: `Successfully bought ${qty} shares of ${stock.sym}` });
      } else {
        await sellStock(stock.sym, qty, stock.currentPrice);
        toast({ title: 'Order Filled', description: `Successfully sold ${qty} shares of ${stock.sym}` });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: 'Order Failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm overflow-hidden bg-card border border-border shadow-2xl rounded-2xl"
        >
          {/* Header */}
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${isBuy ? 'bg-stock-green' : 'bg-stock-red'}`} />
              <h2 className="text-xl font-bold text-foreground">
                {isBuy ? 'Buy Order' : 'Sell Order'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isBuy ? 'Add to your portfolio' : 'Remove from portfolio'}
            </p>
          </div>

          <div className="p-5 space-y-6">
            {/* Stock Identifier Box */}
            <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{stock.sym}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Market Price</p>
                <p className="font-mono font-bold text-foreground">
                  {cs}{stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                <Input 
                  type="number" 
                  min="1" 
                  max={isBuy ? undefined : holdingQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11 font-mono text-lg bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-medium text-muted-foreground">Price (Market)</label>
                <Input 
                  type="text" 
                  readOnly 
                  value={`${cs}${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  className="h-11 font-mono text-lg bg-secondary/30 border-transparent cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-4 space-y-3 bg-secondary/20 rounded-xl border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Value</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {cs}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              {isBuy && isInsufficientFunds && (
                <div className="mt-2 text-xs text-stock-red bg-stock-red/10 p-2 rounded-lg border border-stock-red/20">
                  <p>Insufficient funds. You need {formatCurrency(costInWallerCurrency, currency)} but only have {formatCurrency(currency === 'INR' ? walletBalance * exchangeRate : walletBalance, currency)}.</p>
                </div>
              )}
              
              {!isBuy && holdingQty > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border/30 gap-4">
                  <span className="text-sm text-muted-foreground">Est. P&L</span>
                  <span className={`font-mono text-sm font-bold ${isProfit ? 'text-stock-green' : 'text-stock-red'}`}>
                    {isProfit ? '+' : ''}{cs}{estimatedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {!isBuy && holdingQty === 0 && (
                <p className="text-xs text-stock-red mt-2">You don't own any shares to sell.</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 p-5 pt-0">
            <Button 
              variant="outline" 
              className="flex-1 h-11 border-border/50 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className={`flex-1 h-11 text-white border-0 shadow-xl transition-all active:scale-95 font-bold tracking-tight rounded-xl ${
                isBuy 
                  ? 'bg-stock-green hover:bg-stock-green/90 shadow-stock-green/20' 
                  : 'bg-stock-red hover:bg-stock-red/90 shadow-stock-red/20'
              }`}
              onClick={handleConfirm}
              disabled={isSubmitting || qty <= 0 || (!isBuy && holdingQty < qty) || isInsufficientFunds}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                isBuy ? 'Confirm Buy Order' : 'Confirm Sell Order'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
