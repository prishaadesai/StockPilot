import express from 'express';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import yahooFinance from '../lib/yahooFinance.js';

const router = express.Router();

// @route   GET /api/portfolio
// @desc    Get user's portfolio with aggregated current prices
router.get('/', protect, async (req, res) => {
  try {
    const items = await Portfolio.find({ user: req.user.id });

    // Attempt to fetch current prices to calculate PNL dynamically
    // Use a single batch request to yahoo-finance2 for efficiency
    const symbols = items.map(item => item.sym);
    let quotes = [];
    if (symbols.length > 0) {
      try {
        quotes = await yahooFinance.quote(symbols, {}, { validateResult: false, validateOptions: false });
      } catch (err) {
        console.error('Batch quote fetch failed for portfolio:', err.message);
      }
    }

    const quoteMap = {};
    for (const q of quotes) {
      quoteMap[q.symbol] = q;
    }

    const enrichedItems = items.map(item => {
      const q = quoteMap[item.sym];
      const currentPrice = q?.regularMarketPrice || item.avgPrice;
      const change = q?.regularMarketChange || 0;
      const changePct = q?.regularMarketChangePercent || 0;
      const pnl = (currentPrice - item.avgPrice) * item.quantity;
      // Determine native currency from Yahoo Finance quote data
      const nativeCurrency = q?.currency || 'USD';

      return {
        sym: item.sym,
        name: q?.shortName || q?.longName || item.name,
        quantity: item.quantity,
        avgPrice: item.avgPrice,
        currentPrice,
        pnl,
        change,
        changePct,
        nativeCurrency,
      };
    });

    res.json(enrichedItems);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/portfolio/buy
router.post('/buy', protect, async (req, res) => {
  const { sym, name, quantity } = req.body;
  console.log(`📡 [PORTFOLIO] Buy Request: ${sym} x ${quantity}`);
  try {
    let price = 0;
    let quote;
    try {
      quote = await yahooFinance.quote(sym, {}, { validateResult: false, validateOptions: false });
      price = quote.regularMarketPrice;
    } catch (e) {
      return res.status(400).json({ error: 'Could not fetch stock price' });
    }

    // Universal Accounting Sync: Convert native price to USD for wallet deduction
    const nativeCurrency = quote.currency || 'USD';
    let totalCostUSD = price * quantity;
    
    if (nativeCurrency === 'INR') {
      try {
        const rateQuote = await yahooFinance.quote('USDINR=X', {}, { validateResult: false, validateOptions: false });
        const rate = rateQuote.regularMarketPrice || 83.5;
        totalCostUSD = (price * quantity) / rate;
        console.log(`🏦 [WALLET SYNC] INR Trade: ₹${price * quantity} -> $${totalCostUSD.toFixed(2)} (Rate: ${rate})`);
      } catch (e) {
        // Fallback to 83.5 if rate fetch fails
        totalCostUSD = (price * quantity) / 83.5;
      }
    }

    const user = await User.findById(req.user.id);

    if (user.walletBalance < totalCostUSD) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    user.walletBalance -= totalCostUSD;
    await user.save();

    let portfolioItem = await Portfolio.findOne({ user: req.user.id, sym });
    if (portfolioItem) {
      const totalOldCost = portfolioItem.avgPrice * portfolioItem.quantity;
      const totalNewCost = price * quantity;
      portfolioItem.quantity += quantity;
      portfolioItem.avgPrice = (totalOldCost + totalNewCost) / portfolioItem.quantity;
      await portfolioItem.save();
    } else {
      portfolioItem = await Portfolio.create({
        user: req.user.id,
        sym,
        name: name || sym,
        quantity,
        avgPrice: price,
      });
    }

    res.json({ message: 'Buy successful', walletBalance: user.walletBalance, item: portfolioItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

// @route   POST /api/portfolio/sell
router.post('/sell', protect, async (req, res) => {
  const { sym, quantity } = req.body;
  if (!sym || !quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid trade data' });

  try {
    const portfolioItem = await Portfolio.findOne({ user: req.user.id, sym });
    if (!portfolioItem || portfolioItem.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough shares to sell' });
    }

    let price = portfolioItem.avgPrice;
    try {
      const quote = await yahooFinance.quote(sym, {}, { validateResult: false, validateOptions: false });
      price = quote.regularMarketPrice || price;
    } catch (e) {
      console.warn('Could not fetch latest price, using avgPrice instead');
    }

    console.log(`📡 [PORTFOLIO] Sell Request: ${sym} x ${quantity}`);
    // Universal Accounting Sync: Convert native price to USD for wallet addition
    const nativeCurrency = portfolioItem.nativeCurrency || 'USD';
    let totalRevenueUSD = price * quantity;
    
    if (nativeCurrency === 'INR') {
      try {
        const rateQuote = await yahooFinance.quote('USDINR=X', {}, { validateResult: false, validateOptions: false });
        const rate = rateQuote.regularMarketPrice || 83.5;
        totalRevenueUSD = (price * quantity) / rate;
        console.log(`🏦 [WALLET SYNC] INR Sell: ₹${price * quantity} -> $${totalRevenueUSD.toFixed(2)} (Rate: ${rate})`);
      } catch (e) {
        totalRevenueUSD = (price * quantity) / 83.5;
      }
    }

    const user = await User.findById(req.user.id);
    user.walletBalance += totalRevenueUSD;
    await user.save();

    portfolioItem.quantity -= quantity;
    if (portfolioItem.quantity === 0) {
      await Portfolio.deleteOne({ _id: portfolioItem._id });
    } else {
      await portfolioItem.save();
    }

    res.json({ message: 'Sell successful', walletBalance: user.walletBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
