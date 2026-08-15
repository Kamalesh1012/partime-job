import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import './LoginPage.css';
import {
  signInWithGoogle,
  signInWithEmail,
  handlePostSignIn,
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
      setLoading(true);

      try {
        const result = await handlePostSignIn();

        if (result?.auth?.access_token) {
          const appToken = result.auth.access_token;

          setToken(appToken);

          if (result.me) {
            setUser(result.me);
            setUserType(result.me.role || 'student');

            if (result.me.role === 'employer') {
              navigate('/employer-dashboard');
            } else if (result.me.role === 'admin') {
              navigate('/admin-dashboard');
            } else {
              navigate('/student-dashboard');
            }
          } else {
            navigate('/student-dashboard');
          }
        }
      } catch (err) {
        // No existing OAuth session is normal.
        console.log('No existing session:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, [navigate, setToken, setUser, setUserType]);

  // Email + password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Please enter your email address.');
      }

      if (!password) {
        throw new Error('Please enter your password.');
      }

      // Login to Supabase
      await signInWithEmail(email.trim(), password);

      // Exchange Supabase session for WorkMate backend token
      const result = await handlePostSignIn();

      if (!result?.auth?.access_token) {
        throw new Error(
          'Login succeeded with Supabase, but the backend did not return an application token.'
        );
      }

      const appToken = result.auth.access_token;

      setToken(appToken);

      // Save user information
      if (result.me) {
        setUser(result.me);

        const role = result.me.role || selectedRole;

        setUserType(role);

        // Redirect according to actual backend role
        if (role === 'employer') {
          navigate('/employer-dashboard');
        } else if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      } else {
        setUserType(selectedRole);

        if (selectedRole === 'employer') {
          navigate('/employer-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      }
    } catch (err) {
      console.error('Email login error:', err);

      setError(
        err?.message ||
          'Login failed. Please check your email and password.'
      );
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
      console.error('Google login error:', err);

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

          <p>
            Find your perfect part-time job in Chennai
          </p>

          <div className="login-features">
            <div className="feature">
              <span className="icon">✓</span>
              <span>Verified part-time opportunities</span>
            </div>

            <div className="feature">
              <span className="icon">✓</span>
              <span>Weekend and freelance jobs</span>
            </div>

            <div className="feature">
              <span className="icon">✓</span>
              <span>Easy application process</span>
            </div>

            <div className="feature">
              <span className="icon">✓</span>
              <span>Real-time notifications</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-form-container">

          {/* Role Selection */}
          <div className="role-selector">

            <label>
              <input
                type="radio"
                name="role"
                value="student"
                checked={selectedRole === 'student'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              />

              👨‍🎓 Student / Job Seeker
            </label>

            <label>
              <input
                type="radio"
                name="role"
                value="employer"
                checked={selectedRole === 'employer'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              />

              💼 Employer
            </label>

          </div>

          {/* Google Login */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : '🔐 Sign in with Google'}
          </button>

          <div className="divider">
            OR
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Email Login */}
          <form onSubmit={handleEmailLogin}>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

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
              <label htmlFor="password">
                Password
              </label>

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

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>

          </form>

          {/* Sign Up */}
          <p className="signup-link">
            Don't have an account?{' '}
            <a
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Create account
            </a>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;