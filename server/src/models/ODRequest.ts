import mongoose, { Document, Schema, Types } from 'mongoose';
import { OD_CATEGORIES, REQUEST_STATUS, RequestStatusType } from '../config/constants.js';

export interface IAffectedSession {
  date: Date;
  period: number;
  subject: Types.ObjectId;
  subjectName?: string;
}

export interface IODRequest extends Document {
  refNo: string;
  student: Types.ObjectId;
  department: Types.ObjectId;
  classSection: Types.ObjectId;
  category: typeof OD_CATEGORIES[number];
  eventName: string;
  organizer: string;
  location: string;
  description: string;
  startDate: Date;
  endDate: Date;
  affectedSessions: IAffectedSession[];
  documentUrl?: string;
  documentName?: string;
  secondaryDocumentUrl?: string;
  secondaryDocumentName?: string;
  declarationSigned: boolean;
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

const AffectedSessionSchema = new Schema<IAffectedSession>(
  {
    date: { type: Date, required: true },
    period: { type: Number, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String },
  },
  { _id: false }
);

const ODRequestSchema = new Schema<IODRequest>(
  {
    refNo: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    classSection: { type: Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    category: { type: String, enum: OD_CATEGORIES, required: true, index: true },
    eventName: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    affectedSessions: [AffectedSessionSchema],
    documentUrl: { type: String },
    documentName: { type: String },
    secondaryDocumentUrl: { type: String },
    secondaryDocumentName: { type: String },
    declarationSigned: { type: Boolean, default: false },
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

ODRequestSchema.index({ student: 1, startDate: 1, endDate: 1 });

export const ODRequest = mongoose.model<IODRequest>('ODRequest', ODRequestSchema);
