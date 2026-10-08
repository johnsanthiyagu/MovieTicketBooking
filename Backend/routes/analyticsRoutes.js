const router = require('express').Router();
const { summary } = require('../controllers/analyticsController');
const { protect, allowRoles } = require('../middleware/auth');

router.get('/', protect, allowRoles('admin', 'theaterOwner'), summary);

module.exports = router;
