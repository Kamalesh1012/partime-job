import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import './LoginPage.css';
import { signInWithGoogle, handlePostSignIn, signInWithEmail } from '../services/auth';

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

  const finishLogin = (result) => {
    if (!result?.auth?.access_token) {
      throw new Error('Login succeeded with Supabase, but the backend did not return an application token.');
    }

    const appToken = result.auth.access_token;
    setToken(appToken);

    if (result.me) {
      setUser(result.me);
      const role = result.me.role || selectedRole || 'student';
      setUserType(role);
      if (role === 'employer') navigate('/employer-dashboard');
      else if (role === 'admin') navigate('/admin-dashboard');
      else navigate('/student-dashboard');
    } else {
      // Backend did not return /me. Keep the selected role for the frontend
      // and send the user to the matching dashboard.
      setUserType(selectedRole || 'student');
      navigate(selectedRole === 'employer' ? '/employer-dashboard' : '/student-dashboard');
    }
  };

  useEffect(() => {
    // Handle a return from Google OAuth.
    (async () => {
      setLoading(true);
      try {
        const result = await handlePostSignIn();
        if (result?.auth?.access_token) finishLogin(result);
      } catch (err) {
        // No session is normal when the page was opened directly.
        if (err?.message) setError(err.message);
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
      const result = await signInWithEmail(email.trim(), password);
      finishLogin(result);
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
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

        <div className="login-form-container">
          <div className="role-selector">
            <label>
              <input type="radio" name="role" value="student" checked={selectedRole === 'student'} onChange={(e) => setSelectedRole(e.target.value)} />
              👨‍🎓 Student / Job Seeker
            </label>
            <label>
              <input type="radio" name="role" value="employer" checked={selectedRole === 'employer'} onChange={(e) => setSelectedRole(e.target.value)} />
              💼 Employer
            </label>
          </div>

          <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'Loading...' : '🔐 Sign in with Google'}
          </button>

          <div className="divider">OR</div>

          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="signup-link">
            Don't have an account?{' '}
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
