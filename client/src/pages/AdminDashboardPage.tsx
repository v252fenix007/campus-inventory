import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import {
  Users,
  Shield,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Building,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((res) => {
      if (res.data.success) setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const summary = data?.summary;
  const recentAudits = data?.recentAudits || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            CampusFlow Control Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Institutional overview, automated OD & leave approvals, active user directories, and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/policy"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            Configure Policies
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold">Active</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.totalStudents ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Enrolled Students</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold">Faculty</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.totalFaculty ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Faculty Advisors & HODs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold">In Review</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {(summary?.pendingOD ?? 0) + (summary?.pendingLeave ?? 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Awaiting Approvals</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold">Approved</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.approvedOD ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Approved OD Passes</div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent System Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable security logs of authorization events, approvals, and manual overrides
              </p>
            </div>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All Logs →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Actor</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Resource Type</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No recent audit events logged.
                  </td>
                </tr>
              ) : (
                recentAudits.map((a: any) => (
                  <tr key={a._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-900">{a.user?.name || 'System'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{a.user?.role || 'Daemon'}</div>
                    </td>
                    <td className="py-3 px-6 font-mono font-bold text-indigo-600">{a.action}</td>
                    <td className="py-3 px-6 font-semibold">{a.resourceType}</td>
                    <td className="py-3 px-6 text-right text-[11px] text-slate-500 font-mono">
                      {a.resourceId ? `#${a.resourceId.slice(-6)}` : 'System wide'}
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
