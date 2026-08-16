import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  userType: localStorage.getItem('userType') || null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setUserType: (userType) => {
    if (userType) {
      localStorage.setItem('userType', userType);
    } else {
      localStorage.removeItem('userType');
    }
    set({ userType });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://127.0.0.1:8001/api'
          : '/api');
      fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    set({ user: null, token: null, userType: null });
  },
}));

export const useJobStore = create((set) => ({
  jobs: [],
  filteredJobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,
  filters: {
    category: null,
    location: null,
    jobType: null,
    salaryMin: null,
    salaryMax: null,
    searchQuery: null,
  },

  setJobs: (jobs) => set({ jobs }),
  setFilteredJobs: (jobs) => set({ filteredJobs: jobs }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () =>
    set({
      filters: {
        category: null,
        location: null,
        jobType: null,
        salaryMin: null,
        salaryMax: null,
        searchQuery: null,
      },
    }),
}));

export const useApplicationStore = create((set) => ({
  applications: [],
  selectedApplication: null,
  isLoading: false,
  error: null,

  setApplications: (applications) => set({ applications }),
  setSelectedApplication: (application) => set({ selectedApplication: application }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addApplication: (application) =>
    set((state) => ({ applications: [application, ...state.applications] })),
  removeApplication: (applicationId) =>
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== applicationId),
    })),
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
