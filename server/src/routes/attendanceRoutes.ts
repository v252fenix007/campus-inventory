import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

router.get('/my-stats', AttendanceController.getMyAttendance);
router.get('/student/:id', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), AttendanceController.getStudentAttendance);
router.get('/class/:classSectionId', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), AttendanceController.getClassAttendance);
router.get('/department/:departmentId', authorizeRoles(ROLES.HOD, ROLES.ADMIN), AttendanceController.getDepartmentOverview);
router.post('/manual-update', authorizeRoles(ROLES.FACULTY, ROLES.ADMIN), AttendanceController.manualUpdate);
router.get('/policy', AttendanceController.getPolicy);
router.put('/policy', authorizeRoles(ROLES.ADMIN), AttendanceController.updatePolicy);

export default router;
