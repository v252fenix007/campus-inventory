import React, { useState, useEffect } from 'react';
import { odApi, leaveApi } from '../services/api.js';
import { ODRequest, LeaveRequest } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  FileDown,
  Eye,
  Building,
  User,
  Calendar,
  AlertCircle,
  X,
  FileText,
  CalendarCheck,
} from 'lucide-react';

export const FacultyApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'od' | 'leave'>('od');
  const [pendingODs, setPendingODs] = useState<ODRequest[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [odRes, leaveRes] = await Promise.all([
        odApi.list({ status: 'Pending Faculty Approval' }),
        leaveApi.list({ status: 'Pending Faculty Approval' }),
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

    if (action === 'REJECT' && (!rejectReason || rejectReason.trim().length < 5)) {
      setActionError('A detailed reason (at least 5 characters) is required when rejecting a request.');
      return;
    }

    setProcessing(true);
    try {
      const isOD = activeTab === 'od';
      const commentToSend = action === 'APPROVE' ? comments : rejectReason;

      const res = isOD
        ? action === 'APPROVE'
          ? await odApi.approve(selectedItem._id, commentToSend)
          : await odApi.reject(selectedItem._id, commentToSend)
        : action === 'APPROVE'
        ? await leaveApi.approve(selectedItem._id, commentToSend)
        : await leaveApi.reject(selectedItem._id, commentToSend);

      if (res.data.success) {
        setActionSuccess(res.data.message);
        setTimeout(() => {
          setSelectedItem(null);
          setComments('');
          setRejectReason('');
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
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty Review & Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate student On-Duty and Leave requests, inspect supporting proofs, and approve attendance credits.
          </p>
        </div>

        {/* Tab Buttons */}
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
            <span>Pending OD ({pendingODs.length})</span>
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
            <span>Pending Leave ({pendingLeaves.length})</span>
          </button>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Ref No</th>
                <th className="py-3 px-6">Student Information</th>
                <th className="py-3 px-6">{activeTab === 'od' ? 'Event & Category' : 'Leave Type & Reason'}</th>
                <th className="py-3 px-6">Dates Requested</th>
                <th className="py-3 px-6">Proof Document</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading pending approvals...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    🎉 Inbox Zero! No pending requests awaiting your review right now.
                  </td>
                </tr>
              ) : (
                list.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-600">
                      {item.refNo}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{item.student?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
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
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {item.documentUrl && (
                          <a
                            href={item.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium underline text-xs"
                          >
                            <FileDown className="w-3.5 h-3.5" /> {item.secondaryDocumentUrl ? 'Proof 1' : 'View Proof'}
                          </a>
                        )}
                        {item.secondaryDocumentUrl && (
                          <a
                            href={item.secondaryDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium underline text-xs"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Proof 2
                          </a>
                        )}
                        {!item.documentUrl && !item.secondaryDocumentUrl && (
                          <span className="text-slate-400 italic">None attached</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActionError('');
                          setActionSuccess('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Review Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-600">
                    {selectedItem.refNo}
                  </span>
                  <StatusBadge status={selectedItem.status} />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Faculty Review: {selectedItem.student?.name} ({selectedItem.student?.registerNumber})
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
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Event / Subject</span>
                  <span className="font-semibold text-slate-900">
                    {selectedItem.eventName || selectedItem.leaveType}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Dates Requested</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedItem.startDate).toLocaleDateString()} to{' '}
                    {new Date(selectedItem.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Event Organizer & Location</span>
                <span className="font-medium text-slate-800">
                  {selectedItem.organizer || 'N/A'} • {selectedItem.location || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Student Statement</span>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedItem.description || selectedItem.reason}
                </p>
              </div>

              {(selectedItem.documentUrl || selectedItem.secondaryDocumentUrl) && (
                <div className="pt-2 flex flex-wrap gap-2">
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

            {/* Approval / Rejection Decision Controls */}
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Endorsement Comment (Optional for approval, mandatory if rejecting)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified symposium participation certificate and endorsed."
                  value={comments}
                  onChange={(e) => {
                    setComments(e.target.value);
                    setRejectReason(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('REJECT')}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('APPROVE')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Grant OD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
