import { supabase } from './supabaseClient';
import axios from 'axios';

// ============================================
// API BASE URL
// ============================================

const apiBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';


// ============================================
// GOOGLE LOGIN
// ============================================

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}


// ============================================
// EMAIL + PASSWORD LOGIN
// ============================================

export async function signInWithEmail(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error(
      'Supabase login succeeded, but no access token was returned.'
    );
  }

  // Send Supabase token to backend
  return exchangeTokenWithBackend(accessToken);
}


// ============================================
// REGISTER WITH EMAIL + PASSWORD
// ============================================

export async function signUpWithEmail(email, password, userData = {}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: userData,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}


// ============================================
// EXCHANGE SUPABASE TOKEN WITH BACKEND
// ============================================

export async function exchangeTokenWithBackend(accessToken) {
  if (!apiBase) {
    throw new Error(
      'VITE_API_BASE_URL is not configured. Please add it to Netlify environment variables.'
    );
  }

  if (!accessToken) {
    throw new Error('Supabase access token is missing.');
  }

  try {
    const response = await axios.post(
      `${apiBase}/auth/supabase-login`,
      {
        access_token: accessToken,
      },
      {
        withCredentials: true,
      }
    );

    const appToken = response.data?.access_token;

    if (!appToken) {
      throw new Error(
        'Login succeeded with Supabase, but the backend did not return an application token.'
      );
    }

    // Get current user from backend
    let me = null;

    try {
      const userResponse = await axios.get(
        `${apiBase}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${appToken}`,
          },
        }
      );

      me = userResponse.data;
    } catch (error) {
      console.warn(
        'Backend login succeeded, but /auth/me failed:',
        error
      );
    }

    return {
      auth: response.data,
      me,
    };
  } catch (error) {
    console.error('Backend authentication error:', error);

    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
}


// ============================================
// HANDLE GOOGLE OAUTH REDIRECT
// ============================================

export async function handlePostSignIn() {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    const session = data?.session;

    // No active Supabase session
    if (!session?.access_token) {
      return null;
    }

    return await exchangeTokenWithBackend(
      session.access_token
    );
  } catch (error) {
    console.error(
      'Post sign-in authentication error:',
      error
    );

    throw error;
  }
}


// ============================================
// GET CURRENT SUPABASE SESSION
// ============================================

export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data?.session || null;
}


// ============================================
// GET CURRENT SUPABASE USER
// ============================================

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data?.user || null;
}


// ============================================
// LOGOUT
// ============================================

export async function logout() {
  // Logout from Supabase
  try {
    if (supabase) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn(
          'Supabase logout error:',
          error
        );
      }
    }
  } catch (error) {
    console.warn(
      'Supabase logout exception:',
      error
    );
  }

  // Logout from backend
  if (apiBase) {
    try {
      await axios.post(
        `${apiBase}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.warn(
        'Backend logout error:',
        error
      );
    }
  }

  // Clear local authentication data
  localStorage.removeItem('token');

  localStorage.removeItem('access_token');

  sessionStorage.removeItem('token');

  sessionStorage.removeItem('access_token');

  // Redirect to login
  window.location.href = '/login';
}


// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(callback) {
  if (!supabase) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange(
    callback
  );
}