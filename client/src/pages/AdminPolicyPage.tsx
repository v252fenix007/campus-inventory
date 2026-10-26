import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api.js';
import { AttendancePolicy } from '../types/index.js';
import { Settings, CheckCircle, AlertCircle, Shield, Save } from 'lucide-react';

const ALL_CATEGORIES = [
  'Academic Event',
  'Symposium',
  'Workshop',
  'Competition',
  'Sports',
  'Internship',
  'Other',
];

export const AdminPolicyPage: React.FC = () => {
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form fields
  const [odCountsAsPresent, setOdCountsAsPresent] = useState(true);
  const [leaveCountsAsPresent, setLeaveCountsAsPresent] = useState(false);
  const [minAttendancePercentage, setMinAttendancePercentage] = useState(75);
  const [hodApprovalRequiredDays, setHodApprovalRequiredDays] = useState(2);
  const [categoriesRequiringHOD, setCategoriesRequiringHOD] = useState<string[]>([]);
  const [allowStudentCancelPending, setAllowStudentCancelPending] = useState(true);

  useEffect(() => {
    attendanceApi.getPolicy().then((res) => {
      if (res.data.success && res.data.data) {
        const p = res.data.data;
        setPolicy(p);
        setOdCountsAsPresent(p.odCountsAsPresent);
        setLeaveCountsAsPresent(p.leaveCountsAsPresent);
        setMinAttendancePercentage(p.minAttendancePercentage);
        setHodApprovalRequiredDays(p.hodApprovalRequiredDays);
        setCategoriesRequiringHOD(p.categoriesRequiringHOD || []);
        setAllowStudentCancelPending(p.allowStudentCancelPending);
      }
      setLoading(false);
    });
  }, []);

  const handleToggleCategory = (cat: string) => {
    if (categoriesRequiringHOD.includes(cat)) {
      setCategoriesRequiringHOD((prev) => prev.filter((c) => c !== cat));
    } else {
      setCategoriesRequiringHOD((prev) => [...prev, cat]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      const res = await attendanceApi.updatePolicy({
        odCountsAsPresent,
        leaveCountsAsPresent,
        minAttendancePercentage: Number(minAttendancePercentage),
        hodApprovalRequiredDays: Number(hodApprovalRequiredDays),
        categoriesRequiringHOD,
        allowStudentCancelPending,
      });

      if (res.data.success) {
        setMsg({
          text: 'Attendance and On-Duty Policy updated successfully across the institution.',
          type: 'success',
        });
      }
    } catch (err: any) {
      setMsg({
        text: err.response?.data?.message || 'Failed to update policy',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Policies & Approval Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional attendance calculation logic, OD weightage, and approval escalation criteria
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Credit Rules */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1. Attendance Credit Rules
          </h2>

          <div className="space-y-4">
            <label className="flex items-start justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
              <div className="pr-4">
                <span className="text-sm font-bold text-slate-900 block">
                  Count Approved On-Duty (OD) as Attendance-Present
                </span>
                <span className="text-xs text-slate-500">
                  When enabled, all mapped class sessions for approved OD requests are automatically credited as present in attendance percentage calculations.
                </span>
              </div>
              <input
                type="checkbox"
                checked={odCountsAsPresent}
                onChange={(e) => setOdCountsAsPresent(e.target.checked)}
                className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
              <div className="pr-4">
                <span className="text-sm font-bold text-slate-900 block">
                  Count Approved Regular Leave as Attendance-Present
                </span>
                <span className="text-xs text-slate-500">
                  By default, college policy marks leave as excused absence without attendance credit unless mandated by academic board.
                </span>
              </div>
              <input
                type="checkbox"
                checked={leaveCountsAsPresent}
                onChange={(e) => setLeaveCountsAsPresent(e.target.checked)}
                className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Attendance Eligibility Requirement (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={minAttendancePercentage}
                  onChange={(e) => setMinAttendancePercentage(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-indigo-600"
                />
                <span className="text-xs text-slate-500">
                  Students below this percentage receive condonation alert banners on their dashboards.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Escalation Rules */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Multi-tier Approval Escalation (HOD Clearance)
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration Threshold for Mandatory HOD Approval (Days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={30}
                value={hodApprovalRequiredDays}
                onChange={(e) => setHodApprovalRequiredDays(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-purple-600"
              />
              <span className="text-xs text-slate-500">
                Any application exceeding this duration automatically requires Head of Department (HOD) review after Faculty Advisor endorsement.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Categories Always Requiring HOD Approval (regardless of duration)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = categoriesRequiringHOD.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Policy Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
