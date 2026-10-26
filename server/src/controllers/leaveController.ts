import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { ODRequest } from '../models/ODRequest.js';
import { User } from '../models/User.js';
import { ClassSection } from '../models/ClassSection.js';
import { Department } from '../models/Department.js';
import { ApprovalHistory } from '../models/ApprovalHistory.js';
import { AttendanceService } from '../services/attendanceService.js';
import { ApprovalWorkflowService } from '../services/approvalWorkflowService.js';
import { NotificationService } from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { leaveRequestSchema, approvalActionSchema } from '../validators/index.js';
import { REQUEST_STATUS, ROLES } from '../config/constants.js';

export class LeaveController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const student = await User.findById(req.user.userId)
        .populate('department')
        .populate('classSection');

      if (!student) return sendError(res, 'Student profile not found', 404);

      const validated = leaveRequestSchema.parse(req.body);
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);

      // Check overlapping requests
      const overlappingLeave = await LeaveRequest.findOne({
        student: student._id,
        status: { $in: [REQUEST_STATUS.PENDING_FACULTY, REQUEST_STATUS.PENDING_HOD, REQUEST_STATUS.APPROVED] },
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      });

      if (overlappingLeave) {
        return sendError(
          res,
          `You already have an active Leave request (${overlappingLeave.refNo}) overlapping with these dates.`,
          400
        );
      }

      const overlappingOD = await ODRequest.findOne({
        student: student._id,
        status: { $in: [REQUEST_STATUS.PENDING_FACULTY, REQUEST_STATUS.PENDING_HOD, REQUEST_STATUS.APPROVED] },
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      });

      if (overlappingOD) {
        return sendError(
          res,
          `You already have an active OD request (${overlappingOD.refNo}) overlapping with these dates.`,
          400
        );
      }

      let assignedFacultyId: Types.ObjectId | undefined;
      let assignedHODId: Types.ObjectId | undefined;

      if (student.classSection) {
        const section = await ClassSection.findById(student.classSection);
        if (section?.facultyAdvisor) {
          assignedFacultyId = section.facultyAdvisor;
        }
      }

      if (student.department) {
        const dept = await Department.findById(student.department);
        if (dept?.hod) {
          assignedHODId = dept.hod;
        }
      }

      const policy = await AttendanceService.getActivePolicy();
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const requiresHOD = durationDays > policy.hodApprovalRequiredDays;

      const year = new Date().getFullYear();
      const count = await LeaveRequest.countDocuments();
      const refNo = `LV-${year}-${String(count + 1001).padStart(5, '0')}`;

      let documentUrl = '';
      let documentName = '';
      if (req.file) {
        documentUrl = `/uploads/${req.file.filename}`;
        documentName = req.file.originalname;
      }

      const leave = await LeaveRequest.create({
        refNo,
        student: student._id,
        department: student.department?._id || student.department,
        classSection: student.classSection?._id || student.classSection,
        leaveType: validated.leaveType,
        reason: validated.reason,
        startDate,
        endDate,
        documentUrl,
        documentName,
        status: REQUEST_STATUS.PENDING_FACULTY,
        requiresHOD,
        assignedFaculty: assignedFacultyId,
        assignedHOD: assignedHODId,
      });

      await ApprovalHistory.create({
        requestId: leave._id,
        requestModel: 'LeaveRequest',
        approver: student._id,
        role: ROLES.STUDENT,
        action: 'SUBMITTED',
        comments: 'Leave application submitted by student',
        previousStatus: 'None',
        newStatus: REQUEST_STATUS.PENDING_FACULTY,
        timestamp: new Date(),
      });

      if (assignedFacultyId) {
        await NotificationService.createNotification(
          assignedFacultyId,
          `New Leave Application: ${leave.refNo}`,
          `${student.name} applied for ${leave.leaveType} from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
          'ACTION_REQUIRED',
          `/approvals/${leave._id}`
        );
      }

      await NotificationService.createNotification(
        student._id,
        'Leave Application Submitted',
        `Your leave request ${leave.refNo} has been forwarded to your faculty advisor.`,
        'SUCCESS',
        `/requests/${leave._id}`
      );

      return sendSuccess(res, leave, 'Leave application submitted successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const {
        status,
        leaveType,
        studentId,
        search,
        startDate,
        endDate,
        page = '1',
        limit = '10',
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const query: any = {};

      if (req.user.role === ROLES.STUDENT) {
        query.student = new Types.ObjectId(req.user.userId);
      } else if (req.user.role === ROLES.FACULTY) {
        const me = await User.findById(req.user.userId);
        if (studentId) {
          query.student = new Types.ObjectId(studentId as string);
        } else {
          query.$or = [
            { assignedFaculty: new Types.ObjectId(req.user.userId) },
            { department: me?.department },
          ];
        }
      } else if (req.user.role === ROLES.HOD) {
        const me = await User.findById(req.user.userId);
        if (me?.department) {
          query.department = me.department;
        }
      }

      if (status && status !== 'All') {
        query.status = status;
      }
      if (leaveType && leaveType !== 'All') {
        query.leaveType = leaveType;
      }
      if (studentId && req.user.role !== ROLES.STUDENT) {
        query.student = new Types.ObjectId(studentId as string);
      }
      if (startDate && endDate) {
        query.startDate = { $gte: new Date(startDate as string) };
        query.endDate = { $lte: new Date(endDate as string) };
      }

      if (search && typeof search === 'string' && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const matchingUsers = await User.find({
          $or: [{ name: searchRegex }, { registerNumber: searchRegex }],
        }).select('_id');

        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { refNo: searchRegex },
            { reason: searchRegex },
            { student: { $in: matchingUsers.map((u) => u._id) } },
          ],
        });
      }

      const [items, total] = await Promise.all([
        LeaveRequest.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('student', 'name registerNumber email avatar')
          .populate('department', 'name code')
          .populate('classSection', 'name semester')
          .populate('assignedFaculty', 'name')
          .populate('assignedHOD', 'name'),
        LeaveRequest.countDocuments(query),
      ]);

      return sendSuccess(res, items, 'Leave requests fetched successfully', 200, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;

      const leave = await LeaveRequest.findById(id)
        .populate('student', 'name registerNumber email phone avatar')
        .populate('department', 'name code')
        .populate('classSection', 'name semester')
        .populate('assignedFaculty', 'name staffId email')
        .populate('assignedHOD', 'name staffId email');

      if (!leave) {
        return sendError(res, 'Leave Request not found', 404);
      }

      const history = await ApprovalHistory.find({ requestId: leave._id })
        .sort({ timestamp: 1 })
        .populate('approver', 'name role email');

      return sendSuccess(
        res,
        {
          request: leave,
          history,
        },
        'Leave request details fetched'
      );
    } catch (err) {
      next(err);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const id = req.params.id as string;
      const { comments } = req.body;

      const result = await ApprovalWorkflowService.processDecision(
        id,
        'LeaveRequest',
        req.user.userId,
        req.user.role,
        'APPROVE',
        comments
      );

      return sendSuccess(res, result.request, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const id = req.params.id as string;
      const { comments } = approvalActionSchema.parse({
        action: 'REJECT',
        comments: req.body.comments,
      });

      const result = await ApprovalWorkflowService.processDecision(
        id,
        'LeaveRequest',
        req.user.userId,
        req.user.role,
        'REJECT',
        comments
      );

      return sendSuccess(res, result.request, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const id = req.params.id as string;
      const result = await ApprovalWorkflowService.cancelRequestByStudent(
        id,
        'LeaveRequest',
        req.user.userId
      );

      return sendSuccess(res, result.request, result.message);
    } catch (err) {
      next(err);
    }
  }
}
