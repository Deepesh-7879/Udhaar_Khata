import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: ['owner', 'employee'],
    default: 'owner',
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // For owner, shopId will point to their own User ID.
    // For employee, shopId will point to the Owner's User ID.
  },
  shopName: {
    type: String,
    trim: true,
    required: function() { return this.role === 'owner'; } // Only required for owners
  },
  shopAddress: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
  },
  upiId: {
    type: String,
    trim: true,
    default: '',
    description: 'UPI ID for generating QR codes, e.g., shopkeeper@upi'
  },
  smtpHost: {
    type: String,
    trim: true,
    default: ''
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpUser: {
    type: String,
    trim: true,
    default: ''
  },
  smtpPass: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Set shopId to self if role is owner and shopId is not already set
  if (this.role === 'owner' && !this.shopId) {
    this.shopId = this._id;
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      shopId: this.shopId,
      role: this.role,
      name: this.name,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
