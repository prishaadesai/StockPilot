import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portfolio from './models/Portfolio.js';
import User from './models/User.js';
import yahooFinance from './lib/yahooFinance.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stockpilot');
    console.log('Connected to MongoDB');

    const email = `testdebug${Date.now()}@test.com`;
    const user = await User.create({
      name: 'Debug',
      email,
      password: 'password123'
    });
    console.log('Created user', user.id);

    const sym = 'HDFCBANK.NS';
    const quantity = 10;
    const name = 'HDFC BANK LTD';

    let price = 0;
    try {
      const quote = await yahooFinance.quote(sym);
      price = quote.regularMarketPrice;
      console.log('Quote price:', price);
    } catch (e) {
      console.error('Yahoo finance error:', e);
      return;
    }

    const totalCost = price * quantity;
    if (user.walletBalance < totalCost) {
      console.error('Insufficient funds');
      return;
    }

    user.walletBalance -= totalCost;
    await user.save();
    console.log('User wallet updated:', user.walletBalance);

    let portfolioItem = await Portfolio.findOne({ user: user.id, sym });
    if (portfolioItem) {
      const totalOldCost = portfolioItem.avgPrice * portfolioItem.quantity;
      portfolioItem.quantity += quantity;
      portfolioItem.avgPrice = (totalOldCost + totalCost) / portfolioItem.quantity;
      await portfolioItem.save();
    } else {
      portfolioItem = await Portfolio.create({
        user: user.id,
        sym,
        name: name || sym,
        quantity,
        avgPrice: price,
      });
    }

    console.log('Portfolio saved:', portfolioItem);
  } catch (err) {
    console.log('FATAL ERROR CAUGHT:', err.message);
    const fs = await import('fs');
    fs.writeFileSync('error.json', JSON.stringify({
      message: err.message,
      errors: err.errors ? Object.keys(err.errors).map(k => err.errors[k].message) : []
    }, null, 2));
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
