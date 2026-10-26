import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const limit = parseInt(req.query.limit as string, 10) || 30;
      const data = await NotificationService.getUserNotifications(req.user.userId, limit);

      return sendSuccess(res, data, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const id = req.params.id as string;
      const modified = await NotificationService.markAsRead(id, req.user.userId);

      return sendSuccess(res, { modified }, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const count = await NotificationService.markAllAsRead(req.user.userId);
      return sendSuccess(res, { count }, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}
