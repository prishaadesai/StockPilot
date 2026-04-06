import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.MARKET_AUX_API_KEY;
const BASE_URL = 'https://api.marketaux.com/v1/news/all';

/**
 * Fetches high-quality financial news from MarketAux API.
 * Supports regional filtering (US, India, Crypto).
 */
export async function getMarketNews(market = 'US') {
  if (!API_KEY) {
    console.error('MARKET_AUX_API_KEY is not defined in .env');
    return [];
  }

  const params = {
    api_token: API_KEY,
    language: 'en',
    limit: 100,
    filter_entities: 'true'
  };

  // Build regional params
  if (market === 'India') {
    params.countries = 'in';
  } else if (market === 'Crypto') {
    params.symbols = 'BTC,ETH,SOL,DOGE,XRP';
  } else {
    params.countries = 'us';
  }

  try {
    const response = await axios.get(BASE_URL, { params });
    const data = response.data.data || [];

    // Fallback: If no data returned for specific symbols, fetch general US/India news
    if (data.length === 0 && params.symbols) {
      delete params.symbols;
      const fallbackResponse = await axios.get(BASE_URL, { params });
      return (fallbackResponse.data.data || []).map(mapToInternal);
    }

    return data.map(mapToInternal);
  } catch (error) {
    console.error(`MarketAux [${market}] error:`, error.response?.data || error.message);
    return [];
  }
}

function mapToInternal(n) {
  return {
    title: n.title,
    source: n.source || 'Intelligence Feed',
    time: Math.floor(new Date(n.published_at).getTime() / 1000),
    link: n.url,
    thumbnail: n.image_url || null,
    summary: n.snippet || n.description || 'Global financial coverage.'
  };
}
