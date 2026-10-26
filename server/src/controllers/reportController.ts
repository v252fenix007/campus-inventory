import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { ODRequest } from '../models/ODRequest.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { ReportService } from '../services/reportService.js';
import { sendError } from '../utils/apiResponse.js';

export class ReportController {
  static async exportAttendanceCSV(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { classSectionId, departmentId, startDate, endDate } = req.query;

      const query: any = {};
      if (classSectionId) query.classSection = new Types.ObjectId(classSectionId as string);
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }

      const records = await AttendanceRecord.find(query)
        .populate('student', 'name registerNumber')
        .populate('classSection', 'name')
        .populate('subject', 'code name')
        .populate('correctedBy', 'name')
        .sort({ date: -1, period: 1 });

      const csvContent = ReportService.generateAttendanceCSV(records);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
      return res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  static async exportODRequestsCSV(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { status, category, departmentId } = req.query;

      const query: any = {};
      if (status && status !== 'All') query.status = status;
      if (category && category !== 'All') query.category = category;
      if (departmentId) query.department = new Types.ObjectId(departmentId as string);

      const requests = await ODRequest.find(query)
        .populate('student', 'name registerNumber')
        .sort({ createdAt: -1 });

      const csvContent = ReportService.generateRequestsCSV(requests, 'OD');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="od-requests-report.csv"');
      return res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  static async exportLeaveRequestsCSV(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { status, leaveType } = req.query;

      const query: any = {};
      if (status && status !== 'All') query.status = status;
      if (leaveType && leaveType !== 'All') query.leaveType = leaveType;

      const requests = await LeaveRequest.find(query)
        .populate('student', 'name registerNumber')
        .sort({ createdAt: -1 });

      const csvContent = ReportService.generateRequestsCSV(requests, 'Leave');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leave-requests-report.csv"');
      return res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}
