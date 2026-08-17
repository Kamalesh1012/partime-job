import axios from 'axios';
import { supabase } from './supabaseClient';

// ============================================
// API BASE URL CONFIGURATION
// ============================================

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
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
export const parseAuthError = (err, defaultMsg = 'Authentication request failed.') => {
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
    return 'Unable to connect to SEWAA servers. Please check your internet connection and try again.';
  }
  return err?.message || defaultMsg;
};

// ============================================
// OTP & VERIFICATION SERVICES
// ============================================

export async function sendOtp(phoneOrEmail, channel = 'mobile', purpose = 'registration') {
  try {
    const res = await authClient.post('/auth/otp/send', {
      phone_or_email: phoneOrEmail,
      channel,
      purpose,
    });
    return res.data;
  } catch (err) {
    // Failover directly to 8001 if proxy failed
    if (err?.message === 'Network Error' && typeof window !== 'undefined') {
      try {
        const directResp = await axios.post(
          'http://127.0.0.1:8001/api/auth/otp/send',
          { phone_or_email: phoneOrEmail, channel, purpose },
          { timeout: 8000 }
        );
        return directResp.data;
      } catch (fallbackErr) {
        throw new Error(parseAuthError(fallbackErr, 'Failed to send verification code.'));
      }
    }
    throw new Error(parseAuthError(err, 'Failed to send verification code.'));
  }
}

export async function verifyOtp(phoneOrEmail, otp, channel = 'mobile') {
  try {
    const res = await authClient.post('/auth/otp/verify', {
      phone_or_email: phoneOrEmail,
      otp,
      channel,
    });
    return res.data;
  } catch (err) {
    if (err?.message === 'Network Error' && typeof window !== 'undefined') {
      try {
        const directResp = await axios.post(
          'http://127.0.0.1:8001/api/auth/otp/verify',
          { phone_or_email: phoneOrEmail, otp, channel },
          { timeout: 8000 }
        );
        return directResp.data;
      } catch (fallbackErr) {
        throw new Error(parseAuthError(fallbackErr, 'OTP verification failed.'));
      }
    }
    throw new Error(parseAuthError(err, 'OTP verification failed.'));
  }
}

export async function verifyKyc(documentType, documentNumber, fullName, consentAccepted = true) {
  try {
    const res = await authClient.post('/auth/kyc/verify', {
      document_type: documentType,
      document_number: documentNumber,
      full_name: fullName,
      consent_accepted: consentAccepted,
    });
    return res.data;
  } catch (err) {
    throw new Error(parseAuthError(err, 'Identity verification failed.'));
  }
}

export async function verifyLiveness(faceImageBase64 = null, challengeAction = 'blink_and_smile') {
  try {
    const res = await authClient.post('/auth/liveness/verify', {
      face_image_base64: faceImageBase64,
      challenge_action: challengeAction,
      confidence_score: 0.96,
    });
    return res.data;
  } catch (err) {
    throw new Error(parseAuthError(err, 'Face liveness check failed.'));
  }
}

export async function registerVerifiedUser(userData) {
  try {
    const res = await authClient.post('/auth/register-verified', userData);
    return res.data;
  } catch (err) {
    if (err?.message === 'Network Error' && typeof window !== 'undefined') {
      try {
        const directResp = await axios.post(
          'http://127.0.0.1:8001/api/auth/register-verified',
          userData,
          { timeout: 8000 }
        );
        return directResp.data;
      } catch (fallbackErr) {
        throw new Error(parseAuthError(fallbackErr, 'Account registration failed.'));
      }
    }
    throw new Error(parseAuthError(err, 'Account registration failed.'));
  }
}

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

export async function loginWithPhoneOtp(phone, otp) {
  try {
    const response = await authClient.post('/auth/login/otp', {
      phone: phone.trim(),
      otp: otp.trim(),
    });
    return response.data;
  } catch (err) {
    throw new Error(parseAuthError(err, 'Phone login failed.'));
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
    return response.data;
  } catch (err) {
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
        throw new Error(parseAuthError(fallbackErr, 'Registration failed.'));
      }
    }
    throw new Error(parseAuthError(err, 'Registration failed.'));
  }
}

export async function getCurrentUser(token) {
  try {
    const res = await authClient.get('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (err) {
    throw new Error(parseAuthError(err, 'Failed to fetch user session.'));
  }
}

export async function logoutUser() {
  try {
    await authClient.post('/auth/logout');
  } catch (e) {
    console.warn('Logout warning:', e);
  }
}