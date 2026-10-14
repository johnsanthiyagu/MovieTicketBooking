const router = require('express').Router();
const controller = require('../controllers/theaterController');
const { protect, allowRoles } = require('../middleware/auth');

router.get('/', controller.list);
router.get('/mine', protect, allowRoles('admin', 'theaterOwner'), controller.listMine);
router.get('/pending', protect, allowRoles('admin'), controller.pending);
router.post('/', protect, allowRoles('theaterOwner'), controller.create);
router.patch('/:id/approval', protect, allowRoles('admin'), controller.review);
router.get('/showtimes', controller.showtimes);
router.get('/showtimes/:id', controller.getShowtime);
router.get('/:id/shows', controller.theaterShows);
router.post('/showtimes', protect, allowRoles('admin', 'theaterOwner'), controller.createShowtime);
router.patch('/showtimes/:id', protect, allowRoles('admin', 'theaterOwner'), controller.updateShowtime);
router.delete('/showtimes/:id', protect, allowRoles('admin', 'theaterOwner'), controller.deleteShowtime);

module.exports = router;
