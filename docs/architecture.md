# CampusFlow – Architectural Design Document

## 1. System Overview
**CampusFlow** is a centralized, production-grade web platform engineered to eliminate manual paper and WhatsApp-based tracking of student On-Duty (OD) and leave requests across academic institutions. It provides a secure, role-based workflow with automated attendance synchronization, audit logging, and accreditation-ready analytics.

```
       +--------------------------------------------------------------+
       |                      CampusFlow UI Client                     |
       |  React 19 + TypeScript + Vite + Tailwind CSS + Lucide React  |
       +-------------------------------+------------------------------+
                                       |
                              REST API | JSON / Multipart
                                       v
       +--------------------------------------------------------------+
       |                      Express.js API Layer                    |
       |  Helmet | CORS | Morgan | JWT Auth | Zod Request Validators  |
       +-------------------------------+------------------------------+
                                       |
             +-------------------------+-------------------------+
             |                         |                         |
             v                         v                         v
     +---------------+         +---------------+         +---------------+
     | Auth Service  |         | Workflow Svc  |         | Attendance Svc|
     | RBAC & BCrypt |         | State Machine |         | Timetable Map |
     +---------------+         +---------------+         +---------------+
             |                         |                         |
             +-------------------------+-------------------------+
                                       |
                                       v
       +--------------------------------------------------------------+
       |                  MongoDB Persistence Layer                   |
       |       Mongoose ODM • Indexed Schemas • Audit Trail           |
       +--------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### A. Strict Role-Based Access Control (RBAC)
CampusFlow implements granular backend authorization across 4 distinct personas:
1. **Student (`student`)**:
   - Authorized to create OD and Leave applications with file proof attachments.
   - Restricted to viewing only personal applications, attendance stats, and receipts.
   - May cancel pending requests prior to review.
2. **Faculty Advisor (`faculty`)**:
   - Authorized to review and approve/reject applications from assigned classes.
   - Mandatory detailed reason required on rejection.
   - Authorized to conduct manual attendance adjustments with recorded audit justification.
3. **Head of Department (`hod`)**:
   - Department-level endorsement gatekeeper for high-impact representations (duration > policy threshold or key categories like Symposium, Internship, Sports).
   - Access to department attendance percentages, category distributions, and CSV registers.
4. **Administrator (`admin`)**:
   - Comprehensive administrative control over users, departments, classes, subjects, and timetables.
   - Configurable Attendance & OD Policy engine.
   - Immutable system audit trail inspection.

### B. Finite State Machine for Digital Approvals
All application transitions follow a consistent backend service (`ApprovalWorkflowService`):

```
       [ Draft ]
           |
      (Submit by Student)
           v
  [ Pending Faculty Approval ]
     /                    \
(Reject)                (Approve)
   v                        v
[ Rejected ]         Requires HOD?
                       /         \
                    (Yes)       (No)
                      v           v
           [ Pending HOD ]    [ Approved ] ------> [ Automatic Attendance Update ]
              /        \
          (Reject)   (Approve)
             v           v
       [ Rejected ]  [ Approved ] -----------> [ Automatic Attendance Update ]
```

### C. Automatic Attendance Integration Pipeline
When an OD request reaches final `Approved` status:
1. The attendance service retrieves the student's affected timetable sessions using the academic calendar and timetable matrix.
2. An `AttendanceRecord` is upserted for each period with `status: 'OD'`, linking the `odRequestId` and reference number.
3. Student attendance percentages are immediately recalculated:
   $$\text{Effective } \% = \frac{\text{Present} + (\text{OD} \times \text{policyWeight}) + (\text{Leave} \times \text{policyWeight})}{\text{Total Instructional Sessions}} \times 100$$
4. If an approved request is ever revoked or cancelled, the attendance records automatically revert to unexcused status.

---

## 3. Security Architecture
- **Password Security**: Passwords hashed using `bcryptjs` with salt work factor 10.
- **Token Management**: JWT tokens containing user ID, role, department, and expiration; delivered via `Authorization: Bearer <token>` and HTTP-only cookies.
- **Request Validation**: 100% of mutation payloads validated strictly via Zod schemas before hitting business logic.
- **File Upload Safeguards**: Multer enforces file type white-listing (PDF, JPEG, PNG only) and 5MB maximum file size limits with sanitized unique storage keys.
- **Rate Limiting & Headers**: Hardened with Helmet HTTP headers and origin-controlled CORS.
