const router = require('express').Router();
const controller = require('../controllers/theaterController');
const { protect, allowRoles } = require('../middleware/auth');

router.get('/', controller.list);
router.get('/mine', protect, allowRoles('admin', 'theaterOwner'), controller.listMine);
router.get('/showtimes', controller.showtimes);
router.get('/showtimes/:id', controller.getShowtime);
router.post('/showtimes', protect, allowRoles('admin', 'theaterOwner'), controller.createShowtime);
router.patch('/showtimes/:id', protect, allowRoles('admin', 'theaterOwner'), controller.updateShowtime);
router.delete('/showtimes/:id', protect, allowRoles('admin', 'theaterOwner'), controller.deleteShowtime);

module.exports = router;
