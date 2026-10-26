import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITimetableSession extends Document {
  classSection: Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  startTime: string; // "09:00"
  endTime: string;   // "09:50"
  subject: Types.ObjectId;
  faculty?: Types.ObjectId;
  room?: string;
}

const TimetableSessionSchema = new Schema<ITimetableSession>(
  {
    classSection: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true,
    },
    period: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty: { type: Schema.Types.ObjectId, ref: 'User' },
    room: { type: String, default: 'Classroom' },
  },
  { timestamps: true }
);

TimetableSessionSchema.index({ classSection: 1, dayOfWeek: 1, period: 1 }, { unique: true });

export const TimetableSession = mongoose.model<ITimetableSession>('TimetableSession', TimetableSessionSchema);
