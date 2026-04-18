import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, History, Calendar, Trash2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, getNativeCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';

const AlertsPanel = () => {
  const { alerts, removeAlert, currency } = useStore();

  const activeAlerts = alerts.filter(a => !a.triggered).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const triggeredAlerts = alerts.filter(a => a.triggered).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> Price Alerts
        </h1>
        <p className="text-muted-foreground">Manage your active targets and review your triggered price history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Active Targets ({activeAlerts.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {activeAlerts.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-xl bg-secondary/10">
                <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No active price alerts set.</p>
              </div>
            ) : (
              activeAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-card border border-primary/20 shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${alert.type === 'above' ? 'bg-stock-green/10' : 'bg-stock-red/10'}`}>
                      {alert.type === 'above' ? (
                        <ArrowUpRight className="h-5 w-5 text-stock-green" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-stock-red" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg uppercase tracking-tight">{alert.sym}</h3>
                      <p className="text-sm text-muted-foreground">
                        Trigger when price is <span className="font-semibold text-foreground">{alert.type}</span> {formatCurrency(alert.value, getNativeCurrency(alert.sym))}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-stock-red hover:bg-stock-red/10 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Alerts History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" /> Triggered History ({triggeredAlerts.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {triggeredAlerts.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-xl bg-secondary/10">
                <BellOff className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No alerts have hit their targets yet.</p>
              </div>
            ) : (
              triggeredAlerts.slice(0, 10).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-muted/20">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg uppercase text-muted-foreground">{alert.sym}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">TRIGGERED</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hit target of {formatCurrency(alert.value, getNativeCurrency(alert.sym))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-stock-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
            {triggeredAlerts.length > 10 && (
              <p className="text-center text-[10px] text-muted-foreground pt-2">+ {triggeredAlerts.length - 10} more in history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
