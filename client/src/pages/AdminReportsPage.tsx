import React, { useState } from 'react';
import { reportApi } from '../services/api.js';
import { FileSpreadsheet, FileText, Calendar, Download } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = (type: 'attendance' | 'od' | 'leave') => {
    let url = '';
    const params: any = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    if (type === 'attendance') url = reportApi.getAttendanceCsvUrl(params);
    else if (type === 'od') url = reportApi.getOdCsvUrl(params);
    else if (type === 'leave') url = reportApi.getLeaveCsvUrl(params);

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">System Reports & Institutional Data Export</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Download CSV archives of attendance registers, student applications, and approval metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">System Attendance Register</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete student attendance logs across all departments with OD and Leave status mapping.
            </p>
          </div>
          <button
            onClick={() => handleExport('attendance')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Attendance CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All OD Requests Archive</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dataset of all On-Duty applications across the institution including dates, categories, and decision logs.
            </p>
          </div>
          <button
            onClick={() => handleExport('od')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export OD Requests CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Leave Requests Archive</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive report of student medical and personal leaves with justification comments.
            </p>
          </div>
          <button
            onClick={() => handleExport('leave')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Leave Records CSV
          </button>
        </div>
      </div>
    </div>
  );
};
