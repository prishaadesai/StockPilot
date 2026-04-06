import mongoose from 'mongoose';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Wishlist from '../models/Wishlist.js';
import Alert from '../models/Alert.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function inspect() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stockpilot');
    console.log('\n--- 📁 StockPilot Database Snapshot ---\n');

    const users = await User.find().select('-password');
    console.log('👤 Users:', users.length);
    console.table(users.map(u => ({
      name: u.name,
      email: u.email,
      balance: `$${u.walletBalance.toLocaleString()}`,
      joined: u.createdAt.toLocaleDateString()
    })));

    const portfolios = await Portfolio.find();
    console.log('\n💼 Portfolio Holdings:', portfolios.length);
    if (portfolios.length > 0) {
      console.table(portfolios.map(p => ({
        owner: p.user.toString().slice(-4), // Last 4 of ID
        symbol: p.sym,
        shares: p.quantity,
        avg_cost: `$${p.avgPrice.toFixed(2)}`
      })));
    }

    const wishlists = await Wishlist.find();
    console.log('\n❤️ Wishlist Items:', wishlists.length);
    if (wishlists.length > 0) {
      console.table(wishlists.map(w => ({
        owner: w.user.toString().slice(-4),
        symbol: w.sym,
        name: w.name
      })));
    }

    const alerts = await Alert.find();
    console.log('\n🔔 Alerts:', alerts.length);
    if (alerts.length > 0) {
      console.table(alerts.map(a => ({
        symbol: a.sym,
        target: `${a.type === 'above' ? '≥' : '≤'} $${a.value}`,
        triggered: a.triggered ? '✅ Yes' : '⏳ No'
      })));
    }

    console.log('\n--- Status Check Complete ---');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Inspection failed:', error.message);
  }
}

inspect();
