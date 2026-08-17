import axios from 'axios';
import { supabase } from './supabaseClient';

// ============================================
// API BASE URL CONFIGURATION
// ============================================

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    // If in dev environment, prioritize /api which proxies via Vite, or direct 127.0.0.1:8001/api
    return '/api';
  }
  return 'http://127.0.0.1:8001/api';
};

const apiBase = getApiBase();

// Create configured Axios instance for Auth with 10s timeout
const authClient = axios.create({
  baseURL: apiBase,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract clean error message
const parseAuthError = (err, defaultMsg = 'Authentication request failed.') => {
  if (err?.response?.data?.detail) {
    return err.response.data.detail;
  }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Connection timed out. Please check your internet connection and try again.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'We could not connect to SEWAA servers. Please check your internet connection and try again.';
  }
  return err?.message || defaultMsg;
};

// ============================================
// DIRECT BACKEND LOGIN
// ============================================

export async function loginWithBackend(email, password, role = 'worker') {
  try {
    const response = await authClient.post('/auth/login', {
      email: email.trim(),
      password,
      role,
    });
    const data = response.data;
    if (!data?.access_token) {
      throw new Error('No access token returned from server.');
    }
    return data;
  } catch (err) {
    // If proxied /api failed with network error, attempt direct fallback to port 8001
    if (err?.message === 'Network Error' && typeof window !== 'undefined') {
      try {
        const directResp = await axios.post(
          'http://127.0.0.1:8001/api/auth/login',
          { email: email.trim(), password, role },
          { timeout: 8000 }
        );
        if (directResp.data?.access_token) return directResp.data;
      } catch (fallbackErr) {
        throw new Error(parseAuthError(fallbackErr, 'Login failed. Please check your credentials.'));
      }
    }
    throw new Error(parseAuthError(err, 'Login failed. Please check your credentials.'));
  }
}

// ============================================
// DIRECT BACKEND REGISTER
// ============================================

export async function registerWithBackend(
  email,
  password,
  role = 'worker',
  fullName = '',
  phone = '',
  city = 'Chennai',
  state = 'Tamil Nadu'
) {
  try {
    const response = await authClient.post('/auth/register', {
      email: email.trim(),
      password,
      role,
      full_name: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.trim(),
    });
    const data = response.data;
    if (!data?.access_token) {
      throw new Error('No access token returned from server.');
    }
    return data;
  } catch (err) {
    // If proxied /api failed with network error, attempt direct fallback to port 8001
    if (err?.message === 'Network Error' && typeof window !== 'undefined') {
      try {
        const directResp = await axios.post(
          'http://127.0.0.1:8001/api/auth/register',
          {
            email: email.trim(),
            password,
            role,
            full_name: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            state: state.trim(),
          },
          { timeout: 8000 }
        );
        if (directResp.data?.access_token) return directResp.data;
      } catch (fallbackErr) {
        throw new Error(parseAuthError(fallbackErr, 'Registration failed. Please try again.'));
      }
    }
    throw new Error(parseAuthError(err, 'Registration failed. Please try again.'));
  }
}

// ============================================
// GET CURRENT USER FROM BACKEND
// ============================================

export async function fetchCurrentUser(token) {
  if (!token) return null;
  try {
    const res = await authClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    try {
      const directRes = await axios.get('http://127.0.0.1:8001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return directRes.data;
    } catch {
      return null;
    }
  }
}

// ============================================
// GOOGLE LOGIN (Supabase OAuth)
// ============================================

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` },
  });
  if (error) throw error;
  return data;
}

// ============================================
// EMAIL + PASSWORD (Supabase JS — kept for OAuth flow)
// ============================================

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password, userData = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: userData },
  });
  if (error) throw error;
  return data;
}

// ============================================
// EXCHANGE SUPABASE TOKEN WITH BACKEND
// ============================================

export async function exchangeTokenWithBackend(accessToken) {
  if (!accessToken) throw new Error('Supabase access token is missing.');

  try {
    const response = await authClient.post('/auth/supabase-login', {
      access_token: accessToken,
    });
    const appToken = response.data?.access_token;
    if (!appToken) throw new Error('Backend did not return an application token.');
    const me = await fetchCurrentUser(appToken);
    return { auth: response.data, me };
  } catch (error) {
    if (error?.response?.data?.detail) throw new Error(error.response.data.detail);
    throw error;
  }
}

// ============================================
// HANDLE GOOGLE OAUTH REDIRECT
// ============================================

export async function handlePostSignIn() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data?.session;
    if (!session?.access_token) return null;
    return await exchangeTokenWithBackend(session.access_token);
  } catch (error) {
    throw error;
  }
}

// ============================================
// LOGOUT
// ============================================

export async function logout() {
  try {
    if (supabase) await supabase.auth.signOut();
  } catch {}
  try {
    await authClient.post('/auth/logout');
  } catch {}
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('sewaa_user');
  sessionStorage.clear();
  window.location.href = '/login';
}

// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.access_token) {
      try {
        const data = await exchangeTokenWithBackend(session.access_token);
        callback(event, data?.me);
      } catch {
        callback(event, null);
      }
    } else if (event === 'SIGNED_OUT') {
      callback(event, null);
    }
  });
}