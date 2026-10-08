const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');

exports.list = async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.city) filter.city = { $regex: req.query.city.trim(), $options: 'i' };
    const theaters = await Theater.find(filter).sort({ city: 1, name: 1 }).limit(100);
    return res.json({ theaters });
  } catch (error) {
    return next(error);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const theaters = await Theater.find({ ...filter, active: true }).sort({ city: 1, name: 1 });
    return res.json({ theaters });
  } catch (error) {
    return next(error);
  }
};

exports.showtimes = async (req, res, next) => {
  try {
    const filter = { active: true, startsAt: { $gte: new Date() } };
    if (req.query.movie) filter.movie = req.query.movie;
    if (req.query.theater) filter.theater = req.query.theater;
    if (req.query.date) {
      const day = new Date(`${req.query.date}T00:00:00`);
      if (Number.isNaN(day.getTime())) return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
      const tomorrow = new Date(day);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.startsAt = { $gte: day, $lt: tomorrow };
    }
    const shows = await Showtime.find(filter)
      .populate('movie', 'title poster rating genre')
      .populate('theater', 'name city address')
      .sort({ startsAt: 1 })
      .limit(200);
    return res.json({
      showtimes: shows.map((showtime) => {
        const item = showtime.toObject();
        item.capacity = item.seats.length;
        item.availableSeats = item.seats.filter((seat) => seat.status === 'available').length;
        delete item.seats;
        return item;
      })
    });
  } catch (error) {
    return next(error);
  }
};

exports.getShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie', 'title poster rating genre')
      .populate('theater', 'name city address');
    if (!showtime) return res.status(404).json({ message: 'Showtime not found.' });
    return res.json({ showtime });
  } catch (error) {
    return next(error);
  }
};

exports.createShowtime = async (req, res, next) => {
  try {
    const { movieId, theaterId, startsAt, basePrice, format } = req.body;
    if (!movieId || !theaterId || !startsAt || !Number.isFinite(Number(basePrice)) || Number(basePrice) <= 0) {
      return res.status(400).json({ message: 'Movie, theater, date/time, and a positive ticket price are required.' });
    }
    const [movie, theater] = await Promise.all([
      Movie.findById(movieId),
      Theater.findById(theaterId)
    ]);
    if (!movie || !theater) return res.status(404).json({ message: 'The selected movie or theater was not found.' });
    if (req.user.role === 'theaterOwner' && String(theater.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only schedule shows at your own theater.' });
    }
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      return res.status(400).json({ message: 'Showtime must be a valid future date and time.' });
    }
    const seats = Array.from({ length: theater.seatCount }, (_, index) => {
      const rowIndex = Math.floor(index / 20);
      const number = (index % 20) + 1;
      const row = String.fromCharCode(65 + rowIndex);
      const premium = rowIndex >= 8;
      return {
        label: `${row}${number}`,
        row,
        number,
        type: premium ? 'premium' : 'standard',
        price: Number(basePrice) + (premium ? Math.round(Number(basePrice) * 0.25) : 0),
        status: 'available'
      };
    });
    const showtime = await Showtime.create({
      movie: movie._id,
      theater: theater._id,
      startsAt: start,
      basePrice: Number(basePrice),
      format: format || '2D',
      seats
    });
    return res.status(201).json({ showtime });
  } catch (error) {
    return next(error);
  }
};

exports.updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('theater');
    if (!showtime) return res.status(404).json({ message: 'Showtime not found.' });
    if (req.user.role === 'theaterOwner' && String(showtime.theater.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only change schedules at your own theater.' });
    }
    if (showtime.seats.some((seat) => seat.status === 'booked')) {
      return res.status(409).json({ message: 'A show with existing bookings cannot be rescheduled or repriced.' });
    }
    const { startsAt, basePrice, format, active } = req.body;
    if (startsAt !== undefined) {
      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime()) || start <= new Date()) {
        return res.status(400).json({ message: 'Showtime must be a valid future date and time.' });
      }
      showtime.startsAt = start;
    }
    if (basePrice !== undefined) {
      if (!Number.isFinite(Number(basePrice)) || Number(basePrice) <= 0) {
        return res.status(400).json({ message: 'Ticket price must be a positive number.' });
      }
      showtime.basePrice = Number(basePrice);
      showtime.seats.forEach((seat) => {
        seat.price = showtime.basePrice + (seat.type === 'premium' ? Math.round(showtime.basePrice * 0.25) : 0);
      });
    }
    if (format !== undefined) showtime.format = String(format).slice(0, 20);
    if (active !== undefined) showtime.active = Boolean(active);
    await showtime.save();
    return res.json({ showtime });
  } catch (error) {
    return next(error);
  }
};

exports.deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('theater');
    if (!showtime) return res.status(404).json({ message: 'Showtime not found.' });
    if (req.user.role === 'theaterOwner' && String(showtime.theater.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only remove schedules at your own theater.' });
    }
    if (showtime.seats.some((seat) => seat.status === 'booked')) {
      return res.status(409).json({ message: 'A show with existing bookings cannot be deleted. Deactivate it instead.' });
    }
    await showtime.deleteOne();
    return res.json({ message: 'Showtime removed.' });
  } catch (error) {
    return next(error);
  }
};
