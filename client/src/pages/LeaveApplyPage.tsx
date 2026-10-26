import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { leaveApi } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { LeaveType } from '../types/index.js';
import {
  CalendarCheck,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

const LEAVE_TYPES: LeaveType[] = [
  'Sick Leave',
  'Personal Leave',
  'Emergency Leave',
  'Other',
];

export const LeaveApplyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState<LeaveType>('Sick Leave');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leaveType', leaveType);
      formData.append('reason', reason);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

      if (file) {
        formData.append('document', file);
      }

      const res = await leaveApi.create(formData);
      if (res.data.success) {
        setSuccessMsg(
          `Leave Request submitted successfully! Reference: ${res.data.data.refNo}. Forwarded to your faculty advisor.`
        );
        setTimeout(() => {
          navigate(`/student/requests?type=leave&id=${res.data.data._id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to submit leave application. Please check input.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Apply for Student Leave</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit digital leave application for medical or personal emergencies.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1. Leave Category & Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide a detailed and valid explanation for your leave of absence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Note: Unlike official On-Duty (OD), approved regular leaves do not automatically count towards attendance-present status unless specifically excused under medical board policy.
            </span>
          </div>
        </div>

        {/* Section 2: Medical / Supporting Document */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Medical Prescription / Supporting Proof (Optional)
          </h2>

          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-amber-500 transition-colors bg-slate-50/50">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <div className="flex text-xs text-slate-600 justify-center">
                <label className="relative cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500">
                  <span>Upload medical note or letter</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 5MB</p>
              {file && (
                <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? 'Submitting Leave...' : 'Submit Leave Request'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
