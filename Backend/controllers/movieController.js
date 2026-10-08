const axios = require('axios');
const Movie = require('../models/Movie');

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.genre) filter.genre = { $regex: req.query.genre, $options: 'i' };
    if (req.query.year) filter.year = String(req.query.year);
    if (req.query.q) filter.title = { $regex: req.query.q.trim(), $options: 'i' };
    const movies = await Movie.find(filter).sort({ featured: -1, title: 1 }).limit(100);
    return res.json({ movies });
  } catch (error) {
    return next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    return res.json({ movie });
  } catch (error) {
    return next(error);
  }
};

exports.searchOmdb = async (req, res, next) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'OMDb search is not configured. Set OMDB_API_KEY in Backend/.env.' });
    }
    const title = String(req.query.title || '').trim();
    if (title.length < 2) return res.status(400).json({ message: 'Enter at least two characters to search.' });
    const { data } = await axios.get('https://www.omdbapi.com/', {
      params: { apikey: apiKey, s: title, type: 'movie' },
      timeout: 8000
    });
    if (data.Response === 'False') return res.json({ results: [] });
    return res.json({ results: data.Search || [] });
  } catch (error) {
    return next(error);
  }
};

exports.importOmdb = async (req, res, next) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'OMDb import is not configured. Set OMDB_API_KEY in Backend/.env.' });
    }
    const imdbID = String(req.body.imdbID || '').trim();
    if (!/^tt\d{5,12}$/.test(imdbID)) {
      return res.status(400).json({ message: 'A valid IMDb ID is required.' });
    }
    const { data } = await axios.get('https://www.omdbapi.com/', {
      params: { apikey: apiKey, i: imdbID, plot: 'full' },
      timeout: 8000
    });
    if (data.Response === 'False') return res.status(404).json({ message: data.Error || 'Movie not found on OMDb.' });

    const movie = await Movie.findOneAndUpdate(
      { imdbID },
      {
        $set: {
          title: data.Title,
          year: data.Year,
          released: data.Released,
          runtime: data.Runtime,
          genre: data.Genre ? data.Genre.split(', ').filter(Boolean) : [],
          plot: data.Plot,
          poster: data.Poster !== 'N/A' ? data.Poster : '',
          rating: data.imdbRating,
          languages: data.Language
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    return res.status(201).json({ movie });
  } catch (error) {
    return next(error);
  }
};
