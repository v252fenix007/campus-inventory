import { Router } from 'express';
import authRoutes from './authRoutes.js';
import odRoutes from './odRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import timetableRoutes from './timetableRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';
import adminRoutes from './adminRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/od', odRoutes);
router.use('/leave', leaveRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetable', timetableRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

export default router;
