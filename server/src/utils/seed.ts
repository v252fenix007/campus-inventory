import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { ClassSection } from '../models/ClassSection.js';
import { Subject } from '../models/Subject.js';
import { TimetableSession } from '../models/TimetableSession.js';
import { AttendancePolicy } from '../models/AttendancePolicy.js';
import { ODRequest } from '../models/ODRequest.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { ApprovalHistory } from '../models/ApprovalHistory.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, REQUEST_STATUS, ATTENDANCE_STATUS, OD_CATEGORIES, LEAVE_TYPES } from '../config/constants.js';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusflow';
  console.log(`Connecting to MongoDB for seeding at: ${uri}`);
  await mongoose.connect(uri);

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    ClassSection.deleteMany({}),
    Subject.deleteMany({}),
    TimetableSession.deleteMany({}),
    AttendancePolicy.deleteMany({}),
    ODRequest.deleteMany({}),
    LeaveRequest.deleteMany({}),
    ApprovalHistory.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('1. Seeding Attendance Policy...');
  const policy = await AttendancePolicy.create({
    name: 'National Accreditation College Attendance Policy',
    odCountsAsPresent: true,
    leaveCountsAsPresent: false,
    minAttendancePercentage: 75,
    hodApprovalRequiredDays: 2,
    categoriesRequiringHOD: ['Internship', 'Sports', 'Symposium'],
    allowStudentCancelPending: true,
  });

  console.log('2. Seeding Departments...');
  const cseDept = await Department.create({
    code: 'CSE',
    name: 'Computer Science and Engineering',
  });
  const eceDept = await Department.create({
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
  });
  const itDept = await Department.create({
    code: 'IT',
    name: 'Information Technology',
  });
  const mechDept = await Department.create({
    code: 'MECH',
    name: 'Mechanical Engineering',
  });

  console.log('3. Seeding Key Staff & Admin Users...');
  const admin = await User.create({
    name: 'Dr. Sarah Jenkins',
    email: 'admin@campusflow.edu',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    staffId: 'ADM-001',
    phone: '+91 98765 43210',
    isActive: true,
  });

  const hodCSE = await User.create({
    name: 'Dr. Alan Turing',
    email: 'hod@campusflow.edu',
    password: 'Hod@123',
    role: ROLES.HOD,
    department: cseDept._id,
    staffId: 'HOD-CSE-01',
    phone: '+91 98765 43211',
    isActive: true,
  });
  cseDept.hod = hodCSE._id;
  await cseDept.save();

  const facultyAdvisor = await User.create({
    name: 'Prof. Grace Hopper',
    email: 'faculty@campusflow.edu',
    password: 'Faculty@123',
    role: ROLES.FACULTY,
    department: cseDept._id,
    staffId: 'FAC-CSE-101',
    phone: '+91 98765 43212',
    isActive: true,
  });

  const faculty2 = await User.create({
    name: 'Prof. Donald Knuth',
    email: 'prof.knuth@campusflow.edu',
    password: 'Faculty@123',
    role: ROLES.FACULTY,
    department: cseDept._id,
    staffId: 'FAC-CSE-102',
    phone: '+91 98765 43213',
    isActive: true,
  });

  console.log('4. Seeding Classes & Sections...');
  const class6A = await ClassSection.create({
    name: 'CSE-A',
    department: cseDept._id,
    semester: 6,
    academicYear: '2025-2026',
    facultyAdvisor: facultyAdvisor._id,
  });

  const class6B = await ClassSection.create({
    name: 'CSE-B',
    department: cseDept._id,
    semester: 6,
    academicYear: '2025-2026',
    facultyAdvisor: faculty2._id,
  });

  console.log('5. Seeding Subjects...');
  const subjMC = await Subject.create({
    code: 'CS8601',
    name: 'Mobile Computing',
    department: cseDept._id,
    semester: 6,
    credits: 3,
    faculty: facultyAdvisor._id,
  });
  const subjCD = await Subject.create({
    code: 'CS8602',
    name: 'Compiler Design',
    department: cseDept._id,
    semester: 6,
    credits: 4,
    faculty: faculty2._id,
  });
  const subjDS = await Subject.create({
    code: 'CS8603',
    name: 'Distributed Systems',
    department: cseDept._id,
    semester: 6,
    credits: 3,
    faculty: hodCSE._id,
  });
  const subjAI = await Subject.create({
    code: 'CS8604',
    name: 'Artificial Intelligence & Machine Learning',
    department: cseDept._id,
    semester: 6,
    credits: 3,
    faculty: facultyAdvisor._id,
  });
  const subjIP = await Subject.create({
    code: 'CS8651',
    name: 'Internet Programming',
    department: cseDept._id,
    semester: 6,
    credits: 3,
    faculty: faculty2._id,
  });

  console.log('6. Seeding Students...');
  const student1 = await User.create({
    name: 'Alex Johnson',
    email: 'student@campusflow.edu',
    password: 'Student@123',
    role: ROLES.STUDENT,
    department: cseDept._id,
    classSection: class6A._id,
    registerNumber: '21CSR042',
    phone: '+91 98401 23456',
    isActive: true,
  });

  const student2 = await User.create({
    name: 'Priya Sharma',
    email: 'priya.sharma@campusflow.edu',
    password: 'Student@123',
    role: ROLES.STUDENT,
    department: cseDept._id,
    classSection: class6A._id,
    registerNumber: '21CSR088',
    phone: '+91 98401 23457',
    isActive: true,
  });

  console.log('7. Seeding Weekly Timetable for CSE-A...');
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  const subjectRotation = [subjMC, subjCD, subjDS, subjAI, subjIP];
  const times = [
    { start: '09:00', end: '09:50' },
    { start: '09:50', end: '10:40' },
    { start: '11:00', end: '11:50' },
    { start: '11:50', end: '12:40' },
    { start: '01:30', end: '02:20' },
  ];

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    for (let p = 1; p <= 5; p++) {
      const subj = subjectRotation[(d + p - 1) % subjectRotation.length];
      await TimetableSession.create({
        classSection: class6A._id,
        dayOfWeek: day,
        period: p,
        startTime: times[p - 1].start,
        endTime: times[p - 1].end,
        subject: subj._id,
        faculty: subj.faculty,
        room: `Lab-CS30${p}`,
      });
    }
  }

  console.log('8. Seeding Historical Attendance Records...');
  // Generate 20 instructional days in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastDates: Date[] = [];
  for (let i = 25; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      pastDates.push(date);
    }
  }

  for (const date of pastDates) {
    for (let p = 1; p <= 5; p++) {
      const subj = subjectRotation[(date.getDay() + p) % subjectRotation.length];

      // Alex attendance pattern (Mostly present, a couple of absents, OD on day 10)
      let alexStatus: any = ATTENDANCE_STATUS.PRESENT;
      let alexRemarks = 'Regular session attended';

      if (date.getDate() === 5 && p >= 3) {
        alexStatus = ATTENDANCE_STATUS.ABSENT;
        alexRemarks = 'Unexcused absence';
      }

      await AttendanceRecord.create({
        student: student1._id,
        date,
        period: p,
        subject: subj._id,
        classSection: class6A._id,
        status: alexStatus,
        remarks: alexRemarks,
      });

      // Priya attendance (High attendance)
      await AttendanceRecord.create({
        student: student2._id,
        date,
        period: p,
        subject: subj._id,
        classSection: class6A._id,
        status: ATTENDANCE_STATUS.PRESENT,
        remarks: 'Present in class',
      });
    }
  }

  console.log('9. Seeding Demo OD Requests...');
  // 1. Approved OD Request (Academic Event)
  const approvedOdDate = new Date(today);
  approvedOdDate.setDate(approvedOdDate.getDate() - 3);

  const approvedOD = await ODRequest.create({
    refNo: 'OD-2026-00101',
    student: student1._id,
    department: cseDept._id,
    classSection: class6A._id,
    category: 'Symposium',
    eventName: 'KURIOS 2026 – National Technical Symposium',
    organizer: 'PSG College of Technology',
    location: 'Coimbatore, TN',
    description: 'Participated and won 1st prize in the National Level Hackathon on Agentic AI Systems.',
    startDate: approvedOdDate,
    endDate: approvedOdDate,
    affectedSessions: [
      { date: approvedOdDate, period: 1, subject: subjMC._id, subjectName: subjMC.name },
      { date: approvedOdDate, period: 2, subject: subjCD._id, subjectName: subjCD.name },
      { date: approvedOdDate, period: 3, subject: subjDS._id, subjectName: subjDS.name },
      { date: approvedOdDate, period: 4, subject: subjAI._id, subjectName: subjAI.name },
      { date: approvedOdDate, period: 5, subject: subjIP._id, subjectName: subjIP.name },
    ],
    declarationSigned: true,
    status: REQUEST_STATUS.APPROVED,
    requiresHOD: true,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
    facultyComment: 'Excellent performance and certificate verified. Approved with recommendation.',
    hodComment: 'Honored the institution with 1st prize. Approved On-Duty credit granted.',
    approvedAt: approvedOdDate,
  });

  // Map attendance for the approved OD
  for (let p = 1; p <= 5; p++) {
    const subj = subjectRotation[(approvedOdDate.getDay() + p) % subjectRotation.length];
    await AttendanceRecord.findOneAndUpdate(
      { student: student1._id, date: approvedOdDate, period: p },
      {
        $set: {
          status: ATTENDANCE_STATUS.OD,
          odRequestId: approvedOD._id,
          requestRefNo: approvedOD.refNo,
          remarks: `Approved On-Duty: KURIOS 2026 (Symposium)`,
        },
      },
      { upsert: true }
    );
  }

  await ApprovalHistory.create([
    {
      requestId: approvedOD._id,
      requestModel: 'ODRequest',
      approver: student1._id,
      role: ROLES.STUDENT,
      action: 'SUBMITTED',
      comments: 'Initial OD submission',
      previousStatus: 'None',
      newStatus: REQUEST_STATUS.PENDING_FACULTY,
      timestamp: new Date(approvedOdDate.getTime() - 86400000 * 2),
    },
    {
      requestId: approvedOD._id,
      requestModel: 'ODRequest',
      approver: facultyAdvisor._id,
      role: ROLES.FACULTY,
      action: 'APPROVED',
      comments: 'Endorsed for HOD approval',
      previousStatus: REQUEST_STATUS.PENDING_FACULTY,
      newStatus: REQUEST_STATUS.PENDING_HOD,
      timestamp: new Date(approvedOdDate.getTime() - 86400000),
    },
    {
      requestId: approvedOD._id,
      requestModel: 'ODRequest',
      approver: hodCSE._id,
      role: ROLES.HOD,
      action: 'APPROVED',
      comments: 'Final approval granted by Department Head',
      previousStatus: REQUEST_STATUS.PENDING_HOD,
      newStatus: REQUEST_STATUS.APPROVED,
      timestamp: approvedOdDate,
    },
  ]);

  // 2. Pending Faculty Approval OD Request
  const pendingFacultyDate = new Date(today);
  pendingFacultyDate.setDate(pendingFacultyDate.getDate() + 2);
  const pendingFacultyEndDate = new Date(pendingFacultyDate);
  pendingFacultyEndDate.setDate(pendingFacultyEndDate.getDate() + 1);

  const pendingFacultyOD = await ODRequest.create({
    refNo: 'OD-2026-00102',
    student: student1._id,
    department: cseDept._id,
    classSection: class6A._id,
    category: 'Workshop',
    eventName: 'Cloud Native & Kubernetes Masterclass',
    organizer: 'Google Developer Student Clubs (GDSC)',
    location: 'Bangalore Tech Park',
    description: 'Hands-on architectural training in multi-cluster Kubernetes deployments.',
    startDate: pendingFacultyDate,
    endDate: pendingFacultyEndDate,
    affectedSessions: [
      { date: pendingFacultyDate, period: 1, subject: subjMC._id, subjectName: subjMC.name },
      { date: pendingFacultyDate, period: 2, subject: subjCD._id, subjectName: subjCD.name },
    ],
    declarationSigned: true,
    status: REQUEST_STATUS.PENDING_FACULTY,
    requiresHOD: false,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
  });

  await ApprovalHistory.create({
    requestId: pendingFacultyOD._id,
    requestModel: 'ODRequest',
    approver: student1._id,
    role: ROLES.STUDENT,
    action: 'SUBMITTED',
    comments: 'Awaiting faculty review',
    previousStatus: 'None',
    newStatus: REQUEST_STATUS.PENDING_FACULTY,
    timestamp: new Date(),
  });

  // 3. Pending HOD Approval OD Request
  const pendingHodDate = new Date(today);
  pendingHodDate.setDate(pendingHodDate.getDate() + 5);
  const pendingHodEndDate = new Date(pendingHodDate);
  pendingHodEndDate.setDate(pendingHodEndDate.getDate() + 3);

  const pendingHodOD = await ODRequest.create({
    refNo: 'OD-2026-00103',
    student: student2._id,
    department: cseDept._id,
    classSection: class6A._id,
    category: 'Internship',
    eventName: 'Research Internship Onboarding',
    organizer: 'Indian Institute of Science (IISc)',
    location: 'IISc Bangalore',
    description: 'Summer Research Fellowship presentation and lab orientation on distributed graph databases.',
    startDate: pendingHodDate,
    endDate: pendingHodEndDate,
    affectedSessions: [],
    declarationSigned: true,
    status: REQUEST_STATUS.PENDING_HOD,
    requiresHOD: true,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
    facultyComment: 'Prestigious fellowship. Strongly recommended for departmental approval.',
  });

  await ApprovalHistory.create([
    {
      requestId: pendingHodOD._id,
      requestModel: 'ODRequest',
      approver: student2._id,
      role: ROLES.STUDENT,
      action: 'SUBMITTED',
      comments: 'Submitted for faculty review',
      previousStatus: 'None',
      newStatus: REQUEST_STATUS.PENDING_FACULTY,
      timestamp: new Date(today.getTime() - 86400000),
    },
    {
      requestId: pendingHodOD._id,
      requestModel: 'ODRequest',
      approver: facultyAdvisor._id,
      role: ROLES.FACULTY,
      action: 'APPROVED',
      comments: 'Endorsed. Forwarded to HOD for 4-day clearance.',
      previousStatus: REQUEST_STATUS.PENDING_FACULTY,
      newStatus: REQUEST_STATUS.PENDING_HOD,
      timestamp: new Date(),
    },
  ]);

  // 4. Rejected OD Request
  const rejectedOd = await ODRequest.create({
    refNo: 'OD-2026-00104',
    student: student1._id,
    department: cseDept._id,
    classSection: class6A._id,
    category: 'Other',
    eventName: 'Gaming Expo 2026',
    organizer: 'Independent Event Organizers',
    location: 'Chennai Trade Centre',
    description: 'Attending game exhibition as spectator.',
    startDate: new Date(today.getTime() - 86400000 * 10),
    endDate: new Date(today.getTime() - 86400000 * 10),
    affectedSessions: [],
    declarationSigned: true,
    status: REQUEST_STATUS.REJECTED,
    requiresHOD: false,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
    rejectionReason: 'Not an accredited academic event or competition. Spectator attendance does not qualify for On-Duty.',
    facultyComment: 'Not eligible under college On-Duty policy regulations.',
    rejectedAt: new Date(today.getTime() - 86400000 * 9),
  });

  console.log('10. Seeding Demo Leave Requests...');
  // Approved Leave
  const pastLeaveDate = new Date(today);
  pastLeaveDate.setDate(pastLeaveDate.getDate() - 12);

  const approvedLeave = await LeaveRequest.create({
    refNo: 'LV-2026-00041',
    student: student1._id,
    department: cseDept._id,
    classSection: class6A._id,
    leaveType: 'Sick Leave',
    reason: 'Severe viral fever and physician-advised bed rest for 2 days. Medical prescription attached.',
    startDate: pastLeaveDate,
    endDate: new Date(pastLeaveDate.getTime() + 86400000),
    status: REQUEST_STATUS.APPROVED,
    requiresHOD: false,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
    facultyComment: 'Medical fitness certificate submitted. Approved leave recorded.',
    approvedAt: pastLeaveDate,
  });

  // Pending Leave
  const pendingLeave = await LeaveRequest.create({
    refNo: 'LV-2026-00042',
    student: student2._id,
    department: cseDept._id,
    classSection: class6A._id,
    leaveType: 'Personal Leave',
    reason: 'Attending elder sister wedding ceremony in hometown.',
    startDate: new Date(today.getTime() + 86400000 * 4),
    endDate: new Date(today.getTime() + 86400000 * 5),
    status: REQUEST_STATUS.PENDING_FACULTY,
    requiresHOD: false,
    assignedFaculty: facultyAdvisor._id,
    assignedHOD: hodCSE._id,
  });

  console.log('11. Seeding In-App Notifications...');
  await Notification.create([
    {
      recipient: student1._id,
      title: 'OD Request Approved!',
      message: 'Your OD application OD-2026-00101 (KURIOS 2026) was approved. Your attendance has been officially updated.',
      type: 'SUCCESS',
      link: `/requests/${approvedOD._id}`,
      createdAt: approvedOdDate,
    },
    {
      recipient: facultyAdvisor._id,
      title: 'Action Required: Pending OD Approval',
      message: `${student1.name} submitted OD-2026-00102 (Cloud Native & Kubernetes Masterclass) for your review.`,
      type: 'ACTION_REQUIRED',
      link: `/approvals/${pendingFacultyOD._id}`,
      createdAt: new Date(),
    },
    {
      recipient: hodCSE._id,
      title: 'Department Action: Pending HOD Endorsement',
      message: `${student2.name} submitted OD-2026-00103 (IISc Internship) requiring Department Head approval.`,
      type: 'ACTION_REQUIRED',
      link: `/approvals/${pendingHodOD._id}`,
      createdAt: new Date(),
    },
  ]);

  console.log('12. Seeding Audit Logs...');
  await AuditLog.create([
    {
      user: admin._id,
      action: 'SYSTEM_INITIALIZATION',
      resourceType: 'System',
      details: { environment: 'Development', seededModels: 12 },
    },
    {
      user: facultyAdvisor._id,
      action: 'APPROVE_OD_FACULTY',
      resourceType: 'ODRequest',
      resourceId: approvedOD._id.toString(),
      details: { refNo: approvedOD.refNo, studentId: student1._id.toString() },
    },
    {
      user: hodCSE._id,
      action: 'APPROVE_OD_HOD',
      resourceType: 'ODRequest',
      resourceId: approvedOD._id.toString(),
      details: { refNo: approvedOD.refNo, studentId: student1._id.toString() },
    },
  ]);

  console.log('===========================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
  console.log('DEMO ACCOUNTS READY TO TEST:');
  console.log('1. Student:    student@campusflow.edu   / Student@123');
  console.log('2. Faculty:    faculty@campusflow.edu   / Faculty@123');
  console.log('3. HOD:        hod@campusflow.edu       / Hod@123');
  console.log('4. Admin:      admin@campusflow.edu     / Admin@123');
  console.log('===========================================================');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
