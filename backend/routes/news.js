import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMarketNews } from '../lib/marketAux.js';
import { extractArticleContent } from '../lib/articleExtractor.js';

const router = express.Router();

// @route   GET /api/news
router.get('/', protect, async (req, res) => {
  const market = req.query.market || 'US';
  
  try {
    const news = await getMarketNews(market);
    res.json(news);
  } catch (error) {
    console.error('News route error:', error);
    res.status(500).json({ error: 'Failed to fetch MarketAux news' });
  }
});

// @route   GET /api/news/article
router.get('/article', protect, async (req, res) => {
  const { url, title, summary } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const result = await extractArticleContent(url, title, summary);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract article intelligence' });
  }
});

export default router;
