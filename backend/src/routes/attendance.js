const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('faculty', 'admin'), ctrl.markAttendance);
router.get('/class', authenticate, authorize('faculty', 'admin'), ctrl.getByClass);
router.get('/summary', authenticate, ctrl.getStudentSummary);
router.get('/summary/:userId', authenticate, ctrl.getStudentSummary);
router.get('/stats', authenticate, authorize('admin'), ctrl.getStats);

module.exports = router;
