const router = require('express').Router();
const ctrl = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getTimetable);
router.get('/time-slots', authenticate, ctrl.getTimeSlots);
router.post('/', authenticate, authorize('admin'), ctrl.createEntry);
router.put('/:id', authenticate, authorize('admin'), ctrl.updateEntry);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteEntry);

module.exports = router;
