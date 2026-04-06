import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sym: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  avgPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export default mongoose.model('Portfolio', portfolioSchema);
