# CampusFlow – Database Schema & Data Models

## 1. Schema Relationships
```
[ User ] (student, faculty, hod, admin)
   |
   +---> [ Department ] (code, name, hod ref)
   |
   +---> [ ClassSection ] (name, semester, academicYear, facultyAdvisor ref)
   |
   +---> [ ODRequest ] (student, department, classSection, assignedFaculty, assignedHOD)
   |        |
   |        +---> [ ApprovalHistory ] (requestId, approver, action, comments, timestamp)
   |        |
   |        +---> [ AttendanceRecord ] (student, date, period, status='OD', odRequestId)
   |
   +---> [ LeaveRequest ] (student, department, classSection, assignedFaculty, assignedHOD)
   |
   +---> [ TimetableSession ] (classSection, dayOfWeek, period, subject, faculty, room)
   |
   +---> [ Notification ] (recipient, title, message, type, isRead)
   |
   +---> [ AuditLog ] (user, action, resourceType, details, timestamp)
```

---

## 2. Model Specifications

### `User`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required | Full Name |
| `email` | String | Required, Unique, Lowercase | Institutional Email |
| `password` | String | Required, Bcrypt Hashed | Hidden from queries by default |
| `role` | String | Enum (`student`,`faculty`,`hod`,`admin`) | Role-based authorization |
| `department` | ObjectId | Ref: Department | Associated department |
| `classSection` | ObjectId | Ref: ClassSection | For students |
| `registerNumber` | String | Indexed | Student register/roll number |
| `staffId` | String | Indexed | Faculty / Staff ID |
| `isActive` | Boolean | Default: `true` | Account active toggle |

### `ODRequest`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `refNo` | String | Required, Unique, Indexed | Formatted `OD-YYYY-XXXXX` |
| `student` | ObjectId | Ref: User, Required | Submitting student |
| `category` | String | Enum, Indexed | Symposium, Workshop, etc. |
| `eventName` | String | Required | Name of event/activity |
| `startDate` | Date | Required, Indexed | Event start date |
| `endDate` | Date | Required, Indexed | Event end date |
| `affectedSessions`| Array | Subdocuments | Affected periods & subjects |
| `status` | String | Enum, Indexed | Pending Faculty, Approved, etc. |
| `requiresHOD` | Boolean | Default: `false` | True if duration > policy threshold |
| `facultyComment` | String | Optional | Faculty endorsement remarks |
| `hodComment` | String | Optional | Department head remarks |

### `AttendanceRecord`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `student` | ObjectId | Ref: User, Required | Student reference |
| `date` | Date | Required, Indexed | Normalized to midnight UTC/local |
| `period` | Number | Required (1-5) | Instructional period |
| `subject` | ObjectId | Ref: Subject, Required | Course subject |
| `status` | String | Enum (`Present`,`Absent`,`OD`,`Leave`) | Attendance mark |
| `odRequestId` | ObjectId | Ref: ODRequest | Associated approved OD |
| `requestRefNo` | String | Optional | Reference number for display |
| `correctedBy` | ObjectId | Ref: User | Staff member who adjusted record |
| `correctionReason` | String | Optional | Mandatory reason for adjustments |

---

## 3. Database Indexing Strategy
- `ODRequest`: `{ student: 1, startDate: 1, endDate: 1 }` enables instantaneous overlapping request detection.
- `AttendanceRecord`: `{ student: 1, date: 1, period: 1 }` unique compound index guarantees prevention of duplicate attendance records.
- `TimetableSession`: `{ classSection: 1, dayOfWeek: 1, period: 1 }` unique compound index prevents conflicting period allocations.
- `Notification`: `{ recipient: 1, createdAt: -1 }` accelerates unread badge queries and user notification feeds.
