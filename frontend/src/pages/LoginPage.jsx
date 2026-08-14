import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import './LoginPage.css';
import { signInWithGoogle, handlePostSignIn } from '../services/auth';

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

  useEffect(() => {
    // After redirect from Supabase OAuth, handle session and exchange token with backend
    ;(async () => {
      setLoading(true);
      try {
        const result = await handlePostSignIn();
        if (result?.auth?.access_token) {
          const appToken = result.auth.access_token;
          setToken(appToken);
          if (result.me) {
            setUser(result.me);
            setUserType(result.me.role || 'student');
            // Redirect based on role
            if (result.me.role === 'employer') navigate('/employer-dashboard');
            else if (result.me.role === 'admin') navigate('/admin-dashboard');
            else navigate('/student-dashboard');
          } else {
            // No /me info — default redirect to student dashboard
            navigate('/student-dashboard');
          }
        }
      } catch (err) {
        // ignore - normal when not redirected from OAuth
        // console.error(err)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // TODO: Implement email authentication (Supabase email flow)
      alert('Email login coming soon!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Browser will redirect to Supabase OAuth flow
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Info */}
        <div className="login-info">
          <h1>Welcome to WorkMate</h1>
          <p>Find your perfect part-time job in Chennai</p>
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

        {/* Right Side - Form */}
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
              />
              💼 Employer
            </label>
          </div>

          {/* Google Login */}
          <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'Loading...' : '🔐 Sign in with Google'}
          </button>

          <div className="divider">OR</div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="signup-link">
            Don't have an account?{' '}
            <a href="#signup" onClick={() => navigate('/')}>
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
