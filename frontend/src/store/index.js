import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('sewaa_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  userType: localStorage.getItem('userType') || null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    if (user) {
      try {
        localStorage.setItem('sewaa_user', JSON.stringify(user));
      } catch (e) {}
    } else {
      localStorage.removeItem('sewaa_user');
    }
    set({ user });
  },
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
      fetch(`${apiBase}/auth/logout`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('sewaa_user');
    set({ user: null, token: null, userType: null });
  },
}));

const getStoredRecentLocations = () => {
  try {
    const raw = localStorage.getItem('sewaa_recent_locations');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { city: 'Chennai', state: 'Tamil Nadu', area: 'Sholinganallur', state_id: 'ST-TN', district_id: 'DIST-TN-CHENN', city_id: 'LOC-TN-SHOLIN', latitude: 12.8996, longitude: 80.2279 },
    { city: 'Bengaluru', state: 'Karnataka', area: 'Whitefield', state_id: 'ST-KA', district_id: 'DIST-KA-BENGA', city_id: 'LOC-KA-WHITEF', latitude: 12.9698, longitude: 77.7500 },
    { city: 'Hyderabad', state: 'Telangana', area: 'Madhapur', state_id: 'ST-TS', district_id: 'DIST-TS-HYDER', city_id: 'LOC-TS-MADHAP', latitude: 17.4483, longitude: 78.3915 },
    { city: 'Mumbai', state: 'Maharashtra', area: 'Andheri West', state_id: 'ST-MH', district_id: 'DIST-MH-MUMBA', city_id: 'LOC-MH-ANDHER', latitude: 19.1136, longitude: 72.8697 },
    { city: 'New Delhi', state: 'Delhi', area: 'Saket', state_id: 'UT-DL', district_id: 'DIST-DL-SOUTH', city_id: 'LOC-DL-SAKET', latitude: 28.5244, longitude: 77.2188 },
  ];
};

export const useLocationStore = create((set, get) => ({
  selectedCity: localStorage.getItem('sewaa_city') || localStorage.getItem('workmate_city') || 'Chennai',
  selectedState: localStorage.getItem('sewaa_state') || localStorage.getItem('workmate_state') || 'Tamil Nadu',
  selectedArea: localStorage.getItem('sewaa_area') || localStorage.getItem('workmate_area') || 'Sholinganallur',
  state_id: localStorage.getItem('sewaa_state_id') || 'ST-TN',
  district_id: localStorage.getItem('sewaa_district_id') || 'DIST-TN-CHENN',
  city_id: localStorage.getItem('sewaa_city_id') || 'LOC-TN-SHOLIN',
  latitude: parseFloat(localStorage.getItem('sewaa_lat')) || 12.8996,
  longitude: parseFloat(localStorage.getItem('sewaa_lng')) || 80.2279,
  radiusKm: Number(localStorage.getItem('sewaa_radius')) || 15,
  recentLocations: getStoredRecentLocations(),
  isLocationModalOpen: false,

  setLocation: (cityOrObj, state, area = '', meta = {}) => {
    let newCity = 'Chennai';
    let newState = 'Tamil Nadu';
    let newArea = '';
    let newStateId = 'ST-TN';
    let newDistrictId = 'DIST-TN-CHENN';
    let newCityId = '';
    let newLat = 12.8996;
    let newLng = 80.2279;

    if (typeof cityOrObj === 'object' && cityOrObj !== null) {
      newCity = cityOrObj.city || cityOrObj.district_name || cityOrObj.name || 'Chennai';
      newState = cityOrObj.state || cityOrObj.state_name || 'Tamil Nadu';
      newArea = cityOrObj.area || cityOrObj.area_name || cityOrObj.locality || '';
      newStateId = cityOrObj.state_id || 'ST-TN';
      newDistrictId = cityOrObj.district_id || 'DIST-TN-CHENN';
      newCityId = cityOrObj.city_id || cityOrObj.id || '';
      newLat = parseFloat(cityOrObj.latitude) || 12.8996;
      newLng = parseFloat(cityOrObj.longitude) || 80.2279;
    } else {
      newCity = cityOrObj || 'Chennai';
      newState = state || 'Tamil Nadu';
      newArea = area || '';
      newStateId = meta.state_id || (newState === 'Tamil Nadu' ? 'ST-TN' : newState === 'Karnataka' ? 'ST-KA' : 'ST-TN');
      newDistrictId = meta.district_id || (newCity === 'Chennai' ? 'DIST-TN-CHENN' : newCity === 'Bengaluru' ? 'DIST-KA-BENGA' : 'DIST-TN-CHENN');
      newCityId = meta.city_id || '';
      newLat = parseFloat(meta.latitude) || (newCity === 'Chennai' ? 12.8996 : 12.9716);
      newLng = parseFloat(meta.longitude) || (newCity === 'Chennai' ? 80.2279 : 77.5946);
    }

    // Persist
    localStorage.setItem('sewaa_city', newCity);
    localStorage.setItem('sewaa_state', newState);
    localStorage.setItem('sewaa_area', newArea);
    localStorage.setItem('sewaa_state_id', newStateId);
    localStorage.setItem('sewaa_district_id', newDistrictId);
    localStorage.setItem('sewaa_city_id', newCityId);
    localStorage.setItem('sewaa_lat', String(newLat));
    localStorage.setItem('sewaa_lng', String(newLng));
    // Backwards compatibility keys
    localStorage.setItem('workmate_city', newCity);
    localStorage.setItem('workmate_state', newState);
    localStorage.setItem('workmate_area', newArea);

    // Update recents
    const currentRecents = get().recentLocations || [];
    const newEntry = {
      city: newCity,
      state: newState,
      area: newArea,
      state_id: newStateId,
      district_id: newDistrictId,
      city_id: newCityId,
      latitude: newLat,
      longitude: newLng,
    };
    const filteredRecents = currentRecents.filter(
      (r) => !(r.city === newCity && (r.area || '') === (newArea || ''))
    );
    const updatedRecents = [newEntry, ...filteredRecents].slice(0, 6);
    try {
      localStorage.setItem('sewaa_recent_locations', JSON.stringify(updatedRecents));
    } catch (e) {}

    set({
      selectedCity: newCity,
      selectedState: newState,
      selectedArea: newArea,
      state_id: newStateId,
      district_id: newDistrictId,
      city_id: newCityId,
      latitude: newLat,
      longitude: newLng,
      recentLocations: updatedRecents,
      isLocationModalOpen: false,
    });
  },

  setRadiusKm: (radiusKm) => {
    localStorage.setItem('sewaa_radius', radiusKm);
    localStorage.setItem('workmate_radius', radiusKm);
    set({ radiusKm });
  },
  setRadius: (radiusKm) => {
    localStorage.setItem('sewaa_radius', radiusKm);
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
