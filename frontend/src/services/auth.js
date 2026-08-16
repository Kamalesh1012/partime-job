import axios from 'axios';
import { supabase } from './supabaseClient';

// ============================================
// API BASE URL
// ============================================

const apiBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001/api'
    : '/api');

// ============================================
// DIRECT BACKEND LOGIN (no Supabase JS needed)
// ============================================

export async function loginWithBackend(email, password, role = 'student') {
  if (!apiBase) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  try {
    const response = await axios.post(
      `${apiBase}/auth/login`,
      { email: email.trim(), password, role },
      { withCredentials: true }
    );
    const data = response.data;
    if (!data?.access_token) {
      throw new Error('No access token returned from backend.');
    }
    return data;
  } catch (err) {
    if (err?.response?.data?.detail) throw new Error(err.response.data.detail);
    if (err?.response?.data?.message) throw new Error(err.response.data.message);
    throw err;
  }
}

// ============================================
// DIRECT BACKEND REGISTER
// ============================================

export async function registerWithBackend(email, password, role = 'student', fullName = '') {
  if (!apiBase) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  try {
    const response = await axios.post(
      `${apiBase}/auth/register`,
      { email: email.trim(), password, role, full_name: fullName },
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    if (err?.response?.data?.detail) throw new Error(err.response.data.detail);
    if (err?.response?.data?.message) throw new Error(err.response.data.message);
    throw err;
  }
}

// ============================================
// GET CURRENT USER FROM BACKEND
// ============================================

export async function fetchCurrentUser(token) {
  if (!apiBase || !token) return null;
  try {
    const res = await axios.get(`${apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return null;
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
  if (!apiBase) throw new Error('VITE_API_BASE_URL is not configured.');
  if (!accessToken) throw new Error('Supabase access token is missing.');

  try {
    const response = await axios.post(
      `${apiBase}/auth/supabase-login`,
      { access_token: accessToken },
      { withCredentials: true }
    );
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
  if (apiBase) {
    try {
      await axios.post(`${apiBase}/auth/logout`, {}, { withCredentials: true });
    } catch {}
  }
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  sessionStorage.clear();
  window.location.href = '/login';
}

// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(callback) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}