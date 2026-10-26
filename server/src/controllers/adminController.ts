import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { ClassSection } from '../models/ClassSection.js';
import { Subject } from '../models/Subject.js';
import { ODRequest } from '../models/ODRequest.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createUserSchema, updateUserSchema } from '../validators/index.js';
import { ROLES, REQUEST_STATUS, ATTENDANCE_STATUS } from '../config/constants.js';

export class AdminController {
  static async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const [
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalClasses,
        pendingOD,
        pendingLeave,
        approvedOD,
        approvedLeave,
        recentAudits,
      ] = await Promise.all([
        User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
        User.countDocuments({ role: { $in: [ROLES.FACULTY, ROLES.HOD] }, isActive: true }),
        Department.countDocuments(),
        ClassSection.countDocuments(),
        ODRequest.countDocuments({
          status: { $in: [REQUEST_STATUS.PENDING_FACULTY, REQUEST_STATUS.PENDING_HOD] },
        }),
        LeaveRequest.countDocuments({
          status: { $in: [REQUEST_STATUS.PENDING_FACULTY, REQUEST_STATUS.PENDING_HOD] },
        }),
        ODRequest.countDocuments({ status: REQUEST_STATUS.APPROVED }),
        LeaveRequest.countDocuments({ status: REQUEST_STATUS.APPROVED }),
        AuditLog.find()
          .sort({ timestamp: -1 })
          .limit(10)
          .populate('user', 'name role email'),
      ]);

      // Calculate recent attendance distribution
      const recentAttendance = await AttendanceRecord.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const attendanceBreakdown: Record<string, number> = {
        Present: 0,
        Absent: 0,
        OD: 0,
        Leave: 0,
      };

      for (const item of recentAttendance) {
        if (item._id && attendanceBreakdown[item._id] !== undefined) {
          attendanceBreakdown[item._id] = item.count;
        }
      }

      // Monthly application trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const [odMonthly, leaveMonthly] = await Promise.all([
        ODRequest.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        LeaveRequest.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

      return sendSuccess(
        res,
        {
          summary: {
            totalStudents,
            totalFaculty,
            totalDepartments,
            totalClasses,
            pendingOD,
            pendingLeave,
            approvedOD,
            approvedLeave,
          },
          attendanceBreakdown,
          trends: {
            odMonthly,
            leaveMonthly,
          },
          recentAudits,
        },
        'Admin dashboard statistics retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { role, departmentId, search, page = '1', limit = '15' } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 15;
      const skip = (pageNum - 1) * limitNum;

      const query: any = {};
      if (role && role !== 'All') query.role = role;
      if (departmentId) query.department = new Types.ObjectId(departmentId as string);

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { registerNumber: regex },
          { staffId: regex },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('department', 'name code')
          .populate('classSection', 'name semester'),
        User.countDocuments(query),
      ]);

      return sendSuccess(res, users, 'Users retrieved successfully', 200, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const validated = createUserSchema.parse(req.body);

      const existing = await User.findOne({ email: validated.email.toLowerCase() });
      if (existing) {
        return sendError(res, 'Email already registered', 409);
      }

      const user = await User.create({
        ...validated,
        email: validated.email.toLowerCase(),
      });

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user: new Types.ObjectId(req.user.userId),
          action: 'CREATE_USER',
          resourceType: 'User',
          resourceId: user._id.toString(),
          details: { email: user.email, role: user.role },
        });
      }

      const userObj = user.toObject();
      delete userObj.password;

      return sendSuccess(res, userObj, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;
      const validated = updateUserSchema.parse(req.body);

      const user = await User.findByIdAndUpdate(
        id,
        { $set: validated },
        { new: true }
      ).populate('department classSection');

      if (!user) return sendError(res, 'User not found', 404);

      if (req.user) {
        await AuditLog.create({
          user: new Types.ObjectId(req.user.userId),
          action: 'UPDATE_USER',
          resourceType: 'User',
          resourceId: user._id.toString(),
          details: validated,
        });
      }

      return sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user', 'name role email');

      return sendSuccess(res, logs, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMetadata(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const [departments, classes, subjects] = await Promise.all([
        Department.find().populate('hod', 'name email staffId'),
        ClassSection.find().populate('department facultyAdvisor', 'name code staffId'),
        Subject.find().populate('department faculty', 'name code'),
      ]);

      return sendSuccess(res, { departments, classes, subjects }, 'Metadata retrieved');
    } catch (err) {
      next(err);
    }
  }
}
