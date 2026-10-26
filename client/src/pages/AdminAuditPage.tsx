import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import { Shield, Clock, Search, Filter } from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getAuditLogs({ limit: 50 }).then((res) => {
      if (res.data.success) setLogs(res.data.data);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Security & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all authorization decisions, manual attendance alterations, and configuration changes
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search action or user..."
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
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Actor / User</th>
                <th className="py-3 px-6">Action Performed</th>
                <th className="py-3 px-6">Resource</th>
                <th className="py-3 px-6">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70 font-mono text-[11px]">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-sans">
                      <div className="font-semibold text-slate-900">{l.user?.name || 'System / Daemon'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{l.user?.role || 'Admin'}</div>
                    </td>
                    <td className="py-3 px-6 font-bold text-indigo-700">{l.action}</td>
                    <td className="py-3 px-6 font-semibold font-sans">{l.resourceType}</td>
                    <td className="py-3 px-6 text-slate-600 max-w-sm truncate">
                      {JSON.stringify(l.details || {})}
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
