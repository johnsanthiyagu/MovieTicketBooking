const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
    seats: { type: [String], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
      type: String,
      enum: ['demo', 'upi', 'qr', 'card', 'netbanking', 'wallet'],
      default: 'demo'
    },
    paymentMode: { type: String, enum: ['demo'], default: 'demo' },
    paymentStatus: { type: String, enum: ['succeeded', 'refunded'], default: 'succeeded' },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
