import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { DemoSwitcherBar } from '../components/DemoSwitcherBar.js';
import { NotificationPopover } from '../components/NotificationPopover.js';
import {
  LayoutDashboard,
  CalendarCheck,
  FilePlus2,
  FileText,
  Clock,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role || 'student';

  const navItemsByRole = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/student/apply-od', label: 'Apply On-Duty (OD)', icon: FilePlus2 },
      { to: '/student/apply-leave', label: 'Apply Leave', icon: CalendarCheck },
      { to: '/student/requests', label: 'My Applications', icon: ClipboardList },
      { to: '/student/attendance', label: 'Attendance & Timetable', icon: BookOpen },
    ],
    faculty: [
      { to: '/faculty/approvals', label: 'Approval Queue', icon: ClipboardList },
      { to: '/faculty/attendance', label: 'Class Attendance & Updates', icon: CalendarCheck },
      { to: '/faculty/history', label: 'Requests History', icon: Clock },
    ],
    hod: [
      { to: '/hod/approvals', label: 'Department Approvals', icon: ClipboardList },
      { to: '/hod/analytics', label: 'Department Analytics', icon: BarChart3 },
      { to: '/hod/faculty-activity', label: 'Faculty Activity', icon: Users },
      { to: '/hod/reports', label: 'Department Reports', icon: FileText },
    ],
    admin: [
      { to: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User Directory', icon: Users },
      { to: '/admin/policy', label: 'Attendance Policy', icon: Settings },
      { to: '/admin/audit', label: 'System Audit Logs', icon: Shield },
      { to: '/admin/reports', label: 'System Reports & Export', icon: FileText },
    ],
  };

  const currentNavItems = navItemsByRole[role] || navItemsByRole.student;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1-Click Role Switcher */}
      <DemoSwitcherBar />

      <div className="flex-1 flex">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
          }`}
        >
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                  CampusFlow
                </span>
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                  Smart OD & Leave
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {role} Portal
            </div>
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User profile bottom bar */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold flex items-center justify-center text-sm border border-indigo-500/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate capitalize">
                  {user?.role} {user?.department?.code ? `• ${user.department.code}` : ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {currentNavItems.find((n) => location.pathname.startsWith(n.to))?.label ||
                    'CampusFlow'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* College Banner Tag */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Academic Year 2025-2026</span>
              </div>

              {/* Notification Popover */}
              <NotificationPopover />

              {/* User avatar badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium flex items-center justify-center text-xs shadow-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
