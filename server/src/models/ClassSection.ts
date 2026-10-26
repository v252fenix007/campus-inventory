import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClassSection extends Document {
  name: string; // e.g. "CSE-A"
  department: Types.ObjectId;
  semester: number;
  academicYear: string; // e.g. "2025-2026"
  facultyAdvisor?: Types.ObjectId;
}

const ClassSectionSchema = new Schema<IClassSection>(
  {
    name: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true },
    facultyAdvisor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ClassSectionSchema.index({ name: 1, department: 1, academicYear: 1 }, { unique: true });

export const ClassSection = mongoose.model<IClassSection>('ClassSection', ClassSectionSchema);
