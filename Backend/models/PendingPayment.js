const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: { type: [String], required: true },
    amount: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'expired'], default: 'pending' },
    paymentId: { type: String, unique: true, sparse: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },
  { timestamps: true }
);

pendingPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);