import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RoleType } from '../types/index.js';

interface Props {
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home dashboard
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty/approvals" replace />;
    if (user.role === 'hod') return <Navigate to="/hod/approvals" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
