import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSafetyStore, useAuthStore } from '../store';
import './BottomNav.css';

export default function BottomNav() {
  const { openSOSModal } = useSafetyStore();
  const { userType } = useAuthStore();
  const location = useLocation();

  const getDashboardPath = () => {
    if (userType === 'employer') return '/employer-dashboard';
    if (userType === 'admin') return '/admin-dashboard';
    return '/activity';
  };

  return (
    <nav className="bottom-nav-bar" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        className={({ isActive }) => `bottom-nav-item ${isActive && location.pathname === '/' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/jobs"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">💼</span>
        <span className="bottom-nav-label">Jobs</span>
      </NavLink>

      {/* Floating SOS Trigger Button in Center */}
      <button
        className="bottom-nav-sos-btn"
        onClick={() => openSOSModal()}
        aria-label="Emergency SOS"
        title="Emergency Safety & SOS"
      >
        <span className="sos-btn-inner">
          <span className="sos-icon">🚨</span>
          <span className="sos-text">SOS</span>
        </span>
      </button>

      <NavLink
        to="/services"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">🔧</span>
        <span className="bottom-nav-label">Services</span>
      </NavLink>

      <NavLink
        to="/activity"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">⚡</span>
        <span className="bottom-nav-label">Activity</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">👤</span>
        <span className="bottom-nav-label">Profile</span>
      </NavLink>
    </nav>
  );
}
