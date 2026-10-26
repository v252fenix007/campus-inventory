import { Notification, INotification } from '../models/Notification.js';
import { Types } from 'mongoose';

export class NotificationService {
  static async createNotification(
    recipient: Types.ObjectId | string,
    title: string,
    message: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED' = 'INFO',
    link?: string,
    metadata?: Record<string, any>
  ): Promise<INotification> {
    const notif = new Notification({
      recipient: new Types.ObjectId(recipient.toString()),
      title,
      message,
      type,
      link,
      metadata,
    });
    return notif.save();
  }

  static async getUserNotifications(
    userId: Types.ObjectId | string,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; unreadCount: number }> {
    const objectId = new Types.ObjectId(userId.toString());
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: objectId })
        .sort({ createdAt: -1 })
        .limit(limit),
      Notification.countDocuments({ recipient: objectId, isRead: false }),
    ]);

    return { notifications, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      { _id: new Types.ObjectId(notificationId), recipient: new Types.ObjectId(userId) },
      { $set: { isRead: true } }
    );
    return result.modifiedCount > 0;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
    return result.modifiedCount;
  }
}
