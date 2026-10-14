const router = require('express').Router();
const controller = require('../controllers/bookingController');
const { protect, allowRoles } = require('../middleware/auth');

router.use(protect);
router.post('/razorpay/order', allowRoles('user'), controller.createOrder);
router.post('/razorpay/verify', allowRoles('user'), controller.verifyPayment);
router.get('/mine', allowRoles('user'), controller.mine);
router.patch('/:id/cancel', allowRoles('user'), controller.cancel);

module.exports = router;
