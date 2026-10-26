import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.js';
import {
  GraduationCap,
  Shield,
  UserCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, quickDemoLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'faculty') navigate('/faculty/approvals');
      else if (user.role === 'hod') navigate('/hod/approvals');
      else if (user.role === 'admin') navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: any) => {
    setError('');
    setLoading(true);
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.forgotPassword({ email: forgotEmail });
      setForgotMsg(res.data.message || 'Reset token generated');
      if (res.data.data?.token) {
        setResetToken(res.data.data.token);
        setResetStep(2);
      }
    } catch (err: any) {
      setForgotMsg(err.response?.data?.message || 'Error sending reset token');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.resetPassword({ token: resetToken, newPassword });
      setForgotMsg('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgot(false);
        setResetStep(1);
        setForgotMsg('');
      }, 2000);
    } catch (err: any) {
      setForgotMsg(err.response?.data?.message || 'Error resetting password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/30 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">CampusFlow</h2>
        <p className="mt-2 text-sm text-slate-400">
          Smart Student OD & Leave Management System with Automatic Attendance Integration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Institutional Email
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campusflow.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to CampusFlow'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Login Cards */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Or Click To Instant Login As
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Student</div>
                  <div className="text-[10px] text-slate-500">Alex (21CSR042)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('faculty')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Faculty Advisor</div>
                  <div className="text-[10px] text-slate-500">Prof. Grace Hopper</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hod')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">HOD (CSE)</div>
                  <div className="text-[10px] text-slate-500">Dr. Alan Turing</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Administrator</div>
                  <div className="text-[10px] text-slate-500">Dr. Sarah Jenkins</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Account Password Reset</h3>
            <p className="text-xs text-slate-500 mt-1">
              {resetStep === 1
                ? 'Enter your institutional email to generate a secure reset token.'
                : 'Enter your new password to complete the reset.'}
            </p>

            {forgotMsg && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  placeholder="student@campusflow.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Generate Reset Token
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="New secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
