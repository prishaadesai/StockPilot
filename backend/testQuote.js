import yahooFinance from './lib/yahooFinance.js';

async function test() {
  try {
    const quote = await yahooFinance.quote('DHARAN.BO');
    console.log("QUOTE:", JSON.stringify(quote, null, 2));
  } catch (err) {
    console.error("QUOTE ERROR:", err);
  }
}

test();
