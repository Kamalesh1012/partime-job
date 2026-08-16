import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();

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
        to="/events"
        className={({ isActive }) => `bottom-nav-item ${isActive || location.pathname === '/jobs' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">🎪</span>
        <span className="bottom-nav-label">Events</span>
      </NavLink>

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
