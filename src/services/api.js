import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Using API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  getDetails: (id) => api.get(`/teachers/${id}/details`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),

  // Teacher levels
  addLevel: (teacherId, data) => api.post(`/teachers/${teacherId}/levels`, data),
  updateLevel: (teacherId, levelId, data) => api.put(`/teachers/${teacherId}/levels/${levelId}`, data),
  deleteLevel: (teacherId, levelId) => api.delete(`/teachers/${teacherId}/levels/${levelId}`),

  // Fixed schedules
  addSchedule: (teacherId, data) => api.post(`/teachers/${teacherId}/schedules`, data),
  updateSchedule: (teacherId, scheduleId, data) => api.put(`/teachers/${teacherId}/schedules/${scheduleId}`, data),
  deleteSchedule: (teacherId, scheduleId) => api.delete(`/teachers/${teacherId}/schedules/${scheduleId}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  getWithLevels: (id) => api.get(`/subjects/${id}/levels`),
  getAllLevels: () => api.get('/subjects/levels/all'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),

  // Subject levels
  addLevel: (subjectId, data) => api.post(`/subjects/${subjectId}/levels`, data),
  updateLevel: (subjectId, levelId, data) => api.put(`/subjects/${subjectId}/levels/${levelId}`, data),
  deleteLevel: (subjectId, levelId) => api.delete(`/subjects/${subjectId}/levels/${levelId}`),
};

// Schedule API (Shifts & WorkShifts)
export const scheduleAPI = {
  // Shifts
  getAllShifts: () => api.get('/schedule/shifts'),
  getShiftById: (id) => api.get(`/schedule/shifts/${id}`),
  createShift: (data) => api.post('/schedule/shifts', data),
  updateShift: (id, data) => api.put(`/schedule/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/schedule/shifts/${id}`),

  // WorkShifts
  getWorkShifts: (params) => api.get('/schedule/work-shifts', { params }),
  getTeacherAvailability: (teacherId, date) =>
    api.get('/schedule/work-shifts/availability', { params: { teacherId, date } }),
  createWorkShift: (data) => api.post('/schedule/work-shifts', data),
  createBulkWorkShifts: (data) => api.post('/schedule/work-shifts/bulk', data),
  updateWorkShift: (id, data) => api.put(`/schedule/work-shifts/${id}`, data),
  deleteWorkShift: (id) => api.delete(`/schedule/work-shifts/${id}`),
  deleteWorkShiftsByDateRange: (params) => api.delete('/schedule/work-shifts/bulk/delete', { params }),
};

// Offset Classes API
export const offsetClassesAPI = {
  getAll: (params) => api.get('/offset-classes', { params }),
  getById: (id) => api.get(`/offset-classes/${id}`),
  create: (data) => api.post('/offset-classes', data),
  createWithAssignment: (data) => api.post('/offset-classes/with-assignment', data),
  createBulk: (data) => api.post('/offset-classes/bulk', data),
  update: (id, data) => api.put(`/offset-classes/${id}`, data),
  delete: (id) => api.delete(`/offset-classes/${id}`),

  // Auto-assignment
  autoAssign: (id) => api.post(`/offset-classes/${id}/auto-assign`),
  reallocate: (id) => api.post(`/offset-classes/${id}/reallocate`),

  // Status management
  markCompleted: (id) => api.patch(`/offset-classes/${id}/complete`),
  cancel: (id, reason) => api.patch(`/offset-classes/${id}/cancel`, { reason }),
};

// Dashboard/Statistics API
export const dashboardAPI = {
  // Get teaching hours statistics
  getTeachingHours: (params) => api.get('/dashboard/teaching-hours', { params }),
  getTeacherHoursDetail: (teacherId, params) => api.get(`/dashboard/teaching-hours/${teacherId}`, { params }),

  // Get offset class statistics
  getOffsetClassStatistics: (params) => api.get('/dashboard/offset-statistics', { params }),

  // Get test class statistics
  getTestClassStatistics: (params) => api.get('/dashboard/test-class-statistics', { params }),

  // Legacy methods for backward compatibility
  getTeacherStats: async (teacherId, startDate, endDate) => {
    const [offsetClasses, workShifts] = await Promise.all([
      offsetClassesAPI.getAll({
        teacherId,
        startDate,
        endDate,
        status: 'completed'
      }),
      scheduleAPI.getWorkShifts({
        teacherId,
        startDate,
        endDate
      })
    ]);

    return {
      offsetClasses: offsetClasses.data || [],
      workShifts: workShifts.data || []
    };
  },

  getAllTeachersStats: async (startDate, endDate) => {
    const offsetClasses = await offsetClassesAPI.getAll({ startDate, endDate });
    return offsetClasses.data || [];
  }
};

// Fixed Schedule Leave API
export const fixedScheduleLeaveAPI = {
  getAll: (params) => api.get('/fixed-schedule-leaves', { params }),
  create: (data) => api.post('/fixed-schedule-leaves', data),
  delete: (id) => api.delete(`/fixed-schedule-leaves/${id}`)
};

// Google Sheets API
export const googleSheetsAPI = {
  sync: () => api.get('/google-sheets/sync'),
  import: (data) => api.post('/google-sheets/import', data)
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read')
};

// Supplementary Classes API
export const supplementaryClassesAPI = {
  getAll: (params) => api.get('/supplementary-classes', { params }),
  getById: (id) => api.get(`/supplementary-classes/${id}`),
  create: (data) => api.post('/supplementary-classes', data),
  createWithAssignment: (data) => api.post('/supplementary-classes/with-assignment', data),
  update: (id, data) => api.put(`/supplementary-classes/${id}`, data),
  delete: (id) => api.delete(`/supplementary-classes/${id}`),
  autoAssign: (id) => api.post(`/supplementary-classes/${id}/auto-assign`),
  reallocate: (id) => api.post(`/supplementary-classes/${id}/reallocate`),
  markCompleted: (id) => api.patch(`/supplementary-classes/${id}/complete`),
  cancel: (id, reason) => api.patch(`/supplementary-classes/${id}/cancel`, { reason }),
};

// Test Classes API
export const testClassesAPI = {
  getAll: (params) => api.get('/test-classes', { params }),
  getById: (id) => api.get(`/test-classes/${id}`),
  create: (data) => api.post('/test-classes', data),
  createWithAssignment: (data) => api.post('/test-classes/with-assignment', data),
  update: (id, data) => api.put(`/test-classes/${id}`, data),
  delete: (id) => api.delete(`/test-classes/${id}`),
  autoAssign: (id) => api.post(`/test-classes/${id}/auto-assign`),
  reallocate: (id) => api.post(`/test-classes/${id}/reallocate`),
  markCompleted: (id) => api.patch(`/test-classes/${id}/complete`),
  cancel: (id, reason) => api.patch(`/test-classes/${id}/cancel`, { reason }),
};

export default api;
