import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/stockpilot');
mongoose.connection.on('open', async () => {
  try {
    await mongoose.connection.collection('portfolios').dropIndex('userId_1_sym_1');
    console.log('Successfully dropped stale userId_1_sym_1 index in portfolios collection.');
  } catch (err) {
    console.log('Error dropping index:', err.message);
  }
  process.exit(0);
});
