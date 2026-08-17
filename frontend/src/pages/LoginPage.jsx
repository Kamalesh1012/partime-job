import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { loginWithBackend, loginWithPhoneOtp, sendOtp, getCurrentUser } from '../services/auth';
import './LoginPage.css';

const LoginPage = ({ setIsLoggedIn, setUserType }) => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setStoreUserType = useAuthStore((state) => state.setUserType);

  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  const [selectedRole, setSelectedRole] = useState('worker');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(phone, 'mobile', 'login');
      setOtpSent(true);
      setCooldown(30);
      setSuccessMsg(res?.message || 'Verification OTP sent to your mobile.');
      if (res?.dev_hint) {
        setOtp(res.dev_hint);
      }
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginWithPhoneOtp(phone, otp);
      if (data?.access_token) {
        completeSession(data);
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email or mobile.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginWithBackend(email.trim(), password, selectedRole);
      if (data?.access_token) {
        completeSession(data);
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (data) => {
    setToken(data.access_token);
    const resolvedRole = data.role || selectedRole;
    setStoreUserType(resolvedRole);
    if (setUserType) setUserType(resolvedRole);
    if (setIsLoggedIn) setIsLoggedIn(true);

    try {
      const me = await getCurrentUser(data.access_token);
      if (me) {
        setUser(me);
        localStorage.setItem('sewaa_user', JSON.stringify(me));
      } else {
        const fallbackUser = {
          id: data.user_id || 'user-' + Date.now(),
          email: data.email || email.trim(),
          full_name: data.full_name || 'SEWAA Member',
          role: resolvedRole,
          phone: data.phone || phone,
          city: data.city || 'Chennai',
          state: data.state || 'Tamil Nadu',
        };
        setUser(fallbackUser);
        localStorage.setItem('sewaa_user', JSON.stringify(fallbackUser));
      }
    } catch (e) {}

    if (resolvedRole === 'employer') {
      navigate('/employer-dashboard');
    } else if (resolvedRole === 'technician') {
      navigate('/services');
    } else {
      navigate('/jobs');
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoRole) => {
    setError('');
    setLoading(true);
    try {
      const data = await loginWithBackend(demoEmail, 'password123', demoRole);
      if (data?.access_token) {
        completeSession(data);
      }
    } catch (err) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side Info */}
        <div className="login-info">
          <div className="platform-tag-pill">🇮🇳 PAN-INDIA PART-TIME & LOCAL SERVICES</div>
          <div className="auth-logo-header">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="auth-brand-logo" />
            <div>
              <h1>SEWAA</h1>
              <span className="auth-brand-sub">Part-Time Jobs & Local Services</span>
            </div>
          </div>
          <p className="auth-brand-tagline">
            Your trusted gateway to verified shifts, daily wage opportunities, and on-demand doorstep service gigs across India.
          </p>

          <div className="login-features">
            <div className="feature">
              <span className="icon">⚡</span>
              <span>Same-day payouts & flexible part-time shifts</span>
            </div>
            <div className="feature">
              <span className="icon">🛡️</span>
              <span>100% Verified employers & skilled technicians</span>
            </div>
            <div className="feature">
              <span className="icon">📍</span>
              <span>Hyperlocal matching in your district & neighborhood</span>
            </div>
          </div>

          <div className="demo-accounts-box">
            <p className="demo-title">⚡ Fast Test Accounts:</p>
            <div className="demo-chips-grid">
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickDemoLogin('worker@sewaa.in', 'worker')}
              >
                👷 Worker (Arun)
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickDemoLogin('tech@sewaa.in', 'technician')}
              >
                🔧 Technician (Murugan)
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickDemoLogin('employer@sewaa.in', 'employer')}
              >
                🏢 Employer (Kavitha)
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickDemoLogin('customer@sewaa.in', 'customer')}
              >
                👤 Customer (Deepa)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Welcome Back 👋</h2>
            <p>Log in to discover shifts, manage work requests, and earn.</p>
          </div>

          {/* Mode Switcher: Mobile OTP vs Email/Password */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`mode-tab-btn ${authMode === 'otp' ? 'active' : ''}`}
              onClick={() => { setAuthMode('otp'); setError(''); }}
            >
              📱 Mobile OTP Login
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${authMode === 'password' ? 'active' : ''}`}
              onClick={() => { setAuthMode('password'); setError(''); }}
            >
              🔑 Email / Password
            </button>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
          {successMsg && <div className="success-message">✅ {successMsg}</div>}

          {authMode === 'otp' ? (
            /* Telegram-Style Clean Mobile OTP Flow */
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="auth-form-body">
                <div className="form-group">
                  <label htmlFor="loginPhone">Mobile Number *</label>
                  <div className="phone-input-row">
                    <span className="country-code-badge">🇮🇳 +91</span>
                    <input
                      id="loginPhone"
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send Verification OTP →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpLogin} className="auth-form-body">
                <div className="otp-banner">
                  <span>📱 Code sent to <strong>+91 {phone}</strong></span>
                  <button type="button" className="btn-link-edit" onClick={() => setOtpSent(false)}>
                    Change Number
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="loginOtp">Enter 6-Digit Verification Code *</label>
                  <input
                    id="loginOtp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    className="otp-boxed-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>

                <div className="otp-resend-row">
                  {cooldown > 0 ? (
                    <span className="resend-cooldown">Resend OTP in <strong>{cooldown}s</strong></span>
                  ) : (
                    <button type="button" className="resend-btn" onClick={handleSendOtp} disabled={loading}>
                      🔄 Resend OTP
                    </button>
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Log In →'}
                </button>
              </form>
            )
          ) : (
            /* Email & Password Flow */
            <form onSubmit={handlePasswordLogin} className="auth-form-body">
              <div className="form-group">
                <label>Account Role *</label>
                <div className="role-selector-pills">
                  {[
                    { id: 'worker', label: '👷 Worker' },
                    { id: 'technician', label: '🔧 Tech' },
                    { id: 'employer', label: '🏢 Employer' },
                    { id: 'customer', label: '👤 Customer' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`role-pill ${selectedRole === r.id ? 'active' : ''}`}
                      onClick={() => setSelectedRole(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="loginEmail">Email Address or Mobile *</label>
                <input
                  id="loginEmail"
                  type="text"
                  required
                  placeholder="e.g. worker@sewaa.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Password *</label>
                <input
                  id="loginPassword"
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In to SEWAA →'}
              </button>
            </form>
          )}

          <div className="login-form-footer">
            <p>
              New to SEWAA?{' '}
              <Link to="/register" className="auth-switch-link">
                Join Free (Create Verified Account) →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;