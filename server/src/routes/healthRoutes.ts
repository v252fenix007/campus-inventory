import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? 'connected'
      : dbState === 2
      ? 'connecting'
      : dbState === 3
      ? 'disconnecting'
      : 'disconnected';

  const healthData = {
    status: dbState === 1 ? 'healthy' : 'degraded',
    service: 'CampusFlow Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      host: mongoose.connection.host || '127.0.0.1',
      name: mongoose.connection.name || 'campusflow',
    },
  };

  if (dbState === 1) {
    return sendSuccess(res, healthData, 'System is healthy');
  } else {
    return sendError(res, 'Database is not connected', 503, healthData);
  }
});

export default router;
