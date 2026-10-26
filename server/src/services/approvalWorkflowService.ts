import { Types } from 'mongoose';
import { ODRequest, IODRequest } from '../models/ODRequest.js';
import { LeaveRequest, ILeaveRequest } from '../models/LeaveRequest.js';
import { ApprovalHistory } from '../models/ApprovalHistory.js';
import { User } from '../models/User.js';
import { AttendanceService } from './attendanceService.js';
import { NotificationService } from './notificationService.js';
import { REQUEST_STATUS, ROLES, RoleType } from '../config/constants.js';

export class ApprovalWorkflowService {
  static async processDecision(
    requestId: string,
    requestType: 'ODRequest' | 'LeaveRequest',
    approverId: string,
    approverRole: RoleType,
    action: 'APPROVE' | 'REJECT',
    comments?: string
  ): Promise<{ success: boolean; message: string; request: any }> {
    const isOD = requestType === 'ODRequest';
    const Model: any = isOD ? ODRequest : LeaveRequest;

    const request = await Model.findById(requestId).populate('student', 'name email department classSection');
    if (!request) {
      throw new Error(`${requestType} not found.`);
    }

    const previousStatus = request.status;

    // Check valid state transitions
    if (previousStatus === REQUEST_STATUS.APPROVED) {
      throw new Error('This request has already been approved and cannot be modified.');
    }
    if (previousStatus === REQUEST_STATUS.REJECTED) {
      throw new Error('This request has already been rejected.');
    }
    if (previousStatus === REQUEST_STATUS.CANCELLED) {
      throw new Error('This request has been cancelled by the student.');
    }

    let newStatus: string = previousStatus;

    if (previousStatus === REQUEST_STATUS.PENDING_FACULTY) {
      // Faculty approval step
      if (approverRole !== ROLES.FACULTY && approverRole !== ROLES.ADMIN) {
        throw new Error('Only faculty (or admin) can review requests in Pending Faculty status.');
      }

      if (action === 'REJECT') {
        newStatus = REQUEST_STATUS.REJECTED;
        request.status = newStatus as any;
        request.rejectionReason = comments;
        request.facultyComment = comments;
        request.rejectedAt = new Date();
      } else {
        request.facultyComment = comments || 'Approved by Faculty Advisor';

        if (request.requiresHOD) {
          newStatus = REQUEST_STATUS.PENDING_HOD;
          request.status = newStatus as any;
        } else {
          newStatus = REQUEST_STATUS.APPROVED;
          request.status = newStatus as any;
          request.approvedAt = new Date();
        }
      }
    } else if (previousStatus === REQUEST_STATUS.PENDING_HOD) {
      // HOD approval step
      if (approverRole !== ROLES.HOD && approverRole !== ROLES.ADMIN) {
        throw new Error('Only the Head of Department (HOD) or Admin can review requests in Pending HOD status.');
      }

      if (action === 'REJECT') {
        newStatus = REQUEST_STATUS.REJECTED;
        request.status = newStatus as any;
        request.rejectionReason = comments;
        request.hodComment = comments;
        request.rejectedAt = new Date();
      } else {
        newStatus = REQUEST_STATUS.APPROVED;
        request.status = newStatus as any;
        request.hodComment = comments || 'Approved by HOD';
        request.approvedAt = new Date();
      }
    } else {
      throw new Error(`Invalid state transition from current status: ${previousStatus}`);
    }

    await request.save();

    // Record immutable audit history
    await ApprovalHistory.create({
      requestId: request._id,
      requestModel: requestType,
      approver: new Types.ObjectId(approverId),
      role: approverRole,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      comments: comments || '',
      previousStatus,
      newStatus,
      timestamp: new Date(),
    });

    // If final approval, process attendance
    if (newStatus === REQUEST_STATUS.APPROVED) {
      if (isOD) {
        await AttendanceService.processApprovedODAttendance(request._id);
      }
      // Send Student notification
      await NotificationService.createNotification(
        request.student._id,
        `${isOD ? 'OD' : 'Leave'} Request Approved!`,
        `Your request (${request.refNo}) has received final approval. Attendance updated accordingly.`,
        'SUCCESS',
        `/requests/${request._id}`
      );
    } else if (newStatus === REQUEST_STATUS.PENDING_HOD) {
      // Notify HOD
      if (request.assignedHOD) {
        await NotificationService.createNotification(
          request.assignedHOD,
          `Pending HOD Approval: ${request.refNo}`,
          `A new request (${request.refNo}) for student ${request.student.name} requires your department approval.`,
          'ACTION_REQUIRED',
          `/approvals/${request._id}`
        );
      }
      // Notify Student
      await NotificationService.createNotification(
        request.student._id,
        `${isOD ? 'OD' : 'Leave'} Forwarded to HOD`,
        `Your request (${request.refNo}) has passed Faculty review and is currently pending HOD endorsement.`,
        'INFO',
        `/requests/${request._id}`
      );
    } else if (newStatus === REQUEST_STATUS.REJECTED) {
      await NotificationService.createNotification(
        request.student._id,
        `${isOD ? 'OD' : 'Leave'} Request Rejected`,
        `Your request (${request.refNo}) was rejected. Reason: ${comments}`,
        'WARNING',
        `/requests/${request._id}`
      );
    }

    return {
      success: true,
      message: `Request ${action.toLowerCase()}d successfully. New status: ${newStatus}`,
      request,
    };
  }

  static async cancelRequestByStudent(
    requestId: string,
    requestType: 'ODRequest' | 'LeaveRequest',
    studentId: string
  ): Promise<{ success: boolean; message: string; request: any }> {
    const isOD = requestType === 'ODRequest';
    const Model: any = isOD ? ODRequest : LeaveRequest;

    const request = await Model.findById(requestId);
    if (!request) {
      throw new Error(`${requestType} not found.`);
    }

    if (request.student.toString() !== studentId.toString()) {
      throw new Error('Unauthorized. You can only cancel your own requests.');
    }

    if (
      request.status !== REQUEST_STATUS.PENDING_FACULTY &&
      request.status !== REQUEST_STATUS.PENDING_HOD
    ) {
      throw new Error(`Cannot cancel request with status "${request.status}". Only pending requests can be cancelled.`);
    }

    const previousStatus = request.status;
    request.status = REQUEST_STATUS.CANCELLED;
    request.cancelledAt = new Date();
    await request.save();

    await ApprovalHistory.create({
      requestId: request._id,
      requestModel: requestType,
      approver: new Types.ObjectId(studentId),
      role: ROLES.STUDENT,
      action: 'CANCELLED',
      comments: 'Cancelled by student before final approval',
      previousStatus,
      newStatus: REQUEST_STATUS.CANCELLED,
      timestamp: new Date(),
    });

    await NotificationService.createNotification(
      studentId,
      'Request Cancelled',
      `Your request (${request.refNo}) has been successfully cancelled.`,
      'INFO'
    );

    return {
      success: true,
      message: 'Request cancelled successfully.',
      request,
    };
  }
}
