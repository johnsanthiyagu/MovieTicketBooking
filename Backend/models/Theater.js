const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seatCount: { type: Number, default: 200, min: 1 },
    facilities: { type: [String], default: ['Dolby Atmos', 'Parking', 'Snacks'] },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    active: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theater', theaterSchema);
