import { Router } from 'express';
import { TimetableController } from '../controllers/timetableController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/class/:classSectionId', TimetableController.getByClass);
router.get('/calculate-affected', TimetableController.calculateAffected);

export default router;
