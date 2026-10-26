import React, { useState, useEffect } from 'react';
import { odApi, leaveApi } from '../services/api.js';
import { ODRequest, LeaveRequest } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Building2,
  CheckCircle,
  XCircle,
  FileDown,
  Clock,
  AlertCircle,
  X,
  FileText,
  CalendarCheck,
} from 'lucide-react';

export const HODApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'od' | 'leave'>('od');
  const [pendingODs, setPendingODs] = useState<ODRequest[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [odRes, leaveRes] = await Promise.all([
        odApi.list({ status: 'Pending HOD Approval' }),
        leaveApi.list({ status: 'Pending HOD Approval' }),
      ]);
      if (odRes.data.success) setPendingODs(odRes.data.data);
      if (leaveRes.data.success) setPendingLeaves(leaveRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleDecision = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;
    setActionError('');
    setActionSuccess('');

    if (action === 'REJECT' && (!comments || comments.trim().length < 5)) {
      setActionError('A detailed reason (at least 5 characters) is required when rejecting a request.');
      return;
    }

    setProcessing(true);
    try {
      const isOD = activeTab === 'od';
      const res = isOD
        ? action === 'APPROVE'
          ? await odApi.approve(selectedItem._id, comments || 'Approved by HOD')
          : await odApi.reject(selectedItem._id, comments)
        : action === 'APPROVE'
        ? await leaveApi.approve(selectedItem._id, comments || 'Approved by HOD')
        : await leaveApi.reject(selectedItem._id, comments);

      if (res.data.success) {
        setActionSuccess(res.data.message);
        setTimeout(() => {
          setSelectedItem(null);
          setComments('');
          fetchPending();
        }, 1200);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to process decision');
    } finally {
      setProcessing(false);
    }
  };

  const list = activeTab === 'od' ? pendingODs : pendingLeaves;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department Head (HOD) Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Final departmental clearance for multi-day events, internships, symposiums, and sports competitions
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('od')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'od'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>HOD OD Queue ({pendingODs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'leave'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>HOD Leave Queue ({pendingLeaves.length})</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Ref No</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Event / Purpose</th>
                <th className="py-3 px-6">Dates Requested</th>
                <th className="py-3 px-6">Faculty Advisor Recommendation</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading department approval queue...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No requests currently awaiting HOD clearance.
                  </td>
                </tr>
              ) : (
                list.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-600">
                      {item.refNo}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{item.student?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.student?.registerNumber} • {item.classSection?.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">
                        {activeTab === 'od' ? item.eventName : item.leaveType}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {activeTab === 'od' ? item.category : item.reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {new Date(item.startDate).toLocaleDateString()} -{' '}
                      {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-[11px] text-indigo-800 bg-indigo-50/50 rounded p-2 italic max-w-xs">
                      "{item.facultyComment || 'Endorsed by class advisor'}"
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActionError('');
                          setActionSuccess('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        HOD Endorse
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-sm text-indigo-600">
                  {selectedItem.refNo}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Department Clearance: {selectedItem.student?.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="py-4 space-y-3 text-xs border-b border-slate-100">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[11px] font-bold text-purple-900 block">
                  Advisor Endorsement:
                </span>
                <p className="text-purple-800 italic mt-0.5">
                  "{selectedItem.facultyComment || 'Forwarded for HOD clearance.'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Category / Type</span>
                  <span className="font-semibold text-slate-900">
                    {selectedItem.category || selectedItem.leaveType}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedItem.startDate).toLocaleDateString()} to{' '}
                    {new Date(selectedItem.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Statement</span>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedItem.description || selectedItem.reason}
                </p>
              </div>

              {(selectedItem.documentUrl || selectedItem.secondaryDocumentUrl) && (
                <div className="pt-1 flex flex-wrap gap-2">
                  {selectedItem.documentUrl && (
                    <a
                      href={selectedItem.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Proof 1 ({selectedItem.documentName || 'Attachment'})</span>
                    </a>
                  )}
                  {selectedItem.secondaryDocumentUrl && (
                    <a
                      href={selectedItem.secondaryDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Proof 2 ({selectedItem.secondaryDocumentName || 'Attachment'})</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HOD Department Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved. Student may represent the department."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('REJECT')}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('APPROVE')}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  <span>Grant Final HOD Approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
