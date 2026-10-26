import mongoose, { Document, Schema, Types } from 'mongoose';
import { ATTENDANCE_STATUS, AttendanceStatusType } from '../config/constants.js';

export interface IAttendanceRecord extends Document {
  student: Types.ObjectId;
  date: Date;
  period: number;
  subject: Types.ObjectId;
  classSection: Types.ObjectId;
  status: AttendanceStatusType;
  odRequestId?: Types.ObjectId;
  leaveRequestId?: Types.ObjectId;
  requestRefNo?: string;
  remarks?: string;
  correctedBy?: Types.ObjectId;
  previousStatus?: string;
  correctionReason?: string;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    period: { type: Number, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classSection: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },
    odRequestId: { type: Schema.Types.ObjectId, ref: 'ODRequest' },
    leaveRequestId: { type: Schema.Types.ObjectId, ref: 'LeaveRequest' },
    requestRefNo: { type: String },
    remarks: { type: String },
    correctedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    previousStatus: { type: String },
    correctionReason: { type: String },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ student: 1, date: 1, period: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
