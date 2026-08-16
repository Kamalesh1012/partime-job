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

// ==================== Pan-India Locations APIs ====================

export const locationsAPI = {
  getStates: (type) => api.get('/locations/states', { params: { type } }),
  getStateById: (stateId) => api.get(`/locations/states/${stateId}`),
  getDistricts: (stateId) => api.get(`/locations/states/${stateId}/districts`),
  getCities: (districtId) => api.get(`/locations/districts/${districtId}/cities`),
  getPopularCities: () => api.get('/locations/popular'),
  searchLocation: (query) => api.get('/locations/search', { params: { q: query } }),
  reverseGeocode: (latitude, longitude) =>
    api.get('/locations/reverse-geocode', { params: { latitude, longitude } }),
  getHierarchy: () => api.get('/locations/hierarchy'),
};

// ==================== Jobs APIs ====================

export const jobsAPI = {
  getJobs: (filters = {}) => api.get('/jobs', { params: filters }),
  getNearbyJobs: (latitude, longitude, radius = 15, category = '', job_type = '', limit = 30) =>
    api.get('/jobs/nearby', { params: { latitude, longitude, radius, category, job_type, limit } }),
  getJobsForMap: (filters = {}) => api.get('/jobs/map', { params: filters }),
  getJobCountsByLocation: () => api.get('/jobs/counts-by-location'),
  getTrendingJobs: (limit = 10) => api.get('/jobs/trending', { params: { limit } }),
  searchJobs: (query, city = '', state = '', skip = 0, limit = 20) =>
    api.get('/jobs/search', { params: { q: query, city, state, skip, limit } }),
  getJobDetails: (jobId) => api.get(`/jobs/${jobId}`),
  createJob: (jobData, employerId) =>
    api.post('/jobs', jobData, { headers: { 'X-Employer-ID': employerId } }),
  updateJob: (jobId, jobData, employerId) =>
    api.put(`/jobs/${jobId}`, jobData, { headers: { 'X-Employer-ID': employerId } }),
  deleteJob: (jobId, employerId) =>
    api.delete(`/jobs/${jobId}`, { headers: { 'X-Employer-ID': employerId } }),
};

// ==================== Technician & Home Services APIs ====================

export const servicesAPI = {
  getCategories: () => api.get('/services/categories'),
  getTechnicians: (params = {}) => api.get('/services/technicians', { params }),
  getTechnicianDetail: (techId) => api.get(`/services/technicians/${techId}`),
  bookService: (bookingData) => api.post('/services/book', bookingData),
  getCustomerRequests: (customerId) => api.get(`/services/requests/customer/${customerId}`),
  updateRequestStatus: (requestId, status) =>
    api.put(`/services/requests/${requestId}/status`, { status }),
  submitReview: (reviewData) => api.post('/services/reviews', reviewData),
};

// ==================== Emergency Safety & SOS APIs ====================

export const safetyAPI = {
  getHelplines: () => api.get('/safety/helplines'),
  getEmergencyContacts: (userId) => api.get(`/safety/emergency-contacts/${userId}`),
  addEmergencyContact: (contactData) => api.post('/safety/emergency-contacts', contactData),
  deleteEmergencyContact: (contactId) => api.delete(`/safety/emergency-contacts/${contactId}`),
  triggerSOS: (payload) => api.post('/safety/sos/trigger', payload),
  cancelSOS: (payload) => api.post('/safety/sos/cancel', payload),
  getUserIncidents: (userId) => api.get(`/safety/incidents/user/${userId}`),
};

// ==================== Active Jobs Live Tracking APIs ====================

export const activeJobsAPI = {
  createActiveJob: (data) => api.post('/active-jobs', data),
  getUserActiveJobs: (userId) => api.get(`/active-jobs/user/${userId}`),
  getActiveJobDetail: (activeJobId) => api.get(`/active-jobs/${activeJobId}`),
  updateActiveJobStatus: (activeJobId, status, coords = {}) =>
    api.put(`/active-jobs/${activeJobId}/status`, { status, ...coords }),
};

// ==================== Verification APIs ====================

export const verificationAPI = {
  submitAadhaarKYC: (userId, maskedId) =>
    api.post('/profiles/verify/aadhaar-kyc', {
      user_id: userId,
      masked_id_number: maskedId,
      consent_given: true,
    }),
  submitFaceLiveness: (userId) =>
    api.post('/profiles/verify/face-liveness', {
      user_id: userId,
      consent_given: true,
    }),
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
  getTechnicianProfile: (userId) => api.get(`/profiles/technician/${userId}`),
  updateTechnicianProfile: (userId, profileData) =>
    api.put(`/profiles/technician/${userId}`, profileData),
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
  getLocations: () => api.get('/admin/locations'),
  addState: (stateData) => api.post('/admin/locations/state', stateData),
  addDistrict: (districtData) => api.post('/admin/locations/district', districtData),
  addCity: (cityData) => api.post('/admin/locations/city', cityData),
  updateLocation: (type, id, data) => api.put(`/admin/locations/${type}/${id}`, data),
};

export default api;
