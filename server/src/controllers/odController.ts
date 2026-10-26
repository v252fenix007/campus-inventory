import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ODRequest, IODRequest } from '../models/ODRequest.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { ClassSection } from '../models/ClassSection.js';
import { Department } from '../models/Department.js';
import { ApprovalHistory } from '../models/ApprovalHistory.js';
import { AttendancePolicy } from '../models/AttendancePolicy.js';
import { AttendanceService } from '../services/attendanceService.js';
import { ApprovalWorkflowService } from '../services/approvalWorkflowService.js';
import { NotificationService } from '../services/notificationService.js';
import { ReportService } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { odRequestSchema, approvalActionSchema } from '../validators/index.js';
import { REQUEST_STATUS, ROLES } from '../config/constants.js';

export class ODController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      // Student verification
      const student = await User.findById(req.user.userId)
        .populate('department')
        .populate('classSection');

      if (!student) return sendError(res, 'Student profile not found', 404);

      // Parse body (support both JSON and multipart form data)
      let parsedBody: any = { ...req.body };
      if (typeof parsedBody.declarationSigned === 'string') {
        parsedBody.declarationSigned = parsedBody.declarationSigned === 'true';
      }
      if (typeof parsedBody.affectedSessions === 'string') {
        try {
          parsedBody.affectedSessions = JSON.parse(parsedBody.affectedSessions);
        } catch {
          parsedBody.affectedSessions = [];
        }
      }

      const validated = odRequestSchema.parse(parsedBody);
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);

      // 1. Check for overlapping active requests
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
          `You already have an active OD request (${overlappingOD.refNo}) overlapping with the selected dates (${new Date(overlappingOD.startDate).toLocaleDateString()} - ${new Date(overlappingOD.endDate).toLocaleDateString()}).`,
          400
        );
      }

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
          `You already have an active Leave request (${overlappingLeave.refNo}) overlapping with the selected dates.`,
          400
        );
      }

      // 2. Determine assigned Faculty & HOD
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

      // 3. Determine if HOD approval is required
      const policy = await AttendanceService.getActivePolicy();
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const requiresHOD =
        durationDays > policy.hodApprovalRequiredDays ||
        policy.categoriesRequiringHOD.includes(validated.category);

      // 4. Generate unique reference number
      const year = new Date().getFullYear();
      const count = await ODRequest.countDocuments();
      const refNo = `OD-${year}-${String(count + 1001).padStart(5, '0')}`;

      // 5. Handle file upload (primary and secondary/duplicate document)
      let documentUrl = '';
      let documentName = '';
      let secondaryDocumentUrl = '';
      let secondaryDocumentName = '';

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const primaryFile = files?.['document']?.[0] || req.file;
      const secondaryFile = files?.['secondaryDocument']?.[0];

      if (primaryFile) {
        documentUrl = `/uploads/${primaryFile.filename}`;
        documentName = primaryFile.originalname;
      }

      if (secondaryFile) {
        secondaryDocumentUrl = `/uploads/${secondaryFile.filename}`;
        secondaryDocumentName = secondaryFile.originalname;
      }

      // 6. Create ODRequest
      const od = await ODRequest.create({
        refNo,
        student: student._id,
        department: student.department?._id || student.department,
        classSection: student.classSection?._id || student.classSection,
        category: validated.category,
        eventName: validated.eventName,
        organizer: validated.organizer,
        location: validated.location,
        description: validated.description,
        startDate,
        endDate,
        affectedSessions: validated.affectedSessions || [],
        documentUrl,
        documentName,
        secondaryDocumentUrl,
        secondaryDocumentName,
        declarationSigned: validated.declarationSigned,
        status: REQUEST_STATUS.PENDING_FACULTY,
        requiresHOD,
        assignedFaculty: assignedFacultyId,
        assignedHOD: assignedHODId,
      });

      // Record initial history
      await ApprovalHistory.create({
        requestId: od._id,
        requestModel: 'ODRequest',
        approver: student._id,
        role: ROLES.STUDENT,
        action: 'SUBMITTED',
        comments: 'Application submitted by student',
        previousStatus: 'None',
        newStatus: REQUEST_STATUS.PENDING_FACULTY,
        timestamp: new Date(),
      });

      // Notify Faculty Advisor
      if (assignedFacultyId) {
        await NotificationService.createNotification(
          assignedFacultyId,
          `New OD Application: ${od.refNo}`,
          `${student.name} (${student.registerNumber}) applied for ${od.category} OD for ${od.eventName}.`,
          'ACTION_REQUIRED',
          `/approvals/${od._id}`
        );
      }

      // Notify student of successful submission
      await NotificationService.createNotification(
        student._id,
        'OD Application Submitted Successfully',
        `Your OD application ${od.refNo} for ${od.eventName} has been forwarded to your faculty advisor.`,
        'SUCCESS',
        `/requests/${od._id}`
      );

      return sendSuccess(res, od, 'OD application submitted successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const {
        status,
        category,
        studentId,
        departmentId,
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

      // Role enforcement
      if (req.user.role === ROLES.STUDENT) {
        query.student = new Types.ObjectId(req.user.userId);
      } else if (req.user.role === ROLES.FACULTY) {
        // Faculty sees requests assigned to them or in their department
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
      if (category && category !== 'All') {
        query.category = category;
      }
      if (departmentId) {
        query.department = new Types.ObjectId(departmentId as string);
      }
      if (studentId && req.user.role !== ROLES.STUDENT) {
        query.student = new Types.ObjectId(studentId as string);
      }
      if (startDate && endDate) {
        query.startDate = { $gte: new Date(startDate as string) };
        query.endDate = { $lte: new Date(endDate as string) };
      }

      // Search by student name / regNo or refNo
      if (search && typeof search === 'string' && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const matchingUsers = await User.find({
          $or: [{ name: searchRegex }, { registerNumber: searchRegex }],
        }).select('_id');

        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { refNo: searchRegex },
            { eventName: searchRegex },
            { student: { $in: matchingUsers.map((u) => u._id) } },
          ],
        });
      }

      const [items, total] = await Promise.all([
        ODRequest.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('student', 'name registerNumber email avatar')
          .populate('department', 'name code')
          .populate('classSection', 'name semester')
          .populate('assignedFaculty', 'name')
          .populate('assignedHOD', 'name'),
        ODRequest.countDocuments(query),
      ]);

      return sendSuccess(res, items, 'OD requests fetched successfully', 200, {
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

      const od = await ODRequest.findById(id)
        .populate('student', 'name registerNumber email phone avatar')
        .populate('department', 'name code')
        .populate('classSection', 'name semester')
        .populate('assignedFaculty', 'name staffId email')
        .populate('assignedHOD', 'name staffId email');

      if (!od) {
        return sendError(res, 'OD Request not found', 404);
      }

      // Fetch audit & approval history
      const history = await ApprovalHistory.find({ requestId: od._id })
        .sort({ timestamp: 1 })
        .populate('approver', 'name role email');

      return sendSuccess(
        res,
        {
          request: od,
          history,
        },
        'OD request details fetched'
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
        'ODRequest',
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
        'ODRequest',
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
        'ODRequest',
        req.user.userId
      );

      return sendSuccess(res, result.request, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async downloadReceipt(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = req.params.id as string;
      const pdfBuffer = await ReportService.generateODReceiptPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="OD-Receipt-${id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}
