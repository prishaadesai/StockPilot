import express from 'express';
import Wishlist from '../models/Wishlist.js';
import { protect } from '../middleware/auth.js';
import yahooFinance from '../lib/yahooFinance.js';

const router = express.Router();

// @route   GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user.id });
    
    // Use a single batch request to yahoo-finance2 for efficiency
    const symbols = items.map(item => item.sym);
    let quotes = [];
    if (symbols.length > 0) {
      try {
        quotes = await yahooFinance.quote(symbols);
      } catch (err) {
        console.error('Batch quote fetch failed for wishlist:', err.message);
      }
    }

    const quoteMap = {};
    for (const q of quotes) {
      quoteMap[q.symbol] = q;
    }
    
    const enrichedItems = items.map(item => {
      const q = quoteMap[item.sym];
      return {
        sym: item.sym,
        name: q?.shortName || q?.longName || item.name,
        currentPrice: q?.regularMarketPrice || 0,
        change: q?.regularMarketChange || 0,
        changePercent: q?.regularMarketChangePercent || 0
      };
    });

    res.json(enrichedItems);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wishlist
router.post('/', protect, async (req, res) => {
  const { sym, name } = req.body;
  if (!sym || !name) return res.status(400).json({ error: 'Missing sym or name' });

  try {
    const exists = await Wishlist.findOne({ user: req.user.id, sym });
    if (exists) return res.status(400).json({ error: 'Already in wishlist' });

    const item = await Wishlist.create({ user: req.user.id, sym, name });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/wishlist/:sym
router.delete('/:sym', protect, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user.id, sym: req.params.sym });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
