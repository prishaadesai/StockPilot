import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { getNativeCurrency, currencySymbol } from '@/lib/currency';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose, defaultSymbol }) => {
  const { createAlert, selectedStock } = useStore();
  const [symbol, setSymbol] = useState(defaultSymbol || selectedStock || '');
  const [type, setType] = useState<'above' | 'below'>('above');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !value) {
      toast.error('Please enter a symbol and price');
      return;
    }

    setLoading(true);
    try {
      await createAlert({
        sym: symbol.toUpperCase(),
        type,
        value: parseFloat(value)
      });
      const symbolPrefix = currencySymbol(getNativeCurrency(symbol));
      toast.success(`Alert set for ${symbol.toUpperCase()} ${type} ${symbolPrefix}${value}`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Create Price Alert</h2>
                  <p className="text-sm text-muted-foreground">Get notified when prices hit your target</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Stock Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AAPL, BTC-USD"
                  className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('above')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === 'above' 
                      ? 'border-stock-green bg-stock-green/10' 
                      : 'border-border bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <TrendingUp className={`h-6 w-6 ${type === 'above' ? 'text-stock-green' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-semibold ${type === 'above' ? 'text-stock-green' : 'text-muted-foreground'}`}>
                    Price Above
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('below')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === 'below' 
                      ? 'border-stock-red bg-stock-red/10' 
                      : 'border-border bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <TrendingDown className={`h-6 w-6 ${type === 'below' ? 'text-stock-red' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-semibold ${type === 'below' ? 'text-stock-red' : 'text-muted-foreground'}`}>
                    Price Below
                  </span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">{currencySymbol(getNativeCurrency(symbol))}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-secondary/30 border border-border rounded-lg pl-8 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Set Alert'}
                </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-3">
                    You'll receive a notification when {symbol || 'the stock'} goes {type} {currencySymbol(getNativeCurrency(symbol))}{value || '0.00'}.
                  </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PriceAlertModal;
