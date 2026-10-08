const router = require('express').Router();
const controller = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', controller.book);
router.get('/mine', controller.mine);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
