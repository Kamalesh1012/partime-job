import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store';
import './Navbar.css';

const Navbar = ({ isLoggedIn, setIsLoggedIn, userType, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">💼</span>
          <span className="logo-text">WorkMate</span>
        </Link>

        {/* Menu Toggle */}
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigation Links */}
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {!isLoggedIn ? (
            <>
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                Get Started
              </button>
            </>
          ) : (
            <>
              {userType === 'student' && (
                <>
                  <Link to="/" className="nav-link">
                    Home
                  </Link>
                  <Link to="/student-dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="nav-link">
                    Profile
                  </Link>
                </>
              )}
              {userType === 'employer' && (
                <>
                  <Link to="/" className="nav-link">
                    Home
                  </Link>
                  <Link to="/employer-dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="nav-link">
                    Company
                  </Link>
                </>
              )}
              {userType === 'admin' && (
                <>
                  <Link to="/admin-dashboard" className="nav-link">
                    Admin
                  </Link>
                </>
              )}
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
