import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { TimetableSession } from '../models/TimetableSession.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export class TimetableController {
  static async getByClass(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const classSectionId = req.params.classSectionId as string;

      const sessions = await TimetableSession.find({
        classSection: new Types.ObjectId(classSectionId),
      })
        .populate('subject', 'code name credits')
        .populate('faculty', 'name staffId')
        .sort({ dayOfWeek: 1, period: 1 });

      return sendSuccess(res, sessions, 'Timetable sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async calculateAffected(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return sendError(res, 'Both startDate and endDate query parameters are required', 400);
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (end < start) {
        return sendError(res, 'endDate cannot be before startDate', 400);
      }

      const student = await User.findById(req.user.userId);
      if (!student || !student.classSection) {
        return sendSuccess(res, [], 'No class section assigned to student');
      }

      // Collect all dates between start and end
      const dates: Date[] = [];
      const current = new Date(start);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      const affectedSessions: any[] = [];

      for (const d of dates) {
        const dayIndex = d.getDay();
        const dayName = DAYS_OF_WEEK[dayIndex];

        // Sunday is holiday, skip
        if (dayName === 'Sunday') continue;

        const sessionsForDay = await TimetableSession.find({
          classSection: student.classSection,
          dayOfWeek: dayName,
        })
          .populate('subject', 'code name')
          .sort({ period: 1 });

        for (const session of sessionsForDay) {
          const subj = session.subject as any;
          affectedSessions.push({
            date: d.toISOString().split('T')[0],
            period: session.period,
            startTime: session.startTime,
            endTime: session.endTime,
            subject: subj?._id,
            subjectCode: subj?.code,
            subjectName: subj?.name,
            room: session.room,
          });
        }
      }

      return sendSuccess(
        res,
        affectedSessions,
        `Calculated ${affectedSessions.length} affected academic sessions across ${dates.length} day(s)`
      );
    } catch (err) {
      next(err);
    }
  }
}
