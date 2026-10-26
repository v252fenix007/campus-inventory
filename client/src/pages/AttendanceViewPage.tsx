import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { attendanceApi, timetableApi } from '../services/api.js';
import { AttendanceStats } from '../types/index.js';
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  BookOpen,
  Info,
} from 'lucide-react';

export const AttendanceViewPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsRes = await attendanceApi.getMyStats();
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        if (user?.classSection?._id) {
          const ttRes = await timetableApi.getClassTimetable(user.classSection._id);
          if (ttRes.data.success) {
            setTimetable(ttRes.data.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Group timetable by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timetableByDay: Record<string, any[]> = {};
  days.forEach((d) => (timetableByDay[d] = []));
  timetable.forEach((session) => {
    if (timetableByDay[session.dayOfWeek]) {
      timetableByDay[session.dayOfWeek].push(session);
    }
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Semester 6
            </span>
            <span className="text-xs text-slate-500">
              {user?.department?.name} • Class {user?.classSection?.name}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Official Attendance & OD Integration</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Live attendance percentage calculated including all digitally approved On-Duty slips.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 self-stretch sm:self-auto justify-between sm:justify-start">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Effective Attendance</div>
            <div className="text-3xl font-black text-slate-900">{stats?.effectivePercentage ?? 0}%</div>
          </div>
          <div>
            {stats?.isEligible ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Exam Eligible
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Condonation Alert
              </span>
            )}
          </div>
        </div>
      </div>

      {/* OD Policy Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Automatic On-Duty (OD) Attendance Benefit</h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              You have earned <span className="font-bold underline">{stats?.odCount ?? 0} On-Duty session credits</span>. Each approved OD is counted as "Present" towards your minimum 75% requirement.
            </p>
          </div>
        </div>
      </div>

      {/* Subject-wise breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Attendance Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed breakdown of regular class attendance and approved OD credits per course
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Subject Code & Name</th>
                <th className="py-3 px-6 text-center">Total Classes</th>
                <th className="py-3 px-6 text-center">Attended</th>
                <th className="py-3 px-6 text-center">OD Credits</th>
                <th className="py-3 px-6 text-center">Absents</th>
                <th className="py-3 px-6">Attendance %</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading attendance statistics...
                  </td>
                </tr>
              ) : !stats || stats.subjectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No subject records found.
                  </td>
                </tr>
              ) : (
                stats.subjectBreakdown.map((subj) => {
                  const isElig = subj.effectivePercentage >= 75;
                  return (
                    <tr key={subj.subjectId} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{subj.subjectName}</div>
                        <div className="text-[11px] font-mono text-indigo-600">{subj.subjectCode}</div>
                      </td>
                      <td className="py-3.5 px-6 text-center font-semibold">{subj.totalSessions}</td>
                      <td className="py-3.5 px-6 text-center text-slate-900">{subj.presentSessions}</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          +{subj.odSessions}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center text-rose-600">{subj.absentSessions}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isElig ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, subj.effectivePercentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">{subj.effectivePercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isElig ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Clear
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Shortage
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Timetable Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Class Weekly Timetable</h2>
            <p className="text-xs text-slate-500">
              Timetable sessions used by the OD engine to automatically map affected academic hours
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Room: CS-301 to CS-305</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {days.map((day) => {
            const sessions = timetableByDay[day] || [];
            return (
              <div key={day} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 text-center">
                  {day}
                </div>
                <div className="p-2 space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-4">No classes</div>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s._id}
                        className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs text-[11px]"
                      >
                        <div className="font-semibold text-slate-900 truncate">
                          {s.subject?.name || 'Class'}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-mono">
                          P{s.period} ({s.startTime} - {s.endTime})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
