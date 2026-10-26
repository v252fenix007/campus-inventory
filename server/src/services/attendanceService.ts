import { Types } from 'mongoose';
import { AttendanceRecord, IAttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendancePolicy, IAttendancePolicy } from '../models/AttendancePolicy.js';
import { ODRequest, IODRequest } from '../models/ODRequest.js';
import { LeaveRequest, ILeaveRequest } from '../models/LeaveRequest.js';
import { TimetableSession } from '../models/TimetableSession.js';
import { AuditLog } from '../models/AuditLog.js';
import { ATTENDANCE_STATUS } from '../config/constants.js';

export interface SubjectAttendanceSummary {
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

export interface StudentAttendanceStats {
  totalSessions: number;
  presentCount: number;
  odCount: number;
  leaveCount: number;
  absentCount: number;
  effectivePercentage: number;
  minPercentageRequired: number;
  isEligible: boolean;
  subjectBreakdown: SubjectAttendanceSummary[];
}

export class AttendanceService {
  static async getActivePolicy(): Promise<IAttendancePolicy> {
    let policy = await AttendancePolicy.findOne();
    if (!policy) {
      policy = await AttendancePolicy.create({
        name: 'Default College Policy',
        odCountsAsPresent: true,
        leaveCountsAsPresent: false,
        minAttendancePercentage: 75,
        hodApprovalRequiredDays: 2,
        categoriesRequiringHOD: ['Internship', 'Sports', 'Symposium'],
      });
    }
    return policy;
  }

  static async calculateStudentAttendance(studentId: Types.ObjectId | string): Promise<StudentAttendanceStats> {
    const policy = await this.getActivePolicy();
    const objectId = new Types.ObjectId(studentId.toString());

    const records = await AttendanceRecord.find({
      student: objectId,
      status: { $ne: ATTENDANCE_STATUS.HOLIDAY },
    }).populate('subject', 'code name');

    let totalSessions = records.length;
    let presentCount = 0;
    let odCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    const subjectsMap = new Map<string, SubjectAttendanceSummary>();

    for (const rec of records) {
      const subj = rec.subject as any;
      const subjId = subj?._id ? subj._id.toString() : 'general';
      const subjCode = subj?.code || 'N/A';
      const subjName = subj?.name || 'General';

      if (!subjectsMap.has(subjId)) {
        subjectsMap.set(subjId, {
          subjectId: subjId,
          subjectCode: subjCode,
          subjectName: subjName,
          totalSessions: 0,
          presentSessions: 0,
          odSessions: 0,
          leaveSessions: 0,
          absentSessions: 0,
          effectivePercentage: 100,
        });
      }

      const summary = subjectsMap.get(subjId)!;
      summary.totalSessions += 1;

      switch (rec.status) {
        case ATTENDANCE_STATUS.PRESENT:
          presentCount++;
          summary.presentSessions++;
          break;
        case ATTENDANCE_STATUS.OD:
          odCount++;
          summary.odSessions++;
          break;
        case ATTENDANCE_STATUS.LEAVE:
          leaveCount++;
          summary.leaveSessions++;
          break;
        case ATTENDANCE_STATUS.ABSENT:
          absentCount++;
          summary.absentSessions++;
          break;
      }
    }

    // Calculate subject-level percentages
    for (const [, summary] of subjectsMap) {
      if (summary.totalSessions > 0) {
        const attended =
          summary.presentSessions +
          (policy.odCountsAsPresent ? summary.odSessions : 0) +
          (policy.leaveCountsAsPresent ? summary.leaveSessions : 0);
        summary.effectivePercentage = Math.round((attended / summary.totalSessions) * 100);
      }
    }

    // Overall attendance calculation
    let effectivePercentage = 100;
    if (totalSessions > 0) {
      const attended =
        presentCount +
        (policy.odCountsAsPresent ? odCount : 0) +
        (policy.leaveCountsAsPresent ? leaveCount : 0);
      effectivePercentage = Math.round((attended / totalSessions) * 100);
    }

    return {
      totalSessions,
      presentCount,
      odCount,
      leaveCount,
      absentCount,
      effectivePercentage,
      minPercentageRequired: policy.minAttendancePercentage,
      isEligible: effectivePercentage >= policy.minAttendancePercentage,
      subjectBreakdown: Array.from(subjectsMap.values()),
    };
  }

  static async processApprovedODAttendance(odRequestId: Types.ObjectId | string): Promise<number> {
    const od = await ODRequest.findById(odRequestId);
    if (!od) return 0;

    let updatedCount = 0;

    // Normalize date to local start of day
    for (const session of od.affectedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      await AttendanceRecord.findOneAndUpdate(
        {
          student: od.student,
          date: sessionDate,
          period: session.period,
        },
        {
          $set: {
            subject: session.subject,
            classSection: od.classSection,
            status: ATTENDANCE_STATUS.OD,
            odRequestId: od._id,
            requestRefNo: od.refNo,
            remarks: `Approved On-Duty: ${od.eventName} (${od.category})`,
          },
        },
        { upsert: true, new: true }
      );
      updatedCount++;
    }

    return updatedCount;
  }

  static async revertAttendanceForRequest(
    requestId: Types.ObjectId | string,
    requestType: 'ODRequest' | 'LeaveRequest'
  ): Promise<number> {
    const objectId = new Types.ObjectId(requestId.toString());
    const query =
      requestType === 'ODRequest'
        ? { odRequestId: objectId }
        : { leaveRequestId: objectId };

    const result = await AttendanceRecord.updateMany(query, {
      $set: {
        status: ATTENDANCE_STATUS.ABSENT,
        remarks: `Reverted due to cancelled/revoked request`,
      },
      $unset: {
        odRequestId: 1,
        leaveRequestId: 1,
        requestRefNo: 1,
      },
    });

    return result.modifiedCount;
  }

  static async recordManualAttendance(
    modifierId: Types.ObjectId | string,
    data: {
      studentId: string;
      date: string;
      period: number;
      subjectId: string;
      classSectionId: string;
      status: string;
      correctionReason: string;
    },
    ipAddress?: string
  ): Promise<IAttendanceRecord> {
    const recDate = new Date(data.date);
    recDate.setHours(0, 0, 0, 0);

    const existing = await AttendanceRecord.findOne({
      student: new Types.ObjectId(data.studentId),
      date: recDate,
      period: data.period,
    });

    const previousStatus = existing ? existing.status : 'None';

    const updated = await AttendanceRecord.findOneAndUpdate(
      {
        student: new Types.ObjectId(data.studentId),
        date: recDate,
        period: data.period,
      },
      {
        $set: {
          subject: new Types.ObjectId(data.subjectId),
          classSection: new Types.ObjectId(data.classSectionId),
          status: data.status,
          correctedBy: new Types.ObjectId(modifierId.toString()),
          previousStatus,
          correctionReason: data.correctionReason,
          remarks: `Manual update: ${data.correctionReason}`,
        },
      },
      { upsert: true, new: true }
    );

    // Audit log entry
    await AuditLog.create({
      user: new Types.ObjectId(modifierId.toString()),
      action: 'MANUAL_ATTENDANCE_CORRECTION',
      resourceType: 'AttendanceRecord',
      resourceId: updated._id.toString(),
      details: {
        studentId: data.studentId,
        date: data.date,
        period: data.period,
        previousStatus,
        newStatus: data.status,
        reason: data.correctionReason,
      },
      ipAddress,
    });

    return updated;
  }
}
