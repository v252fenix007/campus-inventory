import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AttendanceService } from '../services/attendanceService.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendancePolicy } from '../models/AttendancePolicy.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { ClassSection } from '../models/ClassSection.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { manualAttendanceSchema, attendancePolicySchema } from '../validators/index.js';
import { ROLES, ATTENDANCE_STATUS } from '../config/constants.js';

export class AttendanceController {
  static async getMyAttendance(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const stats = await AttendanceService.calculateStudentAttendance(req.user.userId);
      return sendSuccess(res, stats, 'Attendance statistics retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getStudentAttendance(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = req.params.id as string;
      const stats = await AttendanceService.calculateStudentAttendance(id);
      const student = await User.findById(id).select('name registerNumber email department classSection');

      return sendSuccess(res, { student, stats }, 'Student attendance retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getClassAttendance(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const classSectionId = req.params.classSectionId as string;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const records = await AttendanceRecord.find({
        classSection: new Types.ObjectId(classSectionId),
        date: targetDate,
      })
        .populate('student', 'name registerNumber')
        .populate('subject', 'code name')
        .sort({ period: 1 });

      return sendSuccess(res, records, 'Class attendance retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async manualUpdate(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const validated = manualAttendanceSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const record = await AttendanceService.recordManualAttendance(
        req.user.userId,
        validated,
        ipAddress
      );

      // Recalculate new student attendance stats
      const updatedStats = await AttendanceService.calculateStudentAttendance(validated.studentId);

      return sendSuccess(
        res,
        { record, updatedStats },
        'Attendance record successfully updated with audit tracking'
      );
    } catch (err) {
      next(err);
    }
  }

  static async getPolicy(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const policy = await AttendanceService.getActivePolicy();
      return sendSuccess(res, policy, 'Attendance policy retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const validated = attendancePolicySchema.parse(req.body);
      const policy = await AttendancePolicy.findOneAndUpdate(
        {},
        { $set: validated },
        { upsert: true, new: true }
      );

      return sendSuccess(res, policy, 'Attendance policy updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getDepartmentOverview(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const departmentId = req.params.departmentId as string;

      // Find all students in department
      const students = await User.find({
        department: new Types.ObjectId(departmentId),
        role: ROLES.STUDENT,
        isActive: true,
      }).select('_id name registerNumber');

      let totalPresent = 0;
      let totalOD = 0;
      let totalLeave = 0;
      let totalAbsent = 0;
      let totalRecords = 0;

      const studentIds = students.map((s) => s._id);

      const records = await AttendanceRecord.find({
        student: { $in: studentIds },
      });

      for (const r of records) {
        totalRecords++;
        if (r.status === ATTENDANCE_STATUS.PRESENT) totalPresent++;
        else if (r.status === ATTENDANCE_STATUS.OD) totalOD++;
        else if (r.status === ATTENDANCE_STATUS.LEAVE) totalLeave++;
        else if (r.status === ATTENDANCE_STATUS.ABSENT) totalAbsent++;
      }

      const overallPercentage =
        totalRecords > 0
          ? Math.round(((totalPresent + totalOD) / totalRecords) * 100)
          : 100;

      return sendSuccess(
        res,
        {
          studentCount: students.length,
          totalRecords,
          totalPresent,
          totalOD,
          totalLeave,
          totalAbsent,
          overallPercentage,
        },
        'Department attendance overview retrieved'
      );
    } catch (err) {
      next(err);
    }
  }
}
