import React from 'react';
import { RequestStatus } from '../types/index.js';

interface Props {
  status: RequestStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  switch (status) {
    case 'Approved':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Approved
        </span>
      );
    case 'Pending Faculty Approval':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          Pending Faculty
        </span>
      );
    case 'Pending HOD Approval':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-indigo-500"></span>
          Pending HOD
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </span>
      );
    case 'Cancelled':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          Cancelled
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ${className}`}
        >
          {status}
        </span>
      );
  }
};
