import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useLocationStore, useSafetyStore } from '../store';
import './Navbar.css';

const Navbar = ({ isLoggedIn, setIsLoggedIn, userType, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const { selectedCity, openLocationModal } = useLocationStore();
  const { openSOSModal } = useSafetyStore();

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo & Platform Tag */}
        <div className="nav-left-group">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">💼</span>
            <div className="logo-text-block">
              <span className="logo-text">WorkMate <span className="india-badge">🇮🇳 India</span></span>
              <span className="logo-subtext">Part-Time Jobs & Local Services</span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          <button className="nav-location-pill" onClick={openLocationModal} title="Change Location">
            <span className="location-pin-icon">📍</span>
            <span className="location-city-name">{selectedCity || 'All India'}</span>
            <span className="location-arrow">▾</span>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="nav-right-group">
          {/* Top SOS Safety Trigger */}
          <button className="nav-sos-quick-btn" onClick={() => openSOSModal()} title="Emergency Safety & SOS">
            <span className="sos-dot"></span>
            <span>SOS 24x7</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="desktop-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/jobs" className="nav-link">Jobs</Link>
            <Link to="/services" className="nav-link">Services</Link>
            <Link to="/activity" className="nav-link">Activity</Link>
          </div>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Auth State Action */}
          {!isLoggedIn ? (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-login-outline">Login</Link>
              <button className="btn btn-primary-cta" onClick={() => navigate('/register')}>Join Free</button>
            </div>
          ) : (
            <div className="user-profile-menu">
              <Link to="/profile" className="profile-chip-btn">
                <span className="user-avatar-icon">👤</span>
                <span className="user-role-tag">{userType || 'User'}</span>
              </Link>
              <button className="btn-logout-icon" onClick={handleLogout} title="Logout">
                🚪
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="mobile-drawer-menu">
          <button className="drawer-location-btn" onClick={() => { openLocationModal(); setIsMenuOpen(false); }}>
            📍 Location: <strong>{selectedCity}</strong> (Tap to switch)
          </button>
          <Link to="/" className="drawer-link" onClick={() => setIsMenuOpen(false)}>🏠 Home</Link>
          <Link to="/jobs" className="drawer-link" onClick={() => setIsMenuOpen(false)}>💼 Part-Time Jobs</Link>
          <Link to="/services" className="drawer-link" onClick={() => setIsMenuOpen(false)}>🔧 Technicians & Services</Link>
          <Link to="/activity" className="drawer-link" onClick={() => setIsMenuOpen(false)}>⚡ Activity & Bookings</Link>
          <Link to="/profile" className="drawer-link" onClick={() => setIsMenuOpen(false)}>👤 Profile & Safety Settings</Link>
          {isLoggedIn && (
            <button className="drawer-logout-btn" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
              🚪 Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
