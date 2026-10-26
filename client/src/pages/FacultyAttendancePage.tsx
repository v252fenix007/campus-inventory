import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { attendanceApi, adminApi } from '../services/api.js';
import {
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  User,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const FacultyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Manual Update Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newStatus, setNewStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Class records
  const [classRecords, setClassRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    // Fetch metadata
    adminApi.getMetadata().then((res) => {
      if (res.data.success) {
        setClasses(res.data.data.classes || []);
        setSubjects(res.data.data.subjects || []);
        if (res.data.data.classes?.length > 0) {
          setSelectedClassId(res.data.data.classes[0]._id);
        }
      }
    });

    // Fetch students in CSE-A
    adminApi.getUsers({ role: 'student', limit: 20 }).then((res) => {
      if (res.data.success) {
        setStudents(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedStudentId(res.data.data[0]._id);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setLoadingRecords(true);
      attendanceApi
        .getClassAttendance(selectedClassId, date)
        .then((res) => {
          if (res.data.success) setClassRecords(res.data.data);
        })
        .finally(() => setLoadingRecords(false));
    }
  }, [selectedClassId, date]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!correctionReason || correctionReason.trim().length < 5) {
      setMsg({ text: 'A mandatory reason (at least 5 characters) is required for audit compliance.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await attendanceApi.manualUpdate({
        studentId: selectedStudentId,
        date,
        period: Number(selectedPeriod),
        subjectId: selectedSubjectId || (subjects[0]?._id ?? ''),
        classSectionId: selectedClassId,
        status: newStatus,
        correctionReason,
      });

      if (res.data.success) {
        setMsg({
          text: `Attendance record successfully updated for student. Permanent audit entry generated.`,
          type: 'success',
        });
        setCorrectionReason('');
        // Refresh records
        attendanceApi.getClassAttendance(selectedClassId, date).then((r) => {
          if (r.data.success) setClassRecords(r.data.data);
        });
      }
    } catch (err: any) {
      setMsg({
        text: err.response?.data?.message || 'Failed to update attendance record',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Class Attendance & Authorized Corrections</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review class session records and record authorized manual updates with full audit compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Class Attendance Viewer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Session Attendance Log</h2>
              <span className="text-xs text-slate-500">Records for selected date & class section</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
              />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loadingRecords ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading session attendance...
                    </td>
                  </tr>
                ) : classRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No records logged for {date}. Use the tool on the right to record/correct sessions.
                    </td>
                  </tr>
                ) : (
                  classRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">P{r.period}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{r.student?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.student?.registerNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{r.subject?.code || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'OD'
                              ? 'bg-indigo-50 text-indigo-700'
                              : r.status === 'Leave'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 truncate max-w-xs">
                        {r.remarks || r.correctionReason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Manual Correction Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Manual Attendance Tool</h2>
          </div>
          <p className="text-xs text-slate-500">
            Staff override tool for approved official representations, lab makeups, or genuine exceptions.
          </p>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.registerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Period (1 - 5)</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.code} – {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Attendance Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="Present">Present</option>
                <option value="OD">On-Duty (OD)</option>
                <option value="Leave">Leave</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Participated in department placement training with special permission."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Applying with Audit Log...' : 'Save & Log Correction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
