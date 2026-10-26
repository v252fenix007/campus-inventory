export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  HOD: 'hod',
  ADMIN: 'admin',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const REQUEST_STATUS = {
  DRAFT: 'Draft',
  PENDING_FACULTY: 'Pending Faculty Approval',
  PENDING_HOD: 'Pending HOD Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
} as const;

export type RequestStatusType = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const OD_CATEGORIES = [
  'Academic Event',
  'Symposium',
  'Workshop',
  'Competition',
  'Sports',
  'Internship',
  'Other',
] as const;

export const LEAVE_TYPES = [
  'Sick Leave',
  'Personal Leave',
  'Emergency Leave',
  'Other',
] as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  OD: 'OD',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
} as const;

export type AttendanceStatusType = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
