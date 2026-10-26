import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED'],
      default: 'INFO',
    },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
