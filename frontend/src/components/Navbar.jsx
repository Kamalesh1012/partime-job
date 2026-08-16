import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useLocationStore } from '../store';
import './Navbar.css';

const Navbar = ({ isLoggedIn, setIsLoggedIn, userType, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const { selectedCity, selectedArea } = useLocationStore();

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  const displayLocation = selectedArea ? `${selectedArea}, ${selectedCity}` : (selectedCity || 'All India');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Side: SEWAA Logo & Title */}
        <div className="nav-left-group">
          <Link to="/" className="navbar-logo">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="navbar-sewaa-logo" />
            <div className="logo-text-block">
              <div className="logo-title-row">
                <span className="logo-text">SEWAA</span>
              </div>
              <span className="logo-subtext">Part-Time Jobs & Local Services</span>
            </div>
          </Link>

          {/* Location Selector Pill -> Navigates to /location */}
          <button
            className="nav-location-pill"
            onClick={() => navigate('/location')}
            title="Change Location"
          >
            <span className="location-pin-icon">📍</span>
            <span className="location-city-name">{displayLocation}</span>
            <span className="location-arrow">▾</span>
          </button>
        </div>

        {/* Right Side: Links & Auth Controls */}
        <div className="nav-right-group">
          {/* Desktop Navigation Links */}
          <div className="desktop-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/jobs" className="nav-link">Jobs</Link>
            <Link to="/services" className="nav-link">Services</Link>
            <Link to="/events" className="nav-link">Events</Link>
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
          <button className="drawer-location-btn" onClick={() => { navigate('/location'); setIsMenuOpen(false); }}>
            📍 Location: <strong>{displayLocation}</strong> (Tap to switch)
          </button>
          <Link to="/" className="drawer-link" onClick={() => setIsMenuOpen(false)}>🏠 Home</Link>
          <Link to="/jobs" className="drawer-link" onClick={() => setIsMenuOpen(false)}>💼 Part-Time Jobs</Link>
          <Link to="/services" className="drawer-link" onClick={() => setIsMenuOpen(false)}>🔧 Technicians & Services</Link>
          <Link to="/events" className="drawer-link" onClick={() => setIsMenuOpen(false)}>🎪 Events & Gigs</Link>
          <Link to="/activity" className="drawer-link" onClick={() => setIsMenuOpen(false)}>⚡ Activity & Bookings</Link>
          <Link to="/profile" className="drawer-link" onClick={() => setIsMenuOpen(false)}>👤 Profile & Settings</Link>
          <Link to="/contact" className="drawer-link" onClick={() => setIsMenuOpen(false)}>📞 Contact SEWAA</Link>
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
