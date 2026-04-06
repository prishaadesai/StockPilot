import Alert from '../models/Alert.js';
import yahooFinance from './yahooFinance.js';

/**
 * The Stock Alert Engine
 * Periodically checks untriggered alerts against live market prices.
 */
export const checkAlerts = async () => {
  try {
    // 1. Fetch all untriggered alerts
    const alerts = await Alert.find({ triggered: false });
    if (alerts.length === 0) return;

    // 2. Group by symbols for batch fetching
    const symbols = [...new Set(alerts.map(a => a.sym))];
    
    // 3. Fetch current quotes
    const quotes = await yahooFinance.quote(symbols);
    const quoteMap = {};
    
    // Handle both array and single object responses from yahoo-finance2
    const quoteList = Array.isArray(quotes) ? quotes : [quotes];
    quoteList.forEach(q => {
      if (q && q.symbol) {
        quoteMap[q.symbol] = q.regularMarketPrice;
      }
    });

    // 4. Evaluate each alert
    for (const alert of alerts) {
      const currentPrice = quoteMap[alert.sym];
      if (currentPrice === undefined) continue;

      let isTriggered = false;
      if (alert.type === 'above' && currentPrice >= alert.value) {
        isTriggered = true;
      } else if (alert.type === 'below' && currentPrice <= alert.value) {
        isTriggered = true;
      }

      if (isTriggered) {
        console.log(`🎯 ALERT TRIGGERED: ${alert.sym} hit ${currentPrice} (Target: ${alert.value})`);
        alert.triggered = true;
        // Optimization: Mark the timestamp it was triggered for the "History" and "New Notification" feature
        // We'll use the built-in 'updatedAt' from timestamps: true for now.
        await alert.save();
      }
    }
  } catch (error) {
    console.error('Alert Engine Error:', error.message);
  }
};

/**
 * Starts the alert engine interval
 * @param {number} intervalMs - Default 60 seconds
 */
export const startAlertEngine = (intervalMs = 60000) => {
  console.log(`🚀 [Alert Engine] Started. Monitoring every ${intervalMs / 1000}s...`);
  // Run immediately then start interval
  checkAlerts();
  setInterval(checkAlerts, intervalMs);
};
