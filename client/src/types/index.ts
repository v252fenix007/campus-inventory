export type RoleType = 'student' | 'faculty' | 'hod' | 'admin';

export type RequestStatus =
  | 'Draft'
  | 'Pending Faculty Approval'
  | 'Pending HOD Approval'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export type ODCategory =
  | 'Academic Event'
  | 'Symposium'
  | 'Workshop'
  | 'Competition'
  | 'Sports'
  | 'Internship'
  | 'Other';

export type LeaveType = 'Sick Leave' | 'Personal Leave' | 'Emergency Leave' | 'Other';

export type AttendanceStatus = 'Present' | 'Absent' | 'OD' | 'Leave' | 'Holiday';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: RoleType;
  department?: {
    _id: string;
    code: string;
    name: string;
  };
  classSection?: {
    _id: string;
    name: string;
    semester: number;
    facultyAdvisor?: any;
  };
  registerNumber?: string;
  staffId?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

export interface AffectedSession {
  date: string;
  period: number;
  subject: string;
  subjectName?: string;
  subjectCode?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export interface ODRequest {
  _id: string;
  refNo: string;
  student: User;
  department: { _id: string; name: string; code: string };
  classSection: { _id: string; name: string; semester: number };
  category: ODCategory;
  eventName: string;
  organizer: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  affectedSessions: AffectedSession[];
  documentUrl?: string;
  documentName?: string;
  secondaryDocumentUrl?: string;
  secondaryDocumentName?: string;
  declarationSigned: boolean;
  status: RequestStatus;
  requiresHOD: boolean;
  assignedFaculty?: User;
  assignedHOD?: User;
  facultyComment?: string;
  hodComment?: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  _id: string;
  refNo: string;
  student: User;
  department: { _id: string; name: string; code: string };
  classSection: { _id: string; name: string; semester: number };
  leaveType: LeaveType;
  reason: string;
  startDate: string;
  endDate: string;
  documentUrl?: string;
  documentName?: string;
  status: RequestStatus;
  requiresHOD: boolean;
  assignedFaculty?: User;
  assignedHOD?: User;
  facultyComment?: string;
  hodComment?: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistoryItem {
  _id: string;
  requestId: string;
  requestModel: 'ODRequest' | 'LeaveRequest';
  approver: User;
  role: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comments?: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface SubjectSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalSessions: number;
  presentSessions: number;
  odSessions: number;
  leaveSessions: number;
  absentSessions: number;
  effectivePercentage: number;
}

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  odCount: number;
  leaveCount: number;
  absentCount: number;
  effectivePercentage: number;
  minPercentageRequired: number;
  isEligible: boolean;
  subjectBreakdown: SubjectSummary[];
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AttendancePolicy {
  _id: string;
  name: string;
  odCountsAsPresent: boolean;
  leaveCountsAsPresent: boolean;
  minAttendancePercentage: number;
  hodApprovalRequiredDays: number;
  categoriesRequiringHOD: string[];
  allowStudentCancelPending: boolean;
}
