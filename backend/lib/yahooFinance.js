import YahooFinance from 'yahoo-finance2';

// Silence survey notices from Yahoo's backend
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export default yahooFinance;
