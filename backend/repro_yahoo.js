import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey']
});

async function test() {
  try {
    console.log('Testing quote for RELIANCE.NS with validateResult: false...');
    const quote = await yahooFinance.quote('RELIANCE.NS', {}, { validateResult: false });
    console.log('Quote success:', quote.symbol, quote.regularMarketPrice);
    
    console.log('Testing movers batch...');
    const movers = await yahooFinance.quote(['AAPL', 'MSFT', 'RELIANCE.NS'], {}, { validateResult: false });
    console.log('Movers batch success. Count:', movers.length);

  } catch (error) {
    console.error('Yahoo Finance Error detected:');
    console.error(error);
    if (error.name === 'InvalidOptionsError') {
      console.error('Validation error options:', error.input);
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
  }
}

test();
