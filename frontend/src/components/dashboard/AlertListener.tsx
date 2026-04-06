import { useEffect, useRef } from 'react';
import { alertsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { BellRing } from 'lucide-react';
import { getNativeCurrency, currencySymbol } from '@/lib/currency';

const AlertListener = () => {
  const { user, fetchAlerts } = useStore();
  const lastTriggeredIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const { data: notifications } = await alertsAPI.notifications();
        
        if (notifications && notifications.length > 0) {
          notifications.forEach((alert: any) => {
            const id = alert._id || alert.id;
            // Only toast if we haven't toasted it in this session already
            if (!lastTriggeredIds.current.has(id)) {
              const symbolPrefix = currencySymbol(getNativeCurrency(alert.sym));
              toast.success(`🎯 Price Alert: ${alert.sym} is now ${alert.type} ${symbolPrefix}${alert.value}!`, {
                description: `Check your alerts history for details.`,
                icon: <BellRing className="h-5 w-5 text-primary" />,
                duration: 8000,
              });
              lastTriggeredIds.current.add(id);
              // Refresh the alerts list to show it's triggered
              fetchAlerts();
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch alert notifications:', err);
      }
    };

    // Poll every 30 seconds for notifications
    const interval = setInterval(checkNotifications, 30000);
    // Also check immediately
    checkNotifications();

    return () => clearInterval(interval);
  }, [user, fetchAlerts]);

  return null; // This component has no UI
};

export default AlertListener;
