import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { registerWithBackend, fetchCurrentUser } from '../services/auth';
import { ALL_INDIAN_STATES } from '../data/indiaLocations';
import './LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setUserType = useAuthStore((state) => state.setUserType);

  const [step, setStep] = useState(1); // 1: Role & Mobile, 2: Complete Profile
  const [selectedRole, setSelectedRole] = useState('worker'); // 'worker' | 'technician' | 'employer' | 'customer'
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [city, setCity] = useState('Chennai');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept SEWAA Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerWithBackend(
        email.trim(),
        password,
        selectedRole,
        fullName.trim(),
        phone.trim(),
        city.trim(),
        stateName.trim()
      );

      if (data?.access_token) {
        setRegisteredSuccess(true);
        setToken(data.access_token);
        setUserType(selectedRole);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userType', selectedRole);

        const me = await fetchCurrentUser(data.access_token);
        const resolvedUser = me || {
          id: data.user_id || 'user-' + Date.now(),
          email: email.trim(),
          full_name: fullName.trim(),
          role: selectedRole,
          phone,
          city,
          state: stateName,
        };

        setUser(resolvedUser);
        localStorage.setItem('sewaa_user', JSON.stringify(resolvedUser));

        // Short timeout for visual feedback then immediate redirect into SEWAA
        setTimeout(() => {
          if (selectedRole === 'employer') {
            navigate('/employer-dashboard');
          } else if (selectedRole === 'technician') {
            navigate('/services');
          } else {
            navigate('/jobs');
          }
        }, 600);
      }
    } catch (err) {
      setError(err?.message || 'Registration could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side Branding */}
        <div className="login-info">
          <div className="platform-tag-pill">Join SEWAA India</div>
          <div className="auth-logo-header">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="auth-brand-logo" />
            <div>
              <h1>SEWAA</h1>
              <p className="auth-brand-sub">Part-Time Jobs & Local Services</p>
            </div>
          </div>
          <p className="auth-brand-tagline">
            Join thousands of workers, technicians, employers, and customers across 36 States & UTs.
          </p>
          <div className="login-features">
            <div className="feature">
              <span className="icon">✓</span>
              <span>100% Free Registration for Workers & Techs</span>
            </div>
            <div className="feature">
              <span className="icon">✓</span>
              <span>Flexible Daily, Evening & Weekend Shifts</span>
            </div>
            <div className="feature">
              <span className="icon">✓</span>
              <span>Direct Doorstep Booking with Transparent Rates</span>
            </div>
            <div className="feature">
              <span className="icon">✓</span>
              <span>Verified Profiles & 24x7 Safety Assurance</span>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="login-form-container">
          <h2 style={{ marginBottom: '0.35rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Step {step} of 2 – {step === 1 ? 'Select Role & Mobile' : 'Complete Profile'}
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

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="auth-form-body">
              <div className="form-group">
                <label>Account Role</label>
                <div className="role-explainer-box">
                  {selectedRole === 'worker' && '🛵 Find part-time jobs, daily wage gigs, and flexible delivery shifts.'}
                  {selectedRole === 'technician' && '🔧 Offer electrician, plumbing, AC repair, or appliance services.'}
                  {selectedRole === 'employer' && '💼 Post jobs, hire helpers, and manage part-time staff.'}
                  {selectedRole === 'customer' && '🏠 Book verified home technicians and service professionals.'}
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Your State / Region</label>
                <select value={stateName} onChange={(e) => setStateName(e.target.value)}>
                  {ALL_INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="login-btn">
                Continue to Step 2 →
              </button>

              <p className="auth-switch-prompt">
                Already have an account? <Link to="/login">Log In</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password (Min. 6 characters) *</label>
                <input
                  type="password"
                  placeholder="Create a secure password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Primary City / Town</label>
                <input
                  type="text"
                  placeholder="e.g. Chennai, Madurai, Coimbatore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="consent-checkbox-row">
                <input
                  type="checkbox"
                  id="regTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="regTerms">
                  I agree to SEWAA <Link to="/contact">Terms of Service</Link> and <Link to="/contact">Privacy Policy</Link>.
                </label>
              </div>

              <div className="auth-button-group">
                <button
                  type="button"
                  className="auth-back-btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading || registeredSuccess}
                >
                  {registeredSuccess
                    ? 'Account Created ✓ Joining...'
                    : loading
                    ? 'Creating Account...'
                    : 'Join SEWAA'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
