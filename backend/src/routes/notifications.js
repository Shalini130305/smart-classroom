const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.put('/:id/read', authenticate, ctrl.markRead);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.post('/', authenticate, authorize('admin'), ctrl.create);
router.post('/broadcast', authenticate, authorize('admin'), ctrl.broadcast);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
