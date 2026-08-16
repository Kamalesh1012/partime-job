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
      fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    set({ user: null, token: null, userType: null });
  },
}));

export const useLocationStore = create((set) => ({
  selectedCity: localStorage.getItem('workmate_city') || 'Chennai',
  selectedState: localStorage.getItem('workmate_state') || 'Tamil Nadu',
  selectedArea: localStorage.getItem('workmate_area') || '',
  radiusKm: Number(localStorage.getItem('workmate_radius')) || 10,
  isLocationModalOpen: false,

  setLocation: (city, state, area = '') => {
    localStorage.setItem('workmate_city', city);
    localStorage.setItem('workmate_state', state);
    if (area) localStorage.setItem('workmate_area', area);
    set({ selectedCity: city, selectedState: state, selectedArea: area });
  },
  setRadiusKm: (radiusKm) => {
    localStorage.setItem('workmate_radius', radiusKm);
    set({ radiusKm });
  },
  openLocationModal: () => set({ isLocationModalOpen: true }),
  closeLocationModal: () => set({ isLocationModalOpen: false }),
}));

export const useSafetyStore = create((set) => ({
  isSOSModalOpen: false,
  emergencyContacts: [],
  activeJobContext: null,

  openSOSModal: (jobContext = null) => set({ isSOSModalOpen: true, activeJobContext: jobContext }),
  closeSOSModal: () => set({ isSOSModalOpen: false, activeJobContext: null }),
  setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),
}));

export const useJobStore = create((set) => ({
  jobs: [],
  filteredJobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,
  filters: {
    category: null,
    city: null,
    state: null,
    jobType: null,
    shift: null,
    isUrgent: null,
    isWeekend: null,
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
        city: null,
        state: null,
        jobType: null,
        shift: null,
        isUrgent: null,
        isWeekend: null,
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

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  markAsRead: (notificationId) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.is_read).length,
      };
    }),
}));
