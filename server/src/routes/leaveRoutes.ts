import { Router } from 'express';
import { LeaveController } from '../controllers/leaveController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

router.post('/', authorizeRoles(ROLES.STUDENT), uploadDocument.single('document'), LeaveController.create);
router.get('/', LeaveController.list);
router.get('/:id', LeaveController.getById);
router.post('/:id/approve', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), LeaveController.approve);
router.post('/:id/reject', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), LeaveController.reject);
router.post('/:id/cancel', authorizeRoles(ROLES.STUDENT), LeaveController.cancel);

export default router;
