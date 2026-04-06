import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import wishlistRoutes from './routes/wishlist.js';
import stockRoutes from './routes/stocks.js';
import chatRoutes from './routes/chat.js';
import walletRoutes from './routes/wallet.js';
import alertsRoutes from './routes/alerts.js';
import newsRoutes from './routes/news.js';
import { startAlertEngine } from './lib/alertEngine.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start monitoring alerts
    startAlertEngine(60000); // Check every 60 seconds
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/news', newsRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
