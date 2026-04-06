import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const result = await yahooFinance.chart('AAPL', { period1: '2024-03-04', interval: '1d', validateResult: false });
    console.log("Success");
  } catch (e) {
    console.error("Error name:", e.name);
    console.error("Error message:", e.message);
    if (e.errors) console.error("Validation errors:", e.errors);
  }
}

test();
