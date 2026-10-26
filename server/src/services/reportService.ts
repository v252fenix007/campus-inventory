import PDFDocument from 'pdfkit';
import { ODRequest, IODRequest } from '../models/ODRequest.js';

export class ReportService {
  static async generateODReceiptPDF(odRequestId: string): Promise<Buffer> {
    const od = await ODRequest.findById(odRequestId)
      .populate('student', 'name registerNumber email phone')
      .populate('department', 'name code')
      .populate('classSection', 'name semester')
      .populate('assignedFaculty', 'name staffId')
      .populate('assignedHOD', 'name staffId');

    if (!od) {
      throw new Error('OD Request not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(20).text('CAMPUSFLOW', 55, 55, { characterSpacing: 1.5 });
      doc.fontSize(10).fillColor('#94a3b8').text('SMART STUDENT ON-DUTY (OD) RECEIPT & PASS', 55, 80);
      doc.fontSize(10).fillColor('#38bdf8').text(`REF: ${od.refNo}`, 400, 65, { align: 'right' });

      doc.moveDown(3);
      doc.fillColor('#0f172a').fontSize(14).text('Digital Approval Certificate', 40, 125, { underline: true });

      // Student info block
      const student = od.student as any;
      const dept = od.department as any;
      const section = od.classSection as any;
      const faculty = od.assignedFaculty as any;
      const hod = od.assignedHOD as any;

      doc.fontSize(10).fillColor('#334155');
      doc.text(`Student Name: ${student?.name || 'N/A'}`, 40, 155);
      doc.text(`Register Number: ${student?.registerNumber || 'N/A'}`, 40, 172);
      doc.text(`Department: ${dept?.name || 'N/A'} (${dept?.code || ''})`, 40, 189);
      doc.text(`Class & Semester: ${section?.name || 'N/A'} (Sem ${section?.semester || '-'})`, 40, 206);

      // Event details block
      doc.rect(40, 230, 515, 120).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#0f172a').fontSize(11).text('Event & Duty Information', 55, 240);

      doc.fillColor('#475569').fontSize(10);
      doc.text(`Category: ${od.category}`, 55, 260);
      doc.text(`Event Name: ${od.eventName}`, 55, 277);
      doc.text(`Organizer: ${od.organizer}`, 55, 294);
      doc.text(`Location: ${od.location}`, 55, 311);
      doc.text(
        `Duration: ${new Date(od.startDate).toLocaleDateString()} to ${new Date(od.endDate).toLocaleDateString()}`,
        55,
        328
      );

      // Affected sessions
      doc.fillColor('#0f172a').fontSize(11).text('Covered / Affected Timetable Sessions:', 40, 370);
      let sessionY = 390;
      if (od.affectedSessions && od.affectedSessions.length > 0) {
        od.affectedSessions.slice(0, 8).forEach((s, idx) => {
          doc.fillColor('#64748b').fontSize(9).text(
            `• Date: ${new Date(s.date).toLocaleDateString()} | Period: ${s.period} | Subject: ${s.subjectName || 'Scheduled Class'}`,
            50,
            sessionY
          );
          sessionY += 15;
        });
      } else {
        doc.fillColor('#64748b').fontSize(9).text('• Full Day OD clearance granted.', 50, sessionY);
        sessionY += 20;
      }

      // Verification & Signatures
      const sigY = Math.max(sessionY + 30, 540);
      doc.rect(40, sigY, 515, 110).stroke('#cbd5e1');

      doc.fillColor('#0f172a').fontSize(11).text('Digital Verification & Sign-off', 55, sigY + 12);
      doc.fillColor('#16a34a').fontSize(10).text(`STATUS: ${od.status.toUpperCase()}`, 55, sigY + 32);

      doc.fillColor('#475569').fontSize(9);
      doc.text(`Verified by Faculty: ${faculty?.name || 'Class Advisor'}`, 55, sigY + 52);
      if (od.facultyComment) {
        doc.text(`Note: "${od.facultyComment}"`, 55, sigY + 67);
      }

      if (od.requiresHOD) {
        doc.text(`Approved by HOD: ${hod?.name || 'Department Head'}`, 320, sigY + 52);
        if (od.hodComment) {
          doc.text(`Note: "${od.hodComment}"`, 320, sigY + 67);
        }
      }

      doc.fillColor('#94a3b8').fontSize(8).text(
        'Generated automatically by CampusFlow System. Digital verification complete. No physical signature required.',
        40,
        760,
        { align: 'center' }
      );

      doc.end();
    });
  }

  static generateAttendanceCSV(records: any[]): string {
    const headers = [
      'Date',
      'Student Name',
      'Register No',
      'Class Section',
      'Subject Code',
      'Period',
      'Status',
      'Remarks',
      'Corrected By',
      'Correction Reason',
    ];

    const rows = records.map((r) => [
      new Date(r.date).toISOString().split('T')[0],
      `"${r.student?.name || ''}"`,
      r.student?.registerNumber || '',
      r.classSection?.name || '',
      r.subject?.code || '',
      r.period,
      r.status,
      `"${r.remarks || ''}"`,
      r.correctedBy?.name || '',
      `"${r.correctionReason || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  static generateRequestsCSV(requests: any[], type: 'OD' | 'Leave'): string {
    if (type === 'OD') {
      const headers = [
        'Reference No',
        'Student Name',
        'Register No',
        'Category',
        'Event Name',
        'Organizer',
        'Location',
        'Start Date',
        'End Date',
        'Status',
        'Faculty Comment',
        'HOD Comment',
        'Rejection Reason',
        'Submitted At',
      ];

      const rows = requests.map((r) => [
        r.refNo,
        `"${r.student?.name || ''}"`,
        r.student?.registerNumber || '',
        `"${r.category || ''}"`,
        `"${r.eventName || ''}"`,
        `"${r.organizer || ''}"`,
        `"${r.location || ''}"`,
        new Date(r.startDate).toISOString().split('T')[0],
        new Date(r.endDate).toISOString().split('T')[0],
        r.status,
        `"${r.facultyComment || ''}"`,
        `"${r.hodComment || ''}"`,
        `"${r.rejectionReason || ''}"`,
        new Date(r.createdAt).toISOString(),
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    } else {
      const headers = [
        'Reference No',
        'Student Name',
        'Register No',
        'Leave Type',
        'Reason',
        'Start Date',
        'End Date',
        'Status',
        'Faculty Comment',
        'HOD Comment',
        'Rejection Reason',
        'Submitted At',
      ];

      const rows = requests.map((r) => [
        r.refNo,
        `"${r.student?.name || ''}"`,
        r.student?.registerNumber || '',
        `"${r.leaveType || ''}"`,
        `"${r.reason || ''}"`,
        new Date(r.startDate).toISOString().split('T')[0],
        new Date(r.endDate).toISOString().split('T')[0],
        r.status,
        `"${r.facultyComment || ''}"`,
        `"${r.hodComment || ''}"`,
        `"${r.rejectionReason || ''}"`,
        new Date(r.createdAt).toISOString(),
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }
  }
}
