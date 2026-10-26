import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);
router.use(authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN));

router.get('/attendance/csv', ReportController.exportAttendanceCSV);
router.get('/od/csv', ReportController.exportODRequestsCSV);
router.get('/leave/csv', ReportController.exportLeaveRequestsCSV);

export default router;
