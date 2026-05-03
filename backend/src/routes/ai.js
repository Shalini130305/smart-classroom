const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/generate-timetable', authenticate, authorize('admin'), ctrl.generateTimetable);
router.get('/detect-conflicts', authenticate, ctrl.detectConflicts);
router.get('/recommend-classroom', authenticate, ctrl.recommendClassroom);
router.post('/chatbot', authenticate, ctrl.chatbot);

module.exports = router;
