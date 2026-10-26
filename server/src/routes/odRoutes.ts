import { Router } from 'express';
import { ODController } from '../controllers/odController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  authorizeRoles(ROLES.STUDENT),
  uploadDocument.fields([
    { name: 'document', maxCount: 1 },
    { name: 'secondaryDocument', maxCount: 1 },
  ]),
  ODController.create
);
router.get('/', ODController.list);
router.get('/:id', ODController.getById);
router.post('/:id/approve', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), ODController.approve);
router.post('/:id/reject', authorizeRoles(ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN), ODController.reject);
router.post('/:id/cancel', authorizeRoles(ROLES.STUDENT), ODController.cancel);
router.get('/:id/receipt', ODController.downloadReceipt);

export default router;
