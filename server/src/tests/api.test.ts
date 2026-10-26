import dotenv from 'dotenv';
dotenv.config();

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { ODRequest } from '../models/ODRequest.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { ATTENDANCE_STATUS, REQUEST_STATUS } from '../config/constants.js';

let app: any;
let studentToken: string;
let facultyToken: string;
let hodToken: string;
let adminToken: string;

beforeAll(async () => {
  await connectDB();
  app = createApp();

  // Login Student
  const sRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'student@campusflow.edu', password: 'Student@123' });
  expect(sRes.status).toBe(200);
  studentToken = sRes.body.data.token;

  // Login Faculty
  const fRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'faculty@campusflow.edu', password: 'Faculty@123' });
  expect(fRes.status).toBe(200);
  facultyToken = fRes.body.data.token;

  // Login HOD
  const hRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'hod@campusflow.edu', password: 'Hod@123' });
  expect(hRes.status).toBe(200);
  hodToken = hRes.body.data.token;

  // Login Admin
  const aRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@campusflow.edu', password: 'Admin@123' });
  expect(aRes.status).toBe(200);
  adminToken = aRes.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('1. System Health & Infrastructure', () => {
  it('GET /api/v1/health - should report healthy status with connected MongoDB', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database.status).toBe('connected');
  });

  it('GET /api/v1/auth/demo-users - should provide quick-login demo accounts', async () => {
    const res = await request(app).get('/api/v1/auth/demo-users');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
  });
});

describe('2. Authentication & Security (RBAC)', () => {
  it('POST /api/v1/auth/login - should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@campusflow.edu', password: 'WrongPassword999' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/audit-logs - should block student with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/audit-logs - should allow admin with 200 OK', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('3. Student OD Management & Workflow', () => {
  let createdODId: string;

  it('POST /api/v1/od - should validate and create a new OD application', async () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 20);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 21);

    const res = await request(app)
      .post('/api/v1/od')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'Competition',
        eventName: 'ACM ICPC Regional Qualifiers',
        organizer: 'Amrita Vishwa Vidyapeetham',
        location: 'Coimbatore',
        description: 'Selected for ICPC On-site Regional Programming contest.',
        startDate: futureDate1.toISOString().split('T')[0],
        endDate: futureDate2.toISOString().split('T')[0],
        affectedSessions: [],
        declarationSigned: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.refNo).toMatch(/^OD-\d{4}-\d+$/);
    expect(res.body.data.status).toBe(REQUEST_STATUS.PENDING_FACULTY);

    createdODId = res.body.data._id;
  });

  it('POST /api/v1/od - should reject overlapping OD requests', async () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 20);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 21);

    const res = await request(app)
      .post('/api/v1/od')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'Workshop',
        eventName: 'Another Event On Same Days',
        organizer: 'Tech Hub',
        location: 'Online',
        description: 'Attempting duplicate overlapping request submission.',
        startDate: futureDate1.toISOString().split('T')[0],
        endDate: futureDate2.toISOString().split('T')[0],
        declarationSigned: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('overlapping');
  });

  it('POST /api/v1/od/:id/approve - Faculty approves pending request', async () => {
    const res = await request(app)
      .post(`/api/v1/od/${createdODId}/approve`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ comments: 'Verified selection letter. Approved by faculty.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/od/:id/receipt - should generate printable PDF stream for approved OD', async () => {
    // We already have a seeded approved OD request
    const approvedOD = await ODRequest.findOne({ status: REQUEST_STATUS.APPROVED });
    expect(approvedOD).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/od/${approvedOD!._id}/receipt`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });
});

describe('4. Attendance Integration & Analytics', () => {
  it('GET /api/v1/attendance/my-stats - should calculate student attendance with OD integration', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/my-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.effectivePercentage).toBeGreaterThanOrEqual(0);
    expect(res.body.data.odCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.subjectBreakdown)).toBe(true);
  });

  it('POST /api/v1/attendance/manual-update - Faculty can correct attendance with reason', async () => {
    const student = await mongoose.model('User').findOne({ email: 'student@campusflow.edu' });
    const section = await mongoose.model('ClassSection').findOne({ name: 'CSE-A' });
    const subject = await mongoose.model('Subject').findOne({ code: 'CS8601' });

    const todayStr = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/v1/attendance/manual-update')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        studentId: student!._id.toString(),
        date: todayStr,
        period: 1,
        subjectId: subject!._id.toString(),
        classSectionId: section!._id.toString(),
        status: ATTENDANCE_STATUS.PRESENT,
        correctionReason: 'Student was present at departmental technical debate competition with permission.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.status).toBe(ATTENDANCE_STATUS.PRESENT);
    expect(res.body.data.record.correctionReason).toContain('technical debate');
  });
});

describe('5. Reports & Exports', () => {
  it('GET /api/v1/reports/attendance/csv - should export attendance CSV', async () => {
    const res = await request(app)
      .get('/api/v1/reports/attendance/csv')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Student Name,Register No');
  });

  it('GET /api/v1/reports/od/csv - should export OD requests CSV', async () => {
    const res = await request(app)
      .get('/api/v1/reports/od/csv')
      .set('Authorization', `Bearer ${hodToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Reference No,Student Name');
  });
});
