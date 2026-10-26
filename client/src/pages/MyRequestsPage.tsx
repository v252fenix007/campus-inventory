import React, { useState, useEffect } from 'react';
import { odApi, leaveApi } from '../services/api.js';
import { ODRequest, LeaveRequest, ApprovalHistoryItem } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  CalendarCheck,
  Search,
  Filter,
  Download,
  XCircle,
  Eye,
  Clock,
  CheckCircle2,
  X,
  FileDown,
  Building,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'leave' ? 'leave' : 'od';
  const initialId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<'od' | 'leave'>(initialType);
  const [odList, setOdList] = useState<ODRequest[]>([]);
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Details Modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancel action state
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [odRes, leaveRes] = await Promise.all([
        odApi.list({ status: statusFilter, search }),
        leaveApi.list({ status: statusFilter, search }),
      ]);
      if (odRes.data.success) setOdList(odRes.data.data);
      if (leaveRes.data.success) setLeaveList(leaveRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Open details if ID is in URL
  useEffect(() => {
    if (initialId) {
      handleOpenDetails(initialId, initialType);
    }
  }, [initialId]);

  const handleOpenDetails = async (id: string, type: 'od' | 'leave') => {
    setLoadingDetails(true);
    try {
      const res = type === 'od' ? await odApi.getById(id) : await leaveApi.getById(id);
      if (res.data.success) {
        setSelectedRequest(res.data.data.request);
        setApprovalHistory(res.data.data.history || []);
      }
    } catch (e) {
      console.error('Failed to get details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCancelRequest = async (id: string, type: 'od' | 'leave') => {
    if (!confirm('Are you sure you want to cancel this pending application?')) return;
    setCancelling(true);
    setCancelMsg('');
    try {
      const res = type === 'od' ? await odApi.cancel(id) : await leaveApi.cancel(id);
      if (res.data.success) {
        setCancelMsg('Application cancelled successfully.');
        fetchRequests();
        setSelectedRequest((prev: any) => ({ ...prev, status: 'Cancelled' }));
      }
    } catch (err: any) {
      setCancelMsg(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const currentList = activeTab === 'od' ? odList : leaveList;

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Applications & Approval Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status tracking, digital approval timelines, and printable OD certificates
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('od')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'od'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>On-Duty ({odList.length})</span>
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
            <span>Leave ({leaveList.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Ref No or Event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Faculty Approval">Pending Faculty</option>
            <option value="Pending HOD Approval">Pending HOD</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Ref No</th>
                <th className="py-3 px-6">{activeTab === 'od' ? 'Event & Category' : 'Leave Type & Reason'}</th>
                <th className="py-3 px-6">Duration</th>
                <th className="py-3 px-6">Current Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No applications matching the selected criteria.
                  </td>
                </tr>
              ) : (
                currentList.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-600">
                      {item.refNo}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">
                        {activeTab === 'od' ? item.eventName : item.leaveType}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {activeTab === 'od' ? `${item.category} • ${item.organizer}` : item.reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {new Date(item.startDate).toLocaleDateString()} -{' '}
                      {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(item._id, activeTab)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        {activeTab === 'od' && item.status === 'Approved' && (
                          <a
                            href={odApi.getReceiptUrl(item._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Receipt
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Approval History Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-600">
                    {selectedRequest.refNo}
                  </span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRequest.eventName || selectedRequest.leaveType}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelMsg && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                {cancelMsg}
              </div>
            )}

            {/* Request Summary */}
            <div className="py-4 space-y-3 text-xs border-b border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedRequest.startDate).toLocaleDateString()} to{' '}
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRequest.category || selectedRequest.leaveType}
                  </span>
                </div>
              </div>

              {selectedRequest.location && (
                <div>
                  <span className="text-slate-400 block">Organizer & Location</span>
                  <span className="font-medium text-slate-800">
                    {selectedRequest.organizer} • {selectedRequest.location}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block">Description / Reason</span>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedRequest.description || selectedRequest.reason}
                </p>
              </div>

              {(selectedRequest.documentUrl || selectedRequest.secondaryDocumentUrl) && (
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Attached Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.documentUrl && (
                      <a
                        href={selectedRequest.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Proof 1 ({selectedRequest.documentName || 'Document'})</span>
                      </a>
                    )}
                    {selectedRequest.secondaryDocumentUrl && (
                      <a
                        href={selectedRequest.secondaryDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Proof 2 ({selectedRequest.secondaryDocumentName || 'Document'})</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Digital Approval Timeline */}
            <div className="py-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Digital Approval Journey & Audit Trail
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {approvalHistory.map((h, idx) => (
                  <div key={h._id || idx} className="relative flex items-start gap-4 text-xs">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center z-10 font-bold ${
                        h.action === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : h.action === 'REJECTED'
                          ? 'bg-rose-500 text-white'
                          : h.action === 'CANCELLED'
                          ? 'bg-slate-500 text-white'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {h.action === 'APPROVED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : h.action === 'REJECTED' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900">
                          {h.action} by {h.approver?.name || h.role} ({h.role})
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {h.comments && (
                        <p className="text-slate-600 mt-1 italic">"{h.comments}"</p>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Transition: {h.previousStatus} → {h.newStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {/* If pending, student can cancel */}
              {(selectedRequest.status === 'Pending Faculty Approval' ||
                selectedRequest.status === 'Pending HOD Approval') ? (
                <button
                  onClick={() => handleCancelRequest(selectedRequest._id, selectedRequest.category ? 'od' : 'leave')}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Application'}
                </button>
              ) : <div />}

              <div className="flex gap-2">
                {selectedRequest.category && selectedRequest.status === 'Approved' && (
                  <a
                    href={odApi.getReceiptUrl(selectedRequest._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Official OD Receipt (PDF)
                  </a>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
