import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { odApi, timetableApi } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { ODCategory, AffectedSession } from '../types/index.js';
import {
  FilePlus2,
  Calendar,
  Building,
  MapPin,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Info,
  X,
} from 'lucide-react';

const CATEGORIES: ODCategory[] = [
  'Academic Event',
  'Symposium',
  'Workshop',
  'Competition',
  'Sports',
  'Internship',
  'Other',
];

export const ODApplyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<ODCategory>('Symposium');
  const [eventName, setEventName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [declarationSigned, setDeclarationSigned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);

  const [affectedSessions, setAffectedSessions] = useState<AffectedSession[]>([]);
  const [calculatingSessions, setCalculatingSessions] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Automatically calculate affected sessions when dates change
  useEffect(() => {
    if (startDate && endDate) {
      if (new Date(endDate) >= new Date(startDate)) {
        setCalculatingSessions(true);
        timetableApi
          .calculateAffected(startDate, endDate)
          .then((res) => {
            if (res.data.success) {
              setAffectedSessions(res.data.data);
            }
          })
          .catch((err) => {
            console.error('Failed to calculate sessions', err);
          })
          .finally(() => {
            setCalculatingSessions(false);
          });
      }
    } else {
      setAffectedSessions([]);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!declarationSigned) {
      setError('You must sign the declaration before submitting.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('eventName', eventName);
      formData.append('organizer', organizer);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('declarationSigned', 'true');
      formData.append('affectedSessions', JSON.stringify(affectedSessions));

      if (file) {
        formData.append('document', file);
      }
      if (secondaryFile) {
        formData.append('secondaryDocument', secondaryFile);
      }

      const res = await odApi.create(formData);
      if (res.data.success) {
        setSuccessMsg(
          `OD Request submitted successfully! Reference: ${res.data.data.refNo}. Forwarded to your faculty advisor.`
        );
        setTimeout(() => {
          navigate(`/student/requests?id=${res.data.data._id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to submit OD application. Please check the form fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Apply for Student On-Duty (OD)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit your official On-Duty clearance request for academic competitions, symposiums, or sports events.
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
        {/* Section 1: Student Information (Auto-populated) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            1. Student Information (Verified Profile)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Student Name</span>
              <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Register Number</span>
              <span className="text-sm font-semibold font-mono text-indigo-700">
                {user?.registerNumber}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Department & Class</span>
              <span className="text-sm font-semibold text-slate-900">
                {user?.department?.code} • {user?.classSection?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Event Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Event & Duty Particulars
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OD Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ODCategory)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event / Activity Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National Hackathon 2026 / Inter-Collegiate Symposium"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organizing Institution / Body <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Madras / IEEE Student Branch"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Location / City <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai / Coimbatore / Online"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose & Nature of Participation <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide event details, role (paper presentation, contest participant, delegate), and expected outcomes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 3: Schedule & Affected Sessions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            3. Date Range & Timetable Mapping
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
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
                End Date <span className="text-rose-500">*</span>
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

          {/* Affected Class Sessions Breakdown */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Affected Class Sessions & Subjects Identified:
              </span>
              <span className="text-xs text-slate-500">
                {calculatingSessions
                  ? 'Calculating timetable...'
                  : `${affectedSessions.length} session(s) mapped`}
              </span>
            </div>

            {affectedSessions.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                {affectedSessions.map((s, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {s.subjectCode} – {s.subjectName}
                      </span>
                      <span className="text-slate-500 ml-2">({s.date})</span>
                    </div>
                    <div className="text-slate-600 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      Period {s.period} ({s.startTime} - {s.endTime})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <span>
                  Select valid start and end dates to automatically inspect scheduled subjects and class sessions.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Document Upload & Declaration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            4. Supporting Proof & Student Declaration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Document Upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Upload Invitation Letter / Brochure / Certificate (PDF, PNG, JPG - max 5MB)
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 transition-colors bg-slate-50/50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="flex text-xs text-slate-600 justify-center">
                    <label className="relative cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500">
                      <span>Upload a document</span>
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
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[180px]">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Duplicate / Additional Document Upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Upload Additional Supporting Document / Letter (PDF, PNG, JPG - max 5MB)
                </label>
                {secondaryFile && (
                  <button
                    type="button"
                    onClick={() => setSecondaryFile(null)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 transition-colors bg-slate-50/50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="flex text-xs text-slate-600 justify-center">
                    <label className="relative cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500">
                      <span>Upload a document</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setSecondaryFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 5MB</p>
                  {secondaryFile && (
                    <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[180px]">{secondaryFile.name}</span> ({(secondaryFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declarationSigned}
                onChange={(e) => setDeclarationSigned(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-indigo-950 font-medium leading-relaxed">
                I hereby declare that the particulars provided above are authentic. I undertake to submit attendance proof or certificate of participation upon my return to validate the On-Duty clearance.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? 'Submitting to Database...' : 'Submit OD Application'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
