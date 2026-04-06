import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/wallet
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/add-funds
router.post('/add-funds', protect, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  // MOCKING STRIPE INTEGRATION:
  // Usually this would create a Stripe PaymentIntent.
  // We'll just immediately confirm the amount and add to balance.
  try {
    const user = await User.findById(req.user.id);
    user.walletBalance += amount;
    await user.save();

    res.json({
      message: 'Deposit successful (MOCKED)',
      balance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/wallet/confirm-payment
// Added just in case frontend still calls confirmation.
router.post('/confirm-payment', protect, async (req, res) => {
  res.json({ success: true, message: 'Payment confirmed via mock logic.' });
});


export default router;
