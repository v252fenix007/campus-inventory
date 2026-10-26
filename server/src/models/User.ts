import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, RoleType } from '../config/constants.js';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: RoleType;
  department?: Types.ObjectId;
  classSection?: Types.ObjectId;
  registerNumber?: string; // For students
  staffId?: string; // For faculty, hod, admin
  phone?: string;
  avatar?: string;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    classSection: { type: Schema.Types.ObjectId, ref: 'ClassSection', index: true },
    registerNumber: { type: String, trim: true, index: true },
    staffId: { type: String, trim: true, index: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
