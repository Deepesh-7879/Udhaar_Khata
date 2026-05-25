import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'], // credit = udhaar (increases balance), debit = payment (decreases balance)
    required: [true, 'Please specify transaction type (credit or debit)'],
  },
  amount: {
    type: Number,
    required: [true, 'Please specify transaction amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Indexing for faster history lookup
TransactionSchema.index({ customerId: 1, date: -1 });
TransactionSchema.index({ shopId: 1, date: -1 });

export default mongoose.model('Transaction', TransactionSchema);
