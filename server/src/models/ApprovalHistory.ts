import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApprovalHistory extends Document {
  requestId: Types.ObjectId;
  requestModel: 'ODRequest' | 'LeaveRequest';
  approver: Types.ObjectId;
  role: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comments?: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>(
  {
    requestId: { type: Schema.Types.ObjectId, required: true, index: true },
    requestModel: { type: String, enum: ['ODRequest', 'LeaveRequest'], required: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    action: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
      required: true,
    },
    comments: { type: String },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ApprovalHistorySchema.index({ requestId: 1, timestamp: -1 });

export const ApprovalHistory = mongoose.model<IApprovalHistory>('ApprovalHistory', ApprovalHistorySchema);
