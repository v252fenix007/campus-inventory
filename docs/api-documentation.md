# CampusFlow – REST API Documentation

Base URL: `http://localhost:5000/api/v1`  
Swagger UI: `http://localhost:5000/api-docs`

---

## 1. System Health & Authentication

### `GET /health`
Returns system status, version, uptime, and MongoDB connectivity.
- **Access**: Public
- **Response `200`**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "CampusFlow Backend API",
    "version": "1.0.0",
    "database": {
      "status": "connected",
      "host": "127.0.0.1",
      "name": "campusflow"
    }
  }
}
```

### `POST /auth/login`
Authenticates a user and issues a signed JWT token.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "student@campusflow.edu",
  "password": "Student@123"
}
```
- **Response `200`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67...",
      "name": "Alex Johnson",
      "email": "student@campusflow.edu",
      "role": "student",
      "registerNumber": "21CSR042"
    }
  }
}
```

### `GET /auth/demo-users`
Provides instant credentials for pre-seeded test accounts.
- **Access**: Public

### `POST /auth/logout`
Clears authentication cookie and session state.

---

## 2. On-Duty (OD) Management

### `POST /od`
Submits a new student On-Duty application.
- **Access**: Authenticated Student (`student`)
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `category`: String (`Academic Event` | `Symposium` | `Workshop` | `Competition` | `Sports` | `Internship` | `Other`)
  - `eventName`: String
  - `organizer`: String
  - `location`: String
  - `description`: String
  - `startDate`: ISO Date
  - `endDate`: ISO Date
  - `affectedSessions`: JSON array of affected periods/subjects
  - `declarationSigned`: Boolean (`true`)
  - `document`: File (optional, PDF/JPG/PNG <= 5MB)
- **Response `201`**: Returns created `ODRequest` with reference number (e.g., `OD-2026-00105`).

### `GET /od`
Lists OD requests with server-side pagination, filters, and search.
- **Access**: Authenticated users (results scoped by role)
- **Query Parameters**:
  - `status`: `All` | `Pending Faculty Approval` | `Pending HOD Approval` | `Approved` | `Rejected`
  - `category`: Filter by category
  - `search`: Search student name, register number, or event
  - `page`: Page number (default: 1)
  - `limit`: Page size (default: 10)

### `GET /od/:id`
Retrieves detailed application information and full approval history timeline.

### `POST /od/:id/approve`
Approves an application.
- **Access**: Faculty, HOD, Admin
- **Request Body**: `{ "comments": "Optional endorsement text" }`

### `POST /od/:id/reject`
Rejects an application with mandatory justification.
- **Access**: Faculty, HOD, Admin
- **Request Body**: `{ "comments": "Reason for rejection (min 5 chars)" }`

### `POST /od/:id/cancel`
Cancels a pending application.
- **Access**: Request owner (`student`)

### `GET /od/:id/receipt`
Generates and downloads an official printable PDF clearance receipt.

---

## 3. Leave Management

### `POST /leave`
Submits student leave application.
- **Access**: Authenticated Student (`student`)
- **Fields**: `leaveType`, `reason`, `startDate`, `endDate`, `document`

### `GET /leave`
Lists leave applications with search and filters.

### `POST /leave/:id/approve` & `POST /leave/:id/reject`
Review actions for leave requests.

---

## 4. Attendance & Timetable Engine

### `GET /attendance/my-stats`
Calculates student attendance with OD integration, eligibility status, and subject breakdown.
- **Access**: Authenticated Student (`student`)
- **Response `200`**:
```json
{
  "success": true,
  "data": {
    "totalSessions": 125,
    "presentCount": 105,
    "odCount": 5,
    "absentCount": 15,
    "effectivePercentage": 88,
    "minPercentageRequired": 75,
    "isEligible": true,
    "subjectBreakdown": [...]
  }
}
```

### `POST /attendance/manual-update`
Authorized staff manual attendance correction with mandatory audit reason.
- **Access**: Faculty, Admin
- **Request Body**:
```json
{
  "studentId": "67...",
  "date": "2026-10-11",
  "period": 1,
  "subjectId": "67...",
  "classSectionId": "67...",
  "status": "Present",
  "correctionReason": "Attended department review board with prior permission."
}
```

### `GET /timetable/calculate-affected`
Calculates affected class periods and subjects based on requested dates and timetable configuration.

---

## 5. Reports & Administrative APIs

### `GET /reports/attendance/csv`
Exports attendance register in CSV format.

### `GET /reports/od/csv`
Exports master log of OD applications in CSV format.

### `GET /admin/dashboard`
Returns high-level statistics, active counts, and recent audit activity.

### `GET /admin/users` & `POST /admin/users`
Directory management for institutional accounts.
