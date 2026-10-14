const crypto = require('crypto');
const Razorpay = require('razorpay');
const Showtime = require('../models/Showtime');
const Transaction = require('../models/Transaction');
const PendingPayment = require('../models/PendingPayment');
const { sendBookingEmail } = require('../services/mailer');

const razorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Configure Razorpay test keys in Backend/.env to accept ticket payments.');
    error.status = 503;
    throw error;
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const releaseExpiredSeats = (showtimeId) => Showtime.updateOne(
  { _id: showtimeId },
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

exports.createOrder = async (req, res, next) => {
  let order;
  let seatLabels;
  try {
    const { showtimeId, seats } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length < 1 || seats.length > 10) {
      return res.status(400).json({ message: 'Choose between 1 and 10 seats for a showtime.' });
    }
    seatLabels = [...new Set(seats.map((seat) => String(seat).trim()))];
    if (seatLabels.length !== seats.length || seatLabels.some((seat) => !/^[A-Z]\d{1,2}$/.test(seat))) {
      return res.status(400).json({ message: 'Seat selection is invalid.' });
    }
    await releaseExpiredSeats(showtimeId);
    const showtime = await Showtime.findById(showtimeId).populate('theater');
    if (!showtime || !showtime.active || showtime.startsAt <= new Date() ||
      !showtime.theater.active || !['approved', undefined].includes(showtime.theater.approvalStatus)) {
      return res.status(404).json({ message: 'This showtime is no longer available.' });
    }
    const selectedSeats = seatLabels.map((label) => showtime.seats.find((seat) => seat.label === label && seat.status === 'available'));
    if (selectedSeats.some((seat) => !seat)) {
      return res.status(409).json({ message: 'One or more seats were just taken. Refresh the seat map and choose again.' });
    }
    const amount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const gateway = razorpayClient();
    order = await gateway.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `ticket-${crypto.randomBytes(12).toString('hex')}`,
      notes: { userId: String(req.user._id), showtimeId: String(showtime._id) }
    });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reserved = await Showtime.findOneAndUpdate(
      {
        _id: showtime._id,
        active: true,
        startsAt: { $gt: new Date() },
        seats: { $all: seatLabels.map((label) => ({ $elemMatch: { label, status: 'available' } })) }
      },
      {
        $set: {
          'seats.$[seat].status': 'reserved',
          'seats.$[seat].reservationId': order.id,
          'seats.$[seat].reservedBy': req.user._id,
          'seats.$[seat].reservedUntil': expiresAt
        }
      },
      { arrayFilters: [{ 'seat.label': { $in: seatLabels }, 'seat.status': 'available' }], new: true }
    );
    if (!reserved) return res.status(409).json({ message: 'One or more seats were just taken. Refresh the seat map and choose again.' });
    await PendingPayment.create({
      razorpayOrderId: order.id,
      user: req.user._id,
      showtime: showtime._id,
      seats: seatLabels,
      amount,
      expiresAt
    });
    return res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
      expiresAt,
      message: 'Seats are held for 10 minutes while you complete Razorpay test checkout.'
    });
  } catch (error) {
    if (order && seatLabels) {
      await Showtime.updateOne(
        { 'seats.reservationId': order.id },
        {
          $set: { 'seats.$[seat].status': 'available' },
          $unset: {
            'seats.$[seat].reservationId': '',
            'seats.$[seat].reservedBy': '',
            'seats.$[seat].reservedUntil': ''
          }
        },
        { arrayFilters: [{ 'seat.reservationId': order.id }] }
      );
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value)) {
      return res.status(400).json({ message: 'Razorpay payment verification details are incomplete.' });
    }
    const pending = await PendingPayment.findOne({ razorpayOrderId: orderId, user: req.user._id });
    if (!pending) return res.status(404).json({ message: 'Payment order was not found for this account.' });
    if (pending.status === 'paid') {
      const transaction = await Transaction.findById(pending.transaction);
      return res.json({ transaction, emailSent: false, paymentMode: 'razorpay', message: 'Payment was already verified.' });
    }
    if (pending.status !== 'pending') return res.status(409).json({ message: 'This payment order is no longer active.' });
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      return res.status(400).json({ message: 'Razorpay signature could not be verified.' });
    }
    const gateway = razorpayClient();
    let payment = await gateway.payments.fetch(paymentId);
    if (payment.order_id !== orderId || payment.amount !== Math.round(pending.amount * 100) || payment.currency !== 'INR') {
      return res.status(400).json({ message: 'Razorpay payment details do not match this booking.' });
    }
    if (payment.status === 'authorized') {
      payment = await gateway.payments.capture(paymentId, Math.round(pending.amount * 100), 'INR');
    }
    if (payment.status !== 'captured') return res.status(402).json({ message: 'Razorpay has not captured this payment.' });

    const reserved = await Showtime.findOneAndUpdate(
      {
        _id: pending.showtime,
        seats: { $all: pending.seats.map((label) => ({ $elemMatch: { label, status: 'reserved', reservationId: orderId, reservedBy: req.user._id } })) }
      },
      {
        $set: { 'seats.$[seat].status': 'booked' },
        $unset: {
          'seats.$[seat].reservationId': '',
          'seats.$[seat].reservedBy': '',
          'seats.$[seat].reservedUntil': ''
        }
      },
      { arrayFilters: [{ 'seat.label': { $in: pending.seats }, 'seat.reservationId': orderId }], new: true }
    );
    if (!reserved) {
      await gateway.payments.refund(paymentId);
      pending.status = 'refunded';
      pending.paymentId = paymentId;
      await pending.save();
      return res.status(409).json({ message: 'The seat hold expired. A test-mode refund has been initiated; please choose seats again.' });
    }
    const bookingCode = `LUX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const transaction = await Transaction.create({
      bookingCode,
      user: req.user._id,
      showtime: reserved._id,
      movie: reserved.movie,
      theater: reserved.theater,
      seats: pending.seats,
      amount: pending.amount,
      paymentMethod: 'razorpay',
      paymentMode: 'razorpay',
      paymentId
    });
    pending.status = 'paid';
    pending.paymentId = paymentId;
    pending.transaction = transaction._id;
    await pending.save();
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
      paymentMode: 'razorpay',
      message: emailSent
        ? 'Razorpay test payment verified. Your tickets are confirmed and emailed.'
        : 'Razorpay test payment verified. Your tickets are confirmed.'
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
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
      if (transaction.paymentMode === 'razorpay' && transaction.paymentId) {
        await razorpayClient().payments.refund(transaction.paymentId);
      }
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
      return res.json({ message: transaction.paymentMode === 'razorpay'
        ? 'Booking cancelled. A Razorpay test-mode refund has been initiated.'
        : 'Booking cancelled. Demo payment marked as refunded.' });
    }
    return res.status(400).json({ message: 'Bookings can only be cancelled before the showtime.' });
  } catch (error) {
    return next(error);
  }
};
