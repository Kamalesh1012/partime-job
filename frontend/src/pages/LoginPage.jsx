import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle OAuth redirect / existing Supabase session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const result = await handlePostSignIn();
        if (result?.auth?.access_token) {
          const appToken = result.auth.access_token;
          setToken(appToken);
          if (result.me) {
            setUser(result.me);
            setUserType(result.me.role || 'student');
            redirectByRole(result.me.role);
          } else {
            navigate('/student-dashboard');
          }
        }
      } catch (err) {
        // No existing OAuth session — normal
      }
    };
    checkExistingSession();
  }, []);

  const redirectByRole = (role) => {
    if (role === 'employer') navigate('/employer-dashboard');
    else if (role === 'admin') navigate('/admin-dashboard');
    else navigate('/student-dashboard');
  };

  // Email + password login via backend directly
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Please enter your email address.');
      if (!password) throw new Error('Please enter your password.');

      // Call backend login endpoint directly (no Supabase JS needed)
      const data = await loginWithBackend(email.trim(), password, selectedRole);

      const appToken = data.access_token;
      setToken(appToken);

      // Get user profile
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
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Google login
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

        {/* Left Side */}
        <div className="login-info">
          <h1>Welcome to WorkMate</h1>
          <p>Find your perfect part-time job in Chennai</p>
          <div className="login-features">
            <div className="feature"><span className="icon">✓</span><span>Verified part-time opportunities</span></div>
            <div className="feature"><span className="icon">✓</span><span>Weekend and freelance jobs</span></div>
            <div className="feature"><span className="icon">✓</span><span>Easy application process</span></div>
            <div className="feature"><span className="icon">✓</span><span>Real-time notifications</span></div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-form-container">

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

          {/* Google Login */}
          <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'Loading...' : '🔐 Sign in with Google'}
          </button>

          <div className="divider">OR</div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Email Login */}
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up */}
          <p className="signup-link">
            Don't have an account?{' '}
            <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;