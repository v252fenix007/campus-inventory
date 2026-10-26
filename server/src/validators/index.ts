import { z } from 'zod';
import { OD_CATEGORIES, LEAVE_TYPES, ATTENDANCE_STATUS, ROLES } from '../config/constants.js';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([ROLES.STUDENT, ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN]),
  department: z.string().optional(),
  classSection: z.string().optional(),
  registerNumber: z.string().optional(),
  staffId: z.string().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum([ROLES.STUDENT, ROLES.FACULTY, ROLES.HOD, ROLES.ADMIN]).optional(),
  department: z.string().optional(),
  classSection: z.string().optional(),
  registerNumber: z.string().optional(),
  staffId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const affectedSessionSchema = z.object({
  date: z.string().or(z.date()),
  period: z.number().int().min(1).max(10),
  subject: z.string().min(1, 'Subject ID is required'),
  subjectName: z.string().optional(),
});

export const odRequestSchema = z
  .object({
    category: z.enum(OD_CATEGORIES as any, {
      message: 'Invalid OD category',
    }),
    eventName: z.string().min(3, 'Event name must be at least 3 characters'),
    organizer: z.string().min(2, 'Organizer must be at least 2 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    affectedSessions: z.array(affectedSessionSchema).optional().default([]),
    declarationSigned: z.boolean().refine((val) => val === true, {
      message: 'You must sign the student declaration checkbox',
    }),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPES as any, {
      message: 'Invalid leave type',
    }),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const approvalActionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    comments: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT') {
        return !!data.comments && data.comments.trim().length >= 5;
      }
      return true;
    },
    {
      message: 'A detailed reason (at least 5 characters) is required when rejecting a request',
      path: ['comments'],
    }
  );

export const manualAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  date: z.string().min(1, 'Date is required'),
  period: z.number().int().min(1).max(10),
  subjectId: z.string().min(1, 'Subject ID is required'),
  classSectionId: z.string().min(1, 'Class section ID is required'),
  status: z.enum([
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.ABSENT,
    ATTENDANCE_STATUS.OD,
    ATTENDANCE_STATUS.LEAVE,
    ATTENDANCE_STATUS.HOLIDAY,
  ]),
  correctionReason: z.string().min(5, 'Mandatory correction reason must be at least 5 characters'),
});

export const attendancePolicySchema = z.object({
  odCountsAsPresent: z.boolean().optional(),
  leaveCountsAsPresent: z.boolean().optional(),
  minAttendancePercentage: z.number().min(0).max(100).optional(),
  hodApprovalRequiredDays: z.number().min(1).max(30).optional(),
  categoriesRequiringHOD: z.array(z.string()).optional(),
  allowStudentCancelPending: z.boolean().optional(),
});
