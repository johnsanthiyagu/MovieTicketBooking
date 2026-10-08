const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, enum: ['standard', 'premium'], default: 'standard' },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'booked'], default: 'available' }
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    format: { type: String, default: '2D' },
    basePrice: { type: Number, required: true, min: 0 },
    seats: { type: [seatSchema], default: [] },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

showtimeSchema.index({ movie: 1, theater: 1, startsAt: 1 }, { unique: true });

module.exports = mongoose.model('Showtime', showtimeSchema);
