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

  const [step, setStep] = useState(1); // 1: Mobile & OTP, 2: Profile & Location, 3: KYC Consent
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('worker'); // 'worker' | 'technician' | 'employer' | 'customer'
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [city, setCity] = useState('Chennai');
  const [pinCode, setPinCode] = useState('600001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!fullName.trim()) throw new Error('Please enter your full name.');
      if (!email.trim()) throw new Error('Please enter your email.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

      const backendRole = selectedRole === 'employer' ? 'employer' : 'student';
      const data = await registerWithBackend(email.trim(), password, backendRole, fullName.trim());

      if (data?.access_token) {
        setToken(data.access_token);
        const me = await fetchCurrentUser(data.access_token);
        if (me) {
          setUser(me);
          setUserType(selectedRole);
        } else {
          setUserType(selectedRole);
        }
        navigate(selectedRole === 'employer' ? '/employer-dashboard' : '/');
      }
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side */}
        <div className="login-info">
          <div className="platform-tag-pill">🇮🇳 Join WorkMate India</div>
          <h1>Find Work & Hire Locally</h1>
          <p>Sign up in under 60 seconds to access part-time jobs and verified local home services across India.</p>
          <div className="login-features">
            <div className="feature"><span className="icon">✓</span><span>Free to join for workers & customers</span></div>
            <div className="feature"><span className="icon">✓</span><span>Direct doorstep booking & hourly gigs</span></div>
            <div className="feature"><span className="icon">✓</span><span>24x7 Safety & SOS Emergency Network</span></div>
            <div className="feature"><span className="icon">✓</span><span>Transparent pay & trusted badge ratings</span></div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-form-container">
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Step {step} of 2 – {step === 1 ? 'Mobile Verification' : 'Profile & Location'}
          </p>

          {/* Role Selector */}
          <div className="auth-role-tabs">
            <button
              className={`role-tab ${selectedRole === 'worker' ? 'active' : ''}`}
              onClick={() => setSelectedRole('worker')}
            >
              🛵 Worker
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

          {error && <div className="error-message">{error}</div>}

          {step === 1 ? (
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
                <small className="form-helper-text">
                  We verify your phone number to keep the community safe and stop fake profiles.
                </small>
              </div>

              <button type="submit" className="btn btn-primary submit-btn">
                Next: Enter Profile Details →
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

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

              <div className="form-cols-2-auth">
                <div className="form-group">
                  <label>State / UT</label>
                  <select value={stateName} onChange={(e) => setStateName(e.target.value)}>
                    {ALL_INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>City / District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai / Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="privacy-consent-box">
                <span className="p-shield">🛡️</span>
                <span>By registering, you agree to WorkMate India terms and our privacy-first data protection guidelines.</span>
              </div>

              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Free Registration ✓'}
              </button>

              <button type="button" className="btn-text-resend" onClick={() => setStep(1)}>
                ← Back to Mobile Number
              </button>
            </form>
          )}

          <p className="register-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
