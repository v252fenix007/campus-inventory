import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEAVE_TYPES, REQUEST_STATUS, RequestStatusType } from '../config/constants.js';

export interface ILeaveRequest extends Document {
  refNo: string;
  student: Types.ObjectId;
  department: Types.ObjectId;
  classSection: Types.ObjectId;
  leaveType: typeof LEAVE_TYPES[number];
  reason: string;
  startDate: Date;
  endDate: Date;
  documentUrl?: string;
  documentName?: string;
  status: RequestStatusType;
  requiresHOD: boolean;
  assignedFaculty?: Types.ObjectId;
  assignedHOD?: Types.ObjectId;
  facultyComment?: string;
  hodComment?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    refNo: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    classSection: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true, index: true },
    reason: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    documentUrl: { type: String },
    documentName: { type: String },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING_FACULTY,
      index: true,
    },
    requiresHOD: { type: Boolean, default: false },
    assignedFaculty: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedHOD: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    facultyComment: { type: String },
    hodComment: { type: String },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ student: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
