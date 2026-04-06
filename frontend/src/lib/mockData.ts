// Generate mock stock chart data
export function generateChartData(days: number, basePrice: number, volatility = 0.02) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  const interval = days <= 1 ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const points = days <= 1 ? 78 : days;

  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price * 0.5, price + change);
    data.push({
      time: new Date(now - i * interval).toISOString(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  return data;
}

export const tickerData = [
  { sym: 'AAPL', price: 189.84, change: 2.34, pct: 1.25 },
  { sym: 'GOOGL', price: 175.98, change: -1.12, pct: -0.63 },
  { sym: 'MSFT', price: 415.56, change: 5.78, pct: 1.41 },
  { sym: 'TSLA', price: 248.42, change: -3.56, pct: -1.41 },
  { sym: 'AMZN', price: 186.49, change: 1.89, pct: 1.02 },
  { sym: 'NVDA', price: 875.28, change: 12.34, pct: 1.43 },
  { sym: 'META', price: 505.75, change: -3.21, pct: -0.63 },
  { sym: 'NFLX', price: 628.90, change: 8.76, pct: 1.41 },
  { sym: 'BTC', price: 67842.50, change: 1245.30, pct: 1.87 },
  { sym: 'ETH', price: 3456.78, change: -45.67, pct: -1.30 },
  { sym: 'RELIANCE', price: 2876.45, change: 34.20, pct: 1.20 },
  { sym: 'TCS', price: 3945.60, change: -12.80, pct: -0.32 },
];

export const topMovers = [
  { sym: 'NVDA', name: 'NVIDIA', price: 875.28, change: 4.32 },
  { sym: 'SMCI', name: 'Super Micro', price: 812.45, change: 3.87 },
  { sym: 'AMD', name: 'AMD', price: 178.92, change: 2.91 },
  { sym: 'PLTR', name: 'Palantir', price: 24.56, change: 2.45 },
  { sym: 'SNAP', name: 'Snap Inc.', price: 11.23, change: -5.67 },
  { sym: 'RIVN', name: 'Rivian', price: 10.45, change: -4.32 },
];

export const newsItems = [
  {
    id: '1',
    title: 'Fed Signals Potential Rate Cuts in September Meeting',
    source: 'Reuters',
    time: '2h ago',
    category: 'US',
  },
  {
    id: '2',
    title: 'NVIDIA Reports Record Q4 Revenue, Beats Expectations',
    source: 'Bloomberg',
    time: '4h ago',
    category: 'US',
  },
  {
    id: '3',
    title: 'Bitcoin Surges Past $68K Amid ETF Inflows',
    source: 'CoinDesk',
    time: '5h ago',
    category: 'Crypto',
  },
  {
    id: '4',
    title: 'Sensex Hits All-Time High on Strong FII Inflows',
    source: 'Economic Times',
    time: '6h ago',
    category: 'India',
  },
  {
    id: '5',
    title: 'Apple Vision Pro Sales Exceed Analyst Expectations',
    source: 'CNBC',
    time: '8h ago',
    category: 'US',
  },
  {
    id: '6',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%',
    source: 'Mint',
    time: '10h ago',
    category: 'India',
  },
];

export const stockDetails: Record<string, { sym: string; name: string; price: number; change: number; changePct: number; open: number; high: number; low: number; volume: string; marketCap: string; pe: number; week52High: number; week52Low: number }> = {
  AAPL: { sym: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 2.34, changePct: 1.25, open: 187.50, high: 190.12, low: 186.90, volume: '54.2M', marketCap: '2.94T', pe: 29.8, week52High: 199.62, week52Low: 164.08 },
  GOOGL: { sym: 'GOOGL', name: 'Alphabet Inc.', price: 175.98, change: -1.12, changePct: -0.63, open: 177.10, high: 178.45, low: 175.20, volume: '28.1M', marketCap: '2.17T', pe: 25.4, week52High: 180.10, week52Low: 120.21 },
  MSFT: { sym: 'MSFT', name: 'Microsoft Corp.', price: 415.56, change: 5.78, changePct: 1.41, open: 409.78, high: 416.90, low: 408.50, volume: '22.8M', marketCap: '3.09T', pe: 36.2, week52High: 420.82, week52Low: 309.45 },
  TSLA: { sym: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: -3.56, changePct: -1.41, open: 251.98, high: 253.10, low: 247.30, volume: '98.5M', marketCap: '790B', pe: 72.1, week52High: 299.29, week52Low: 138.80 },
  AMZN: { sym: 'AMZN', name: 'Amazon.com Inc.', price: 186.49, change: 1.89, changePct: 1.02, open: 184.60, high: 187.20, low: 183.90, volume: '45.6M', marketCap: '1.94T', pe: 58.3, week52High: 191.70, week52Low: 118.35 },
  NVDA: { sym: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.34, changePct: 1.43, open: 862.94, high: 878.50, low: 860.10, volume: '42.3M', marketCap: '2.16T', pe: 68.5, week52High: 974.00, week52Low: 373.56 },
  META: { sym: 'META', name: 'Meta Platforms', price: 505.75, change: -3.21, changePct: -0.63, open: 508.96, high: 510.20, low: 504.30, volume: '18.2M', marketCap: '1.29T', pe: 33.1, week52High: 542.81, week52Low: 274.38 },
  NFLX: { sym: 'NFLX', name: 'Netflix Inc.', price: 628.90, change: 8.76, changePct: 1.41, open: 620.14, high: 630.50, low: 618.70, volume: '8.9M', marketCap: '272B', pe: 44.7, week52High: 639.00, week52Low: 344.73 },
};

export const suggestedPrompts = [
  "Should I buy AAPL right now?",
  "What's the best tech stock today?",
  "Analyze NVDA's recent performance",
  "Compare GOOGL vs MSFT",
  "Best dividend stocks to buy",
  "Is Tesla overvalued?",
];
