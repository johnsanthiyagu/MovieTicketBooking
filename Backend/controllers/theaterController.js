const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');

exports.list = async (req, res, next) => {
  try {
    const filter = { active: true, $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] };
    if (req.query.city) filter.city = { $regex: req.query.city.trim(), $options: 'i' };
    const theaters = await Theater.find(filter).sort({ city: 1, name: 1 }).limit(100);
    return res.json({ theaters });
  } catch (error) {
    return next(error);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { active: true, $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] }
      : { owner: req.user._id };
    const theaters = await Theater.find(filter).sort({ city: 1, name: 1 });
    return res.json({ theaters });
  } catch (error) {
    return next(error);
  }
};

exports.pending = async (_req, res, next) => {
  try {
    const theaters = await Theater.find({ approvalStatus: 'pending' })
      .populate('owner', 'name email')
      .sort({ createdAt: 1 });
    return res.json({ theaters });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, city, address, seatCount } = req.body;
    if (![name, city, address].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Theatre name, city, and address are required.' });
    }
    const capacity = Number(seatCount || 200);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 2000) {
      return res.status(400).json({ message: 'Seat count must be between 1 and 2000.' });
    }
    const theater = await Theater.create({
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      seatCount: capacity,
      owner: req.user._id,
      approvalStatus: 'pending',
      active: false
    });
    return res.status(201).json({ theater, message: 'Theatre request submitted. It will open after admin approval.' });
  } catch (error) {
    return next(error);
  }
};

exports.review = async (req, res, next) => {
  try {
    const { approvalStatus } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Choose approve or reject for this theatre request.' });
    }
    const theater = await Theater.findById(req.params.id);
    if (!theater) return res.status(404).json({ message: 'Theatre request was not found.' });
    if (theater.approvalStatus !== 'pending') {
      return res.status(409).json({ message: 'This theatre request has already been reviewed.' });
    }
    theater.approvalStatus = approvalStatus;
    theater.active = approvalStatus === 'approved';
    await theater.save();
    return res.json({ theater, message: `Theatre request ${approvalStatus}.` });
  } catch (error) {
    return next(error);
  }
};

exports.theaterShows = async (req, res, next) => {
  try {
    const theater = await Theater.findOne({
      _id: req.params.id,
      active: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
    });
    if (!theater) return res.status(404).json({ message: 'Theatre was not found or is not yet approved.' });
    const now = new Date();
    const earliestStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const shows = await Showtime.find({
      theater: theater._id,
      active: true,
      startsAt: { $gte: earliestStart }
    })
      .populate('movie', 'title poster rating genre year runtime')
      .populate('theater', 'name city address')
      .sort({ startsAt: 1 })
      .limit(100);
    const showtimes = shows.flatMap((showtime) => {
      const movieLength = Number.parseInt(showtime.movie.runtime, 10) || 180;
      const startsAt = new Date(showtime.startsAt);
      const endsAt = new Date(startsAt.getTime() + movieLength * 60 * 1000);
      const status = startsAt <= now && endsAt > now ? 'running' : startsAt > now ? 'upcoming' : null;
      if (!status) return [];
      const item = showtime.toObject();
      item.status = status;
      item.availableSeats = item.seats.filter((seat) => seat.status === 'available').length;
      delete item.seats;
      return [item];
    });
    return res.json({ theater, showtimes });
  } catch (error) {
    return next(error);
  }
};

exports.showtimes = async (req, res, next) => {
  try {
    const approvedTheaters = await Theater.find({
      active: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
    }).distinct('_id');
    const filter = { active: true, startsAt: { $gte: new Date() }, theater: { $in: approvedTheaters } };
    if (req.query.movie) filter.movie = req.query.movie;
    if (req.query.theater) {
      if (!approvedTheaters.some((id) => String(id) === req.query.theater)) return res.json({ showtimes: [] });
      filter.theater = req.query.theater;
    }
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
    await Showtime.updateOne(
      { _id: req.params.id },
      {
        $set: { 'seats.$[seat].status': 'available' },
        $unset: {
          'seats.$[seat].reservationId': '',
          'seats.$[seat].reservedBy': '',
          'seats.$[seat].reservedUntil': ''
        }
      },
      { arrayFilters: [{ 'seat.status': 'reserved', 'seat.reservedUntil': { $lte: new Date() } }] }
    );
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie', 'title poster rating genre')
      .populate('theater', 'name city address active approvalStatus');
    if (!showtime || !showtime.theater.active || !['approved', undefined].includes(showtime.theater.approvalStatus)) {
      return res.status(404).json({ message: 'Showtime not found.' });
    }
    const publicShowtime = showtime.toObject();
    publicShowtime.seats.forEach((seat) => {
      delete seat.reservationId;
      delete seat.reservedBy;
      delete seat.reservedUntil;
    });
    return res.json({ showtime: publicShowtime });
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
    if (!movie || !theater || !theater.active || !['approved', undefined].includes(theater.approvalStatus)) {
      return res.status(404).json({ message: 'The selected movie or approved theater was not found.' });
    }
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
