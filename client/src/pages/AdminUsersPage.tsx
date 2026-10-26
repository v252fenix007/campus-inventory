import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import { User, RoleType } from '../types/index.js';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Shield,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Metadata
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [role, setRole] = useState<RoleType>('student');
  const [departmentId, setDepartmentId] = useState('');
  const [classSectionId, setClassSectionId] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [staffId, setStaffId] = useState('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ role: roleFilter, search });
      if (res.data.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    adminApi.getMetadata().then((res) => {
      if (res.data.success) {
        setDepartments(res.data.data.departments || []);
        setClasses(res.data.data.classes || []);
        if (res.data.data.departments?.length > 0) {
          setDepartmentId(res.data.data.departments[0]._id);
        }
        if (res.data.data.classes?.length > 0) {
          setClassSectionId(res.data.data.classes[0]._id);
        }
      }
    });
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        department: departmentId || undefined,
        phone,
      };

      if (role === 'student') {
        payload.registerNumber = registerNumber;
        payload.classSection = classSectionId || undefined;
      } else {
        payload.staffId = staffId;
      }

      const res = await adminApi.createUser(payload);
      if (res.data.success) {
        setSuccessMsg('User successfully created and active in system directory.');
        setTimeout(() => {
          setShowModal(false);
          setName('');
          setEmail('');
          setRegisterNumber('');
          setStaffId('');
          setPhone('');
          setSuccessMsg('');
          fetchUsers();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userObj: User) => {
    try {
      await adminApi.updateUser(userObj._id, { isActive: !userObj.isActive });
      setUsers((prev) =>
        prev.map((u) => (u._id === userObj._id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional User Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated students, faculty advisors, department heads, and administrative accounts
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New User</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, register no, staff ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty Advisors</option>
            <option value="hod">HODs</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Name & ID</th>
                <th className="py-3 px-6">Email Address</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Department / Class</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        {u.registerNumber || u.staffId || 'ID: —'}
                      </div>
                    </td>
                    <td className="py-3 px-6 font-mono text-[11px] text-slate-600">{u.email}</td>
                    <td className="py-3 px-6">
                      <span className="capitalize font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {u.department?.code || '—'} {u.classSection ? `• ${u.classSection.name}` : ''}
                    </td>
                    <td className="py-3 px-6">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          u.isActive
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Register New User Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@campusflow.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl capitalize"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {role === 'student' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Class Section</label>
                    <select
                      value={classSectionId}
                      onChange={(e) => setClassSectionId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} (Sem {c.semester})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Staff ID</label>
                    <input
                      type="text"
                      placeholder="FAC-CSE-105"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {role === 'student' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Register Number</label>
                  <input
                    type="text"
                    required
                    placeholder="21CSR120"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 98401 23456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
