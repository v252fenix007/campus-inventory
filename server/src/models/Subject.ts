import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubject extends Document {
  code: string; // e.g. "CS8501"
  name: string;
  department: Types.ObjectId;
  semester: number;
  credits: number;
  faculty?: Types.ObjectId;
}

const SubjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    semester: { type: Number, required: true },
    credits: { type: Number, default: 3 },
    faculty: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SubjectSchema.index({ code: 1, department: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
