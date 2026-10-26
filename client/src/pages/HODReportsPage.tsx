import React, { useState } from 'react';
import { reportApi } from '../services/api.js';
import { FileText, Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

export const HODReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDownload = (type: 'attendance' | 'od' | 'leave') => {
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
        <h1 className="text-xl font-bold text-slate-900">Department Reports & Accreditation Exports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate audit-compliant CSV reports for NBA/NAAC verification, academic council reviews, and semester audits.
        </p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-indigo-600" /> Optional Date Range Filter:
        </span>
        <div className="flex items-center gap-2">
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Official Attendance Register</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive student attendance logs with date, session period, subject, status, remarks, and audit reasons.
            </p>
          </div>
          <button
            onClick={() => handleDownload('attendance')}
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
            <h3 className="text-base font-bold text-slate-900">On-Duty (OD) Master Log</h3>
            <p className="text-xs text-slate-500 mt-1">
              Log of all student On-Duty applications, symposiums, workshops, faculty comments, and final HOD approvals.
            </p>
          </div>
          <button
            onClick={() => handleDownload('od')}
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
            <h3 className="text-base font-bold text-slate-900">Leave Applications Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete record of student medical and personal leaves, approval timestamps, and reasons.
            </p>
          </div>
          <button
            onClick={() => handleDownload('leave')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Leave Records CSV
          </button>
        </div>
      </div>
    </div>
  );
};
