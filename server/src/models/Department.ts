import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  hod?: Types.ObjectId;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    hod: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
