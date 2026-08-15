import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { registerWithBackend, fetchCurrentUser } from '../services/auth';
import './LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setUserType = useAuthStore((state) => state.setUserType);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Please enter your email address.');
      if (!password) throw new Error('Please enter a password.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');

      // Register via backend (handles Supabase + users table in one step)
      const data = await registerWithBackend(email.trim(), password, selectedRole, fullName.trim());

      // Backend returns a token immediately — log user in now
      if (data?.access_token) {
        setToken(data.access_token);
        const me = await fetchCurrentUser(data.access_token);
        if (me) {
          setUser(me);
          setUserType(me.role || selectedRole);
        } else {
          setUserType(data.role || selectedRole);
        }

        if (data.needs_email_confirmation) {
          setSuccess('Account created! Please check your email to confirm. Redirecting to dashboard…');
          setTimeout(() => {
            navigate(selectedRole === 'employer' ? '/employer-dashboard' : '/student-dashboard');
          }, 2000);
        } else {
          navigate(selectedRole === 'employer' ? '/employer-dashboard' : '/student-dashboard');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left Side */}
        <div className="login-info">
          <h1>Join WorkMate</h1>
          <p>Create your free account and start finding part-time jobs in Chennai.</p>
          <div className="login-features">
            <div className="feature"><span className="icon">✓</span><span>Free to register</span></div>
            <div className="feature"><span className="icon">✓</span><span>Verified job listings</span></div>
            <div className="feature"><span className="icon">✓</span><span>Direct employer contact</span></div>
            <div className="feature"><span className="icon">✓</span><span>Real-time notifications</span></div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-form-container">
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Create Account</h2>

          {/* Role Selection */}
          <div className="role-selector">
            <label>
              <input type="radio" name="role" value="student"
                checked={selectedRole === 'student'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading} />
              👨‍🎓 Student / Job Seeker
            </label>
            <label>
              <input type="radio" name="role" value="employer"
                checked={selectedRole === 'employer'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading} />
              💼 Employer
            </label>
          </div>

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="error-message" style={{ background: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }}>
              {success}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="signup-link">
            Already have an account?{' '}
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
