import express from 'express';
import yahooFinance from '../lib/yahooFinance.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
 
// Helper to normalize symbols (e.g., RELIANCE -> RELIANCE.NS)
async function tryNormalize(sym) {
  if (sym.includes('.') || sym.includes('-') || sym.length < 3) return sym;
  try {
    // If it's a common Indian ticker pattern (4-10 chars), try .NS first
    if (sym.length >= 4 && sym.length <= 10) {
      const testSym = `${sym.toUpperCase()}.NS`;
      const q = await yahooFinance.quote(testSym, {}, { validateResult: false, validateOptions: false });
      if (q && q.regularMarketPrice) return testSym;
    }
  } catch (e) { /* ignore and return original */ }
  return sym;
}

// @route   GET /api/stocks/quote/:sym
router.get('/quote/:sym', protect, async (req, res) => {
  try {
    const rawSyms = req.params.sym.split(',');
    const syms = await Promise.all(rawSyms.map(s => tryNormalize(s)));
    
    const quotes = await yahooFinance.quote(
      syms.length === 1 ? syms[0] : syms, 
      {}, 
      { validateResult: false, validateOptions: false }
    );
    res.json(quotes);
  } catch (error) {
    console.error(`Quote failed for ${req.params.sym}:`, error);
    res.status(500).json({ error: 'Failed to fetch quote', details: error.message });
  }
});

// @route   GET /api/stocks/history/:sym?range=1mo
router.get('/history/:sym', protect, async (req, res) => {
  const sym = await tryNormalize(req.params.sym);
  const { range } = req.query; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
  let interval = '1d';
  if (range === '1d' || range === '5d') interval = '15m';

  const queryOptions = { period1: '2023-01-01', interval: interval };
  
  // Custom period calculation logic based on range
  const now = new Date();
  if (range === '1d') {
    now.setDate(now.getDate() - 2);
    queryOptions.period1 = now.toISOString().split('T')[0];
  } else if (range === '5d') {
    now.setDate(now.getDate() - 7);
    queryOptions.period1 = now.toISOString().split('T')[0];
  } else if (range === '1mo') {
    now.setMonth(now.getMonth() - 1);
    queryOptions.period1 = now.toISOString().split('T')[0];
  } else if (range === '3mo') {
    now.setMonth(now.getMonth() - 3);
    queryOptions.period1 = now.toISOString().split('T')[0];
  } else if (range === '6mo') {
    now.setMonth(now.getMonth() - 6);
    queryOptions.period1 = now.toISOString().split('T')[0];
  } else if (range === '1y') {
    now.setFullYear(now.getFullYear() - 1);
    queryOptions.period1 = now.toISOString().split('T')[0];
  }

  try {
    const result = await yahooFinance.chart(
      sym, 
      queryOptions, 
      { validateResult: false, validateOptions: false }
    );
    res.json({ quotes: result.quotes });
  } catch (error) {
    console.error(`Historical failed for ${req.params.sym}:`, error);
    res.status(500).json({ error: 'Failed to fetch historical data', details: error.message });
  }
});

// @route   GET /api/stocks/search?q=query
router.get('/search', protect, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const results = await yahooFinance.search(q, {}, { validateResult: false, validateOptions: false });
    // Return enriched search results with all useful fields
    const mapped = (results.quotes || []).map(r => ({
      symbol: r.symbol,
      shortname: r.shortname || r.shortName || '',
      longname: r.longname || r.longName || '',
      exchDisp: r.exchDisp || r.exchange || '',
      typeDisp: r.typeDisp || '',
      quoteType: r.quoteType || '',
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Search failed:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── Market hours helpers ──────────────────────────────────────────
function isIndianMarketLive() {
  // IST = UTC + 5:30
  // Market hours: 9:15 AM - 3:30 PM IST, Mon-Fri
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istMinutes = utcHours * 60 + utcMinutes + 330; // Convert to IST total minutes
  const day = now.getUTCDay();
  
  if (day === 0 || day === 6) return false; // Weekend
  return istMinutes >= 555 && istMinutes <= 930; // 9:15 AM (555 min) to 3:30 PM (930 min)
}

function isUSMarketLive() {
  // ET = UTC - 4 (EDT) or UTC - 5 (EST)
  // Market hours: 9:30 AM - 4:00 PM ET, Mon-Fri
  // Using UTC-4 (EDT)
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const etMinutes = utcHours * 60 + utcMinutes - 240; // Convert to ET total minutes (EDT)
  const day = now.getUTCDay();
  
  if (day === 0 || day === 6) return false; // Weekend
  return etMinutes >= 570 && etMinutes <= 960; // 9:30 AM (570 min) to 4:00 PM (960 min)
}

// @route   GET /api/stocks/movers
// @desc    Returns top/main stocks for the ticker. Shows Indian stocks when Indian market is live,
//          US stocks when US market is live, and always includes crypto.
router.get('/movers', protect, async (req, res) => {
  try {
    const indianLive = isIndianMarketLive();
    const usLive = isUSMarketLive();

    // Top Indian blue-chip stocks (Nifty 50 heavyweights)
    const indianSymbols = [
      'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'
    ];

    // Top US mega-cap stocks
    const usSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'
    ];

    // Top Crypto by market cap
    const cryptoSymbols = [
      'BTC-USD', 'ETH-USD', 'SOL-USD'
    ];

    // Build the symbols list based on market hours
    let symbolsToFetch = [];

    if (indianLive) {
      symbolsToFetch.push(...indianSymbols);
    }
    if (usLive) {
      symbolsToFetch.push(...usSymbols);
    }
    // Always include crypto (24/7 market)
    symbolsToFetch.push(...cryptoSymbols);

    // If neither Indian nor US market is live, show both
    if (!indianLive && !usLive) {
      symbolsToFetch = [...indianSymbols, ...usSymbols, ...cryptoSymbols];
    }

    let validQuotes = [];
    try {
      validQuotes = await yahooFinance.quote(
        symbolsToFetch, 
        {}, 
        { validateResult: false, validateOptions: false }
      );
      if (!Array.isArray(validQuotes)) validQuotes = [validQuotes];
    } catch (e) {
      console.error('Failed to fetch movers batch quote:', e);
    }
    
    const formattedQuotes = validQuotes.map(q => ({
      sym: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice || 0,
      changePct: q.regularMarketChangePercent || 0,
      change: q.regularMarketChange || 0,
      market: q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO') ? 'India'
            : q.symbol.endsWith('-USD') ? 'Crypto'
            : 'US',
      currencySymbol: q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO') ? '₹' : '$'
    }));

    res.json({
      quotes: formattedQuotes,
      indianLive,
      usLive,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movers' });
  }
});

// @route   GET /api/stocks/exchange-rate
// @desc    Get live USD/INR exchange rate for currency conversion
router.get('/exchange-rate', protect, async (req, res) => {
  try {
    const quote = await yahooFinance.quote('USDINR=X', {}, { validateResult: false, validateOptions: false });
    res.json({
      pair: 'USD/INR',
      rate: quote.regularMarketPrice || 83.5,
      change: quote.regularMarketChange || 0,
      changePct: quote.regularMarketChangePercent || 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Exchange rate fetch failed:', error.message);
    // Fallback to a reasonable default
    res.json({ pair: 'USD/INR', rate: 83.5, change: 0, changePct: 0, updatedAt: new Date().toISOString() });
  }
});

export default router;
