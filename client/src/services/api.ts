import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Endpoints
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getDemoUsers: () => api.get('/auth/demo-users'),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const odApi = {
  create: (formData: FormData) =>
    api.post('/od', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: any) => api.get('/od', { params }),
  getById: (id: string) => api.get(`/od/${id}`),
  approve: (id: string, comments?: string) => api.post(`/od/${id}/approve`, { comments }),
  reject: (id: string, comments: string) => api.post(`/od/${id}/reject`, { comments }),
  cancel: (id: string) => api.post(`/od/${id}/cancel`),
  getReceiptUrl: (id: string) => `${API_BASE_URL}/od/${id}/receipt`,
};

export const leaveApi = {
  create: (formData: FormData) =>
    api.post('/leave', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: any) => api.get('/leave', { params }),
  getById: (id: string) => api.get(`/leave/${id}`),
  approve: (id: string, comments?: string) => api.post(`/leave/${id}/approve`, { comments }),
  reject: (id: string, comments: string) => api.post(`/leave/${id}/reject`, { comments }),
  cancel: (id: string) => api.post(`/leave/${id}/cancel`),
};

export const attendanceApi = {
  getMyStats: () => api.get('/attendance/my-stats'),
  getStudentStats: (studentId: string) => api.get(`/attendance/student/${studentId}`),
  getClassAttendance: (classSectionId: string, date?: string) =>
    api.get(`/attendance/class/${classSectionId}`, { params: { date } }),
  getDepartmentOverview: (deptId: string) => api.get(`/attendance/department/${deptId}`),
  manualUpdate: (data: any) => api.post('/attendance/manual-update', data),
  getPolicy: () => api.get('/attendance/policy'),
  updatePolicy: (data: any) => api.put('/attendance/policy', data),
};

export const timetableApi = {
  getClassTimetable: (classSectionId: string) => api.get(`/timetable/class/${classSectionId}`),
  calculateAffected: (startDate: string, endDate: string) =>
    api.get('/timetable/calculate-affected', { params: { startDate, endDate } }),
};

export const notificationApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const reportApi = {
  getAttendanceCsvUrl: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/reports/attendance/csv?${query}`;
  },
  getOdCsvUrl: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/reports/od/csv?${query}`;
  },
  getLeaveCsvUrl: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/reports/leave/csv?${query}`;
  },
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getMetadata: () => api.get('/admin/meta'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};
