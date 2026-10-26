import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './layouts/AppLayout.js';
import { ProtectedRoute } from './layouts/ProtectedRoute.js';

// Pages
import { AuthPage } from './pages/AuthPage.js';
import { StudentDashboard } from './pages/StudentDashboard.js';
import { ODApplyPage } from './pages/ODApplyPage.js';
import { LeaveApplyPage } from './pages/LeaveApplyPage.js';
import { MyRequestsPage } from './pages/MyRequestsPage.js';
import { AttendanceViewPage } from './pages/AttendanceViewPage.js';
import { FacultyApprovalsPage } from './pages/FacultyApprovalsPage.js';
import { FacultyAttendancePage } from './pages/FacultyAttendancePage.js';
import { FacultyHistoryPage } from './pages/FacultyHistoryPage.js';
import { HODApprovalsPage } from './pages/HODApprovalsPage.js';
import { HODAnalyticsPage } from './pages/HODAnalyticsPage.js';
import { HODFacultyActivityPage } from './pages/HODFacultyActivityPage.js';
import { HODReportsPage } from './pages/HODReportsPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/AdminUsersPage.js';
import { AdminPolicyPage } from './pages/AdminPolicyPage.js';
import { AdminAuditPage } from './pages/AdminAuditPage.js';
import { AdminReportsPage } from './pages/AdminReportsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty/approvals" replace />;
  if (user.role === 'hod') return <Navigate to="/hod/approvals" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Authenticated Layout */}
            <Route element={<AppLayout />}>
              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/apply-od" element={<ODApplyPage />} />
                <Route path="/student/apply-leave" element={<LeaveApplyPage />} />
                <Route path="/student/requests" element={<MyRequestsPage />} />
                <Route path="/student/attendance" element={<AttendanceViewPage />} />
              </Route>

              {/* Faculty Routes */}
              <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
                <Route path="/faculty/approvals" element={<FacultyApprovalsPage />} />
                <Route path="/faculty/attendance" element={<FacultyAttendancePage />} />
                <Route path="/faculty/history" element={<FacultyHistoryPage />} />
              </Route>

              {/* HOD Routes */}
              <Route element={<ProtectedRoute allowedRoles={['hod', 'admin']} />}>
                <Route path="/hod/approvals" element={<HODApprovalsPage />} />
                <Route path="/hod/analytics" element={<HODAnalyticsPage />} />
                <Route path="/hod/faculty-activity" element={<HODFacultyActivityPage />} />
                <Route path="/hod/reports" element={<HODReportsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/policy" element={<AdminPolicyPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
