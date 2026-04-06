import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sym: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true });

// Ensure a user can only have a specific symbol in their wishlist once
wishlistSchema.index({ user: 1, sym: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
