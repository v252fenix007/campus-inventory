import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);
// Admin dashboard and meta is also viewable by HOD/Faculty where appropriate, but user management is strictly Admin
router.get('/dashboard', authorizeRoles(ROLES.HOD, ROLES.ADMIN), AdminController.getDashboardStats);
router.get('/meta', AdminController.getMetadata);
router.get('/audit-logs', authorizeRoles(ROLES.ADMIN), AdminController.getAuditLogs);
router.get('/users', authorizeRoles(ROLES.ADMIN, ROLES.HOD), AdminController.listUsers);
router.post('/users', authorizeRoles(ROLES.ADMIN), AdminController.createUser);
router.patch('/users/:id', authorizeRoles(ROLES.ADMIN), AdminController.updateUser);

export default router;
