const Transaction = require('../models/Transaction');
const Showtime = require('../models/Showtime');
const Theater = require('../models/Theater');

exports.summary = async (req, res, next) => {
  try {
    const theaterIds = req.user.role === 'theaterOwner'
      ? await Theater.find({ owner: req.user._id }).distinct('_id')
      : null;
    const match = { status: 'confirmed' };
    if (theaterIds) match.theater = { $in: theaterIds };
    const [sales, topMovies, bookings] = await Promise.all([
      Transaction.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$amount' }, tickets: { $sum: { $size: '$seats' } }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: match },
        { $group: { _id: '$movie', bookings: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
        { $unwind: '$movie' },
        { $project: { title: '$movie.title', bookings: 1, revenue: 1 } }
      ]),
      Transaction.countDocuments(match)
    ]);
    const occupancyFilter = { active: true, startsAt: { $gte: new Date() } };
    if (theaterIds) occupancyFilter.theater = { $in: theaterIds };
    const occupancy = await Showtime.aggregate([
      { $match: occupancyFilter },
      { $project: { sold: { $size: { $filter: { input: '$seats', as: 'seat', cond: { $eq: ['$$seat.status', 'booked'] } } } }, capacity: { $size: '$seats' } } },
      { $group: { _id: null, sold: { $sum: '$sold' }, capacity: { $sum: '$capacity' } } }
    ]);
    return res.json({
      revenue: sales[0]?.revenue || 0,
      tickets: sales[0]?.tickets || 0,
      bookings,
      topMovies,
      occupancyRate: occupancy[0]?.capacity
        ? Math.round((occupancy[0].sold / occupancy[0].capacity) * 100)
        : 0
    });
  } catch (error) {
    return next(error);
  }
};
