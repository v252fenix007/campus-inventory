import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { RoleType } from '../types/index.js';
import { UserCheck, Shield, GraduationCap, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoSwitcherBar: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (role: RoleType) => {
    await quickDemoLogin(role);
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'faculty') navigate('/faculty/approvals');
    else if (role === 'hod') navigate('/hod/approvals');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const roles = [
    {
      id: 'student' as RoleType,
      label: 'Student',
      sub: 'Alex (21CSR042)',
      icon: GraduationCap,
      color: 'bg-emerald-500',
    },
    {
      id: 'faculty' as RoleType,
      label: 'Faculty Advisor',
      sub: 'Prof. Grace Hopper',
      icon: UserCheck,
      color: 'bg-indigo-500',
    },
    {
      id: 'hod' as RoleType,
      label: 'HOD (CSE)',
      sub: 'Dr. Alan Turing',
      icon: Building2,
      color: 'bg-purple-500',
    },
    {
      id: 'admin' as RoleType,
      label: 'Administrator',
      sub: 'Dr. Sarah Jenkins',
      icon: Shield,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="font-semibold text-slate-300">Live Demo Role Switcher:</span>
        <span className="text-slate-400 hidden sm:inline">Test multi-role approval flows instantly</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = user?.role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSwitch(r.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={`Switch to ${r.label} (${r.sub})`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
              {isActive && (
                <span className="bg-white/20 text-[10px] px-1 py-0.2 rounded font-mono">Active</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
