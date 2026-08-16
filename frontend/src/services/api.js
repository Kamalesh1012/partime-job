import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001/api'
    : '/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================

export const authAPI = {
  googleLogin: (token, userType) =>
    api.post('/auth/google-login', { token, user_type: userType }),
  registerStudent: (userData, profileData) =>
    api.post('/auth/register-student', { ...userData, ...profileData }),
  registerEmployer: (userData, profileData) =>
    api.post('/auth/register-employer', { ...userData, ...profileData }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// ==================== Jobs APIs ====================

export const jobsAPI = {
  getJobs: (filters = {}) => api.get('/jobs', { params: filters }),
  getTrendingJobs: (limit = 10) => api.get('/jobs/trending', { params: { limit } }),
  searchJobs: (query, skip = 0, limit = 20) =>
    api.get('/jobs/search', { params: { q: query, skip, limit } }),
  getJobDetails: (jobId) => api.get(`/jobs/${jobId}`),
  createJob: (jobData, employerId) =>
    api.post('/jobs', jobData, { headers: { 'X-Employer-ID': employerId } }),
  updateJob: (jobId, jobData, employerId) =>
    api.put(`/jobs/${jobId}`, jobData, { headers: { 'X-Employer-ID': employerId } }),
  deleteJob: (jobId, employerId) =>
    api.delete(`/jobs/${jobId}`, { headers: { 'X-Employer-ID': employerId } }),
};

// ==================== Applications APIs ====================

export const applicationsAPI = {
  createApplication: (applicationData, studentId) =>
    api.post('/applications', applicationData, { headers: { 'X-Student-ID': studentId } }),
  getStudentApplications: (studentId, filters = {}) =>
    api.get(`/applications/student/${studentId}`, { params: filters }),
  getJobApplications: (jobId, filters = {}) =>
    api.get(`/applications/job/${jobId}`, { params: filters }),
  getApplicationDetails: (applicationId) =>
    api.get(`/applications/${applicationId}`),
  updateApplicationStatus: (applicationId, status, employerId) =>
    api.put(`/applications/${applicationId}`, { status }, { headers: { 'X-Employer-ID': employerId } }),
  withdrawApplication: (applicationId, studentId) =>
    api.delete(`/applications/${applicationId}`, { headers: { 'X-Student-ID': studentId } }),
};

// ==================== Profiles APIs ====================

export const profilesAPI = {
  getStudentProfile: (userId) => api.get(`/profiles/student/${userId}`),
  updateStudentProfile: (userId, profileData) =>
    api.put(`/profiles/student/${userId}`, profileData),
  getEmployerProfile: (userId) => api.get(`/profiles/employer/${userId}`),
  updateEmployerProfile: (userId, profileData) =>
    api.put(`/profiles/employer/${userId}`, profileData),
  getEmployerStats: (userId) => api.get(`/profiles/employer/${userId}/stats`),
  saveJob: (jobId, studentId) =>
    api.post(`/profiles/saved-jobs/${jobId}`, { student_id: studentId }),
  unsaveJob: (jobId, studentId) =>
    api.delete(`/profiles/saved-jobs/${jobId}`, { headers: { 'X-Student-ID': studentId } }),
  getSavedJobs: (studentId) => api.get(`/profiles/saved-jobs/${studentId}`),
};

// ==================== Notifications APIs ====================

export const notificationsAPI = {
  getNotifications: (userId, filters = {}) =>
    api.get(`/notifications/user/${userId}`, { params: filters }),
  getNotificationDetails: (notificationId) =>
    api.get(`/notifications/${notificationId}`),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) =>
    api.put(`/notifications/user/${userId}/read-all`),
  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`),
};

// ==================== Admin APIs ====================

export const adminAPI = {
  getUnverifiedEmployers: (skip = 0, limit = 20) =>
    api.get('/admin/employers', { params: { skip, limit } }),
  verifyEmployer: (employerId) =>
    api.post(`/admin/employers/${employerId}/verify`),
  removeFakeJob: (jobId, reason) =>
    api.delete(`/admin/jobs/${jobId}`, { params: { reason } }),
  getReports: (skip = 0, limit = 20) =>
    api.get('/admin/reports', { params: { skip, limit } }),
  reportJob: (jobId, reason, studentId) =>
    api.post(`/admin/reports/${jobId}`, {}, { params: { reason, student_id: studentId } }),
  getAnalytics: () => api.get('/admin/analytics'),
};

export default api;
