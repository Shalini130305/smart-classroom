import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Classrooms
export const classroomAPI = {
  getAll: (params) => api.get('/classrooms', { params }),
  getById: (id) => api.get(`/classrooms/${id}`),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
};

// Timetable
export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  getTimeSlots: () => api.get('/timetable/time-slots'),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// Attendance
export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  getByClass: (params) => api.get('/attendance/class', { params }),
  getSummary: (userId) => api.get(`/attendance/summary/${userId || ''}`),
  getStats: () => api.get('/attendance/stats'),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  create: (data) => api.post('/notifications', data),
  broadcast: (data) => api.post('/notifications/broadcast', data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getCourses: () => api.get('/admin/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  getDepartments: () => api.get('/admin/departments'),
};

// AI
export const aiAPI = {
  generateTimetable: (data) => api.post('/ai/generate-timetable', data),
  detectConflicts: (params) => api.get('/ai/detect-conflicts', { params }),
  recommendClassroom: (params) => api.get('/ai/recommend-classroom', { params }),
  chatbot: (data) => api.post('/ai/chatbot', data),
};

export default api;
