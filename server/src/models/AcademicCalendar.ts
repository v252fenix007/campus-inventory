import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicCalendar extends Document {
  date: Date;
  type: 'instructional' | 'holiday' | 'exam' | 'event';
  title: string;
  description?: string;
}

const AcademicCalendarSchema = new Schema<IAcademicCalendar>(
  {
    date: { type: Date, required: true, unique: true, index: true },
    type: { type: String, enum: ['instructional', 'holiday', 'exam', 'event'], default: 'instructional' },
    title: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const AcademicCalendar = mongoose.model<IAcademicCalendar>('AcademicCalendar', AcademicCalendarSchema);
