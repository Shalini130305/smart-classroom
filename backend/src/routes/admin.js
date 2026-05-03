const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/stats', authenticate, authorize('admin'), ctrl.getDashboardStats);
router.get('/users', authenticate, authorize('admin'), ctrl.getAllUsers);
router.post('/users', authenticate, authorize('admin'), ctrl.createUser);
router.put('/users/:id/toggle', authenticate, authorize('admin'), ctrl.toggleUserStatus);
router.get('/courses', authenticate, ctrl.getCourses);
router.post('/courses', authenticate, authorize('admin'), ctrl.createCourse);
router.get('/departments', authenticate, ctrl.getDepartments);

module.exports = router;
