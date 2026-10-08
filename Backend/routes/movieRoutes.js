const router = require('express').Router();
const controller = require('../controllers/movieController');
const { protect, allowRoles } = require('../middleware/auth');

router.get('/omdb/search', controller.searchOmdb);
router.post('/omdb/import', protect, allowRoles('admin'), controller.importOmdb);
router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
