import yahooFinance from './lib/yahooFinance.js';

async function test() {
  try {
    console.log('Testing yahooFinance.quote("AAPL")...');
    const quote = await yahooFinance.quote('AAPL');
    console.log('Quote success:', JSON.stringify(quote, null, 2).substring(0, 500));
    
    console.log('Testing yahooFinance.historical("AAPL")...');
    const history = await yahooFinance.historical('AAPL', { period1: '2024-01-01' });
    console.log('Historical success, count:', history.length);
  } catch (err) {
    console.error('ERROR DETECTED:');
    console.error('Message:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Body:', err.response.data);
    } else {
      console.error('Stack:', err.stack);
    }
  }
}

test();
