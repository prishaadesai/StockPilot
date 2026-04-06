import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sym: { type: String, required: true },
  type: { type: String, enum: ['above', 'below', 'percent'], required: true },
  value: { type: Number, required: true },
  triggered: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);
