import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { loginWithBackend, fetchCurrentUser } from '../services/auth';
import './LoginPage.css';

const LoginPage = ({ setIsLoggedIn, setUserType }) => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setStoreUserType = useAuthStore((state) => state.setUserType);

  const [selectedRole, setSelectedRole] = useState('worker'); // 'worker' | 'technician' | 'employer' | 'customer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Please enter your email.');
      if (!password) throw new Error('Please enter your password.');

      const data = await loginWithBackend(email.trim(), password, selectedRole);

      if (data?.access_token) {
        setToken(data.access_token);
        const resolvedRole = data.role || selectedRole;
        setStoreUserType(resolvedRole);
        if (setUserType) setUserType(resolvedRole);
        if (setIsLoggedIn) setIsLoggedIn(true);

        const me = await fetchCurrentUser(data.access_token);
        if (me) {
          setUser(me);
        } else {
          setUser({
            id: data.user_id || 'user-' + Date.now(),
            email: data.email || email.trim(),
            role: resolvedRole,
          });
        }

        if (resolvedRole === 'employer') {
          navigate('/employer-dashboard');
        } else if (resolvedRole === 'technician') {
          navigate('/services');
        } else {
          navigate('/jobs');
        }
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSelectedRole(demoRole);
    setError('');
    setLoading(true);

    try {
      const data = await loginWithBackend(demoEmail, 'password123', demoRole);
      if (data?.access_token) {
        setToken(data.access_token);
        setStoreUserType(demoRole);
        if (setUserType) setUserType(demoRole);
        if (setIsLoggedIn) setIsLoggedIn(true);

        const me = await fetchCurrentUser(data.access_token);
        if (me) setUser(me);

        if (demoRole === 'employer') {
          navigate('/employer-dashboard');
        } else if (demoRole === 'technician') {
          navigate('/services');
        } else {
          navigate('/jobs');
        }
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
          <div className="platform-tag-pill">SEWAA Portal</div>
          <div className="auth-logo-header">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="auth-brand-logo" />
            <div>
              <h1>SEWAA</h1>
              <p className="auth-brand-sub">Part-Time Jobs & Local Services</p>
            </div>
          </div>
          <p className="auth-brand-tagline">
            Log in to manage shifts, track applications, book services, or hire verified local talent.
          </p>
          <div className="login-features">
            <div className="feature">
              <span className="icon">⚡</span>
              <span>Instant Job Applications & Shift Bookings</span>
            </div>
            <div className="feature">
              <span className="icon">🛡️</span>
              <span>24x7 Safety Assurance & GPS Live Tracking</span>
            </div>
            <div className="feature">
              <span className="icon">📍</span>
              <span>Hyperlocal Matching across all 786 Districts</span>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="login-form-container">
          <h2 style={{ marginBottom: '0.35rem', textAlign: 'center' }}>Welcome Back</h2>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Choose your account role to continue
          </p>

          {/* 4 Role Selector Tabs */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`role-tab ${selectedRole === 'worker' ? 'active' : ''}`}
              onClick={() => setSelectedRole('worker')}
            >
              🛵 Worker
            </button>
            <button
              type="button"
              className={`role-tab ${selectedRole === 'technician' ? 'active' : ''}`}
              onClick={() => setSelectedRole('technician')}
            >
              🔧 Technician
            </button>
            <button
              type="button"
              className={`role-tab ${selectedRole === 'employer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('employer')}
            >
              💼 Employer
            </button>
            <button
              type="button"
              className={`role-tab ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
            >
              🏠 Customer
            </button>
          </div>

          {error && <div className="login-error-box">⚠️ {error}</div>}

          <form onSubmit={handleLoginSubmit} className="auth-form-body">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In to SEWAA →'}
            </button>

            {/* Quick Demo Test Buttons */}
            <div className="quick-demo-section">
              <span className="demo-label">⚡ 1-Click Fast Login:</span>
              <div className="quick-demo-chips">
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('worker@sewaa.in', 'worker')}
                >
                  🛵 Worker (Arun)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('tech@sewaa.in', 'technician')}
                >
                  🔧 Tech (Murugan)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('employer@sewaa.in', 'employer')}
                >
                  💼 Employer (Kavitha)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoLogin('customer@sewaa.in', 'customer')}
                >
                  🏠 Customer (Deepa)
                </button>
              </div>
            </div>

            <p className="auth-switch-prompt">
              Don't have an account? <Link to="/register">Create Free Account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;