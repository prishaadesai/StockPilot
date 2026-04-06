import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Define specific routes BEFORE parameterized or catch-all routes
// @route   GET /api/alerts/notifications
// @desc    Get alerts triggered recently (last 15m) for notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const triggeredAlerts = await Alert.find({
      user: req.user.id,
      triggered: true,
      updatedAt: { $gte: fifteenMinutesAgo }
    });
    res.json(triggeredAlerts);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/alerts
router.post('/', protect, async (req, res) => {
  const { sym, type, value } = req.body;
  if (!sym || !type || value === undefined) {
    return res.status(400).json({ error: 'Missing required alert data' });
  }

  try {
    const alert = await Alert.create({
      user: req.user.id, sym, type, value, triggered: false
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/alerts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user.id });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    await Alert.deleteOne({ _id: req.params.id });
    res.json({ message: 'Alert removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
