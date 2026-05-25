import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  channel: {
    type: String,
    enum: ['sms', 'whatsapp', 'email'],
    default: 'whatsapp',
  },
  message: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export default mongoose.model('Reminder', ReminderSchema);
