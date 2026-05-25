import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  balance: {
    type: Number,
    default: 0, // balance = Total Credit - Total Debit (positive means they owe money)
  },
  lastPaymentDate: {
    type: Date,
  }
}, {
  timestamps: true,
});

// Compound index to ensure uniqueness of customer phone per shop
CustomerSchema.index({ shopId: 1, phone: 1 }, { unique: true });

export default mongoose.model('Customer', CustomerSchema);
