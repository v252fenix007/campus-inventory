import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendancePolicy extends Document {
  name: string;
  odCountsAsPresent: boolean;
  leaveCountsAsPresent: boolean;
  minAttendancePercentage: number;
  hodApprovalRequiredDays: number;
  categoriesRequiringHOD: string[];
  allowStudentCancelPending: boolean;
}

const AttendancePolicySchema = new Schema<IAttendancePolicy>(
  {
    name: { type: String, default: 'Default College Policy' },
    odCountsAsPresent: { type: Boolean, default: true },
    leaveCountsAsPresent: { type: Boolean, default: false },
    minAttendancePercentage: { type: Number, default: 75 },
    hodApprovalRequiredDays: { type: Number, default: 2 },
    categoriesRequiringHOD: {
      type: [String],
      default: ['Internship', 'Sports', 'Symposium'],
    },
    allowStudentCancelPending: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AttendancePolicy = mongoose.model<IAttendancePolicy>('AttendancePolicy', AttendancePolicySchema);
