import React, { useState, useEffect } from 'react';
import { odApi, leaveApi } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Clock, Search, Filter } from 'lucide-react';

export const FacultyHistoryPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([odApi.list(), leaveApi.list()])
      .then(([odRes, leaveRes]) => {
        const ods = (odRes.data.data || []).map((i: any) => ({ ...i, type: 'OD' }));
        const lvs = (leaveRes.data.data || []).map((i: any) => ({ ...i, type: 'Leave' }));
        const all = [...ods, ...lvs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRequests(all);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(
    (r) =>
      !search ||
      r.refNo.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty Request & Decision History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all reviewed applications, student representations, and granted On-Duty permissions
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or ref no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Ref No</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Event / Reason</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Faculty Endorsement</th>
                <th className="py-3 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading history log...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-600">
                      {item.refNo}
                    </td>
                    <td className="py-3.5 px-6 font-semibold">{item.type}</td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{item.student?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.student?.registerNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">{item.eventName || item.reason}</td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-6 text-[11px] text-slate-600 italic">
                      {item.facultyComment || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
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
