import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import './LoginPage.css';
import {
  loginWithBackend,
  signInWithGoogle,
  handlePostSignIn,
  fetchCurrentUser,
} from '../services/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setUserType = useAuthStore((state) => state.setUserType);

  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('worker'); // 'worker' | 'technician' | 'employer' | 'customer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const result = await handlePostSignIn();
        if (result?.auth?.access_token) {
          const appToken = result.auth.access_token;
          setToken(appToken);
          if (result.me) {
            setUser(result.me);
            setUserType(result.me.role || 'worker');
            redirectByRole(result.me.role);
          } else {
            navigate('/');
          }
        }
      } catch (err) {}
    };
    checkExistingSession();
  }, []);

  const redirectByRole = (role) => {
    if (role === 'employer') navigate('/employer-dashboard');
    else if (role === 'admin') navigate('/admin-dashboard');
    else navigate('/');
  };

  // OTP Flow
  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the 4-6 digit OTP sent to your phone.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const fakeToken = `wm-auth-${Date.now()}`;
      setToken(fakeToken);
      const fakeUser = {
        id: `user-${phone.slice(-6)}`,
        phone: `+91 ${phone}`,
        full_name: 'WorkMate Partner',
        role: selectedRole,
      };
      setUser(fakeUser);
      setUserType(selectedRole);
      redirectByRole(selectedRole);
    }, 800);
  };

  // Email + password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Please enter your email address.');
      if (!password) throw new Error('Please enter your password.');

      const data = await loginWithBackend(email.trim(), password, selectedRole === 'customer' || selectedRole === 'technician' ? 'student' : selectedRole);
      const appToken = data.access_token;
      setToken(appToken);

      const me = await fetchCurrentUser(appToken);
      if (me) {
        setUser(me);
        setUserType(me.role || data.role || selectedRole);
        redirectByRole(me.role || data.role || selectedRole);
      } else {
        setUserType(data.role || selectedRole);
        redirectByRole(data.role || selectedRole);
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side Branding */}
        <div className="login-info">
          <div className="platform-tag-pill">🇮🇳 Available Across India</div>
          <div className="auth-logo-header">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="auth-brand-logo" />
            <div>
              <h1>SEWAA India</h1>
              <p className="auth-brand-sub">Part-Time Jobs & Local Services</p>
            </div>
          </div>
          <p className="auth-brand-tagline">Find work. Find services. Connect locally.</p>
          <div className="login-features">
            <div className="feature"><span className="icon">⚡</span><span>Instant local part-time work & events</span></div>
            <div className="feature"><span className="icon">🔧</span><span>Trusted technicians & appliance repair</span></div>
            <div className="feature"><span className="icon">🪪</span><span>Privacy-compliant identity verification</span></div>
            <div className="feature"><span className="icon">💵</span><span>Daily & weekly payout options</span></div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="login-form-container">
          {/* Role Tabs */}
          <div className="auth-role-tabs">
            <button
              className={`role-tab ${selectedRole === 'worker' ? 'active' : ''}`}
              onClick={() => setSelectedRole('worker')}
            >
              🛵 Worker / Gig
            </button>
            <button
              className={`role-tab ${selectedRole === 'technician' ? 'active' : ''}`}
              onClick={() => setSelectedRole('technician')}
            >
              🔧 Technician
            </button>
            <button
              className={`role-tab ${selectedRole === 'employer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('employer')}
            >
              💼 Employer
            </button>
            <button
              className={`role-tab ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
            >
              🏠 Customer
            </button>
          </div>

          {/* Mode Tabs: OTP vs Password */}
          <div className="auth-mode-switch">
            <button
              className={`mode-btn ${authMode === 'otp' ? 'active' : ''}`}
              onClick={() => setAuthMode('otp')}
            >
              📱 Mobile OTP Login
            </button>
            <button
              className={`mode-btn ${authMode === 'password' ? 'active' : ''}`}
              onClick={() => setAuthMode('password')}
            >
              🔑 Email / Password
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {authMode === 'otp' ? (
            !otpSent ? (
              <form onSubmit={handleSendOTP} className="login-form">
                <div className="form-group">
                  <label>Mobile Number (India +91)</label>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      maxLength="10"
                      required
                      placeholder="98401 23456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <small className="form-helper-text">We verify your mobile number via OTP for trusted security.</small>
                </div>
                <button type="submit" className="btn btn-primary submit-btn">
                  Send OTP Verification Code →
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="login-form">
                <div className="form-group">
                  <label>Enter 6-Digit OTP sent to +91 {phone}</label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoFocus
                  />
                  <small className="form-helper-text">Test Demo: Any 6 digits (e.g. 123456) will verify instantly.</small>
                </div>
                <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                  {loading ? 'Verifying OTP...' : 'Verify & Sign In ✓'}
                </button>
                <button type="button" className="btn-text-resend" onClick={() => setOtpSent(false)}>
                  ← Change Mobile Number
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailLogin} className="login-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In with Password'}
              </button>
            </form>
          )}

          <div className="divider"><span>OR</span></div>

          <button
            type="button"
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="google-icon">G</span>
            <span>Continue with Google</span>
          </button>

          <p className="register-link">
            New to WorkMate India? <Link to="/register">Create Free Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;