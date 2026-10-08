const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    year: { type: String, default: '' },
    released: { type: String, default: '' },
    runtime: { type: String, default: '' },
    genre: { type: [String], default: [] },
    plot: { type: String, default: '' },
    poster: { type: String, default: '' },
    rating: { type: String, default: '' },
    imdbID: { type: String, unique: true, sparse: true },
    languages: { type: String, default: '' },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', genre: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
