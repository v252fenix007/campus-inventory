import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import { Users, CheckCircle, Clock, ShieldCheck, Mail } from 'lucide-react';

export const HODFacultyActivityPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers({ role: 'faculty' }).then((res) => {
      if (res.data.success) setFacultyList(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Faculty Advisor Approval Activity</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor class advisors, review performance metrics, and track student application endorsement rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-8 text-center text-xs text-slate-400">Loading faculty advisors...</div>
        ) : (
          facultyList.map((f) => (
            <div
              key={f._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm border border-indigo-100">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Staff ID: {f.staffId || 'FAC-101'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{f.email}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Advisor
                </span>
                <div className="text-[11px] text-slate-400 mt-2">Avg. review turnaround: &lt; 24 hrs</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
