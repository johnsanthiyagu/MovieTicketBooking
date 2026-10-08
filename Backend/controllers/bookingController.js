const crypto = require('crypto');
const Showtime = require('../models/Showtime');
const Transaction = require('../models/Transaction');
const { sendBookingEmail } = require('../services/mailer');

const paymentMethodLabels = {
  demo: 'Demo',
  upi: 'UPI',
  qr: 'QR code',
  card: 'credit/debit card',
  netbanking: 'net banking',
  wallet: 'digital wallet'
};

exports.book = async (req, res, next) => {
  let reservedShowtimeId;
  let seatLabels;
  try {
    const { showtimeId, seats, paymentMethod = 'demo' } = req.body;
    if (typeof paymentMethod !== 'string' || !Object.hasOwn(paymentMethodLabels, paymentMethod)) {
      return res.status(400).json({ message: 'Choose one of the supported demo payment methods.' });
    }
    if (!showtimeId || !Array.isArray(seats) || seats.length < 1 || seats.length > 10) {
      return res.status(400).json({ message: 'Choose between 1 and 10 seats for a showtime.' });
    }
    seatLabels = [...new Set(seats.map((seat) => String(seat).trim()))];
    if (seatLabels.length !== seats.length || seatLabels.some((seat) => !/^[A-Z]\d{1,2}$/.test(seat))) {
      return res.status(400).json({ message: 'Seat selection is invalid.' });
    }
    const reserved = await Showtime.findOneAndUpdate(
      {
        _id: showtimeId,
        active: true,
        startsAt: { $gt: new Date() },
        seats: { $all: seatLabels.map((label) => ({ $elemMatch: { label, status: 'available' } })) }
      },
      { $set: { 'seats.$[seat].status': 'booked' } },
      { arrayFilters: [{ 'seat.label': { $in: seatLabels } }], new: true }
    );
    if (!reserved) {
      return res.status(409).json({ message: 'One or more seats were just taken. Refresh the seat map and choose again.' });
    }
    reservedShowtimeId = reserved._id;
    const seatPrices = seatLabels.map((label) => reserved.seats.find((seat) => seat.label === label).price);
    const amount = seatPrices.reduce((sum, price) => sum + price, 0);
    const bookingCode = `LUX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const transaction = await Transaction.create({
      bookingCode,
      user: req.user._id,
      showtime: reserved._id,
      movie: reserved.movie,
      theater: reserved.theater,
      seats: seatLabels,
      amount,
      paymentMethod,
      paymentMode: 'demo'
    });
    const details = await Showtime.findById(reserved._id)
      .populate('movie')
      .populate('theater');
    let emailSent = false;
    try {
      emailSent = await sendBookingEmail(transaction, req.user, details.movie, details.theater, details);
    } catch (emailError) {
      console.error(`Booking ${bookingCode} email delivery failed: ${emailError.message}`);
    }
    return res.status(201).json({
      transaction,
      emailSent,
      paymentMode: 'demo',
      message: emailSent
        ? `Demo payment via ${paymentMethodLabels[paymentMethod]} successful. Your tickets are confirmed and emailed; no money was collected.`
        : `Demo payment via ${paymentMethodLabels[paymentMethod]} successful. Your tickets are confirmed; no money was collected.`
    });
  } catch (error) {
    if (reservedShowtimeId && seatLabels) {
      await Showtime.updateOne(
        { _id: reservedShowtimeId },
        { $set: { 'seats.$[seat].status': 'available' } },
        { arrayFilters: [{ 'seat.label': { $in: seatLabels } }] }
      );
    }
    return next(error);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('movie', 'title poster')
      .populate('theater', 'name city address')
      .populate({ path: 'showtime', select: 'startsAt format' })
      .sort({ createdAt: -1 });
    return res.json({ transactions });
  } catch (error) {
    return next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.user = req.user._id;
    const transaction = await Transaction.findOne(filter);
    if (!transaction) return res.status(404).json({ message: 'Booking not found.' });
    if (transaction.status !== 'confirmed') return res.status(409).json({ message: 'This booking is already cancelled.' });
    const showtime = await Showtime.findById(transaction.showtime);
    if (showtime && showtime.startsAt > new Date()) {
      const updated = await Transaction.updateOne(
        { _id: transaction._id, status: 'confirmed' },
        { $set: { status: 'cancelled', paymentStatus: 'refunded' } }
      );
      if (!updated.modifiedCount) return res.status(409).json({ message: 'Booking status changed. Refresh your booking history.' });
      await Showtime.updateOne(
        { _id: showtime._id },
        { $set: { 'seats.$[seat].status': 'available' } },
        { arrayFilters: [{ 'seat.label': { $in: transaction.seats } }] }
      );
      return res.json({ message: 'Booking cancelled. Demo payment marked as refunded.' });
    }
    return res.status(400).json({ message: 'Bookings can only be cancelled before the showtime.' });
  } catch (error) {
    return next(error);
  }
};
