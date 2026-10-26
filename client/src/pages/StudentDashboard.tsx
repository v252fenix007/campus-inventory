import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { attendanceApi, odApi, leaveApi } from '../services/api.js';
import { AttendanceStats, ODRequest, LeaveRequest } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Link } from 'react-router-dom';
import {
  FilePlus2,
  CalendarCheck,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Building,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [odRequests, setOdRequests] = useState<ODRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, odRes, leaveRes] = await Promise.all([
          attendanceApi.getMyStats(),
          odApi.list({ limit: 5 }),
          leaveApi.list({ limit: 5 }),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (odRes.data.success) setOdRequests(odRes.data.data);
        if (leaveRes.data.success) setLeaveRequests(leaveRes.data.data);
      } catch (err) {
        console.error('Failed to load student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingCount =
    odRequests.filter((r) => r.status.includes('Pending')).length +
    leaveRequests.filter((r) => r.status.includes('Pending')).length;

  const approvedCount = odRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = odRequests.filter((r) => r.status === 'Rejected').length;

  const upcomingEvents = odRequests.filter(
    (r) => r.status === 'Approved' && new Date(r.endDate) >= new Date()
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user?.registerNumber}
              </span>
              <span className="text-slate-400 text-xs">
                {user?.department?.name || 'Computer Science'} • {user?.classSection?.name || 'Section A'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Track On-Duty approvals, monitor real-time attendance percentage, and submit new digital duty slips directly to your faculty advisor.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/student/apply-od"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Apply for OD</span>
            </Link>
            <Link
              to="/student/apply-leave"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Apply Leave</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics & Attendance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Attendance Percentage
              </h2>
              {stats?.isEligible ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Eligible
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Below 75%
                </span>
              )}
            </div>

            {/* Circular Gauge / Percentage Display */}
            <div className="flex items-baseline gap-3 my-4">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {stats?.effectivePercentage ?? 0}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Min {stats?.minPercentageRequired || 75}% required for semester exams)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (stats?.effectivePercentage ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, stats?.effectivePercentage ?? 0)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-xs text-slate-500">Present</div>
                <div className="text-base font-bold text-slate-900">{stats?.presentCount ?? 0}</div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50/60">
                <div className="text-xs text-indigo-600 font-medium">OD Credits</div>
                <div className="text-base font-bold text-indigo-700">{stats?.odCount ?? 0}</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50/60">
                <div className="text-xs text-rose-600 font-medium">Absents</div>
                <div className="text-base font-bold text-rose-700">{stats?.absentCount ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Approved ODs count as present under college policy.
            </span>
            <Link
              to="/student/attendance"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Full Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* OD Application Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-400">Total</span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{odRequests.length}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Total OD Requests</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">Review</span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{pendingCount}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Pending Approvals</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">Granted</span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{approvedCount}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Approved ODs</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-semibold text-rose-600">Rejected</span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{rejectedCount}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Rejected Requests</div>
            </div>
          </div>

          {/* Upcoming Approved Events Banner */}
          <div className="col-span-2 sm:col-span-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Upcoming Approved On-Duty Events
              </h3>
              <span className="text-xs text-indigo-600 font-medium">
                {upcomingEvents.length} scheduled
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-indigo-800/70">
                No upcoming On-Duty events scheduled. Apply whenever attending inter-college symposiums, sports tournaments, or workshops!
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100/80 shadow-xs"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{ev.eventName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.organizer}</span>
                        <span>•</span>
                        <span>
                          {new Date(ev.startDate).toLocaleDateString()} -{' '}
                          {new Date(ev.endDate).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Approved OD Pass
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest On-Duty and Leave requests submitted from your account
            </p>
          </div>
          <Link
            to="/student/requests"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Applications <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Reference No</th>
                <th className="py-3 px-6">Type & Event</th>
                <th className="py-3 px-6">Date Range</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {odRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No requests found. Click "Apply for OD" to create your first application.
                  </td>
                </tr>
              ) : (
                odRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-600">
                      {r.refNo}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{r.eventName}</div>
                      <div className="text-[11px] text-slate-500">{r.category}</div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {new Date(r.startDate).toLocaleDateString()} -{' '}
                      {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/student/requests?id=${r._id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
