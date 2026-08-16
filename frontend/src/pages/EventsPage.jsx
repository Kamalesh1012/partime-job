import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useLocationStore } from '../store';
import './EventsPage.css';

const EVENT_SPECIALTIES = [
  { id: 'all', label: 'All Event Gigs', icon: '🎪' },
  { id: 'catering', label: 'Catering & Banquets', icon: '🍽️' },
  { id: 'wedding', label: 'Wedding Helpers', icon: '💐' },
  { id: 'exhibition', label: 'Exhibition & Stalls', icon: '🏛️' },
  { id: 'security', label: 'Bouncers & Event Security', icon: '🛡️' },
  { id: 'promotional', label: 'Promotional & Brand Staff', icon: '📢' },
  { id: 'festival', label: 'Festival & Concert Crew', icon: '🎉' },
  { id: 'oneday', label: '1-Day Weekend Gigs', icon: '⚡' },
];

export default function EventsPage() {
  const navigate = useNavigate();
  const { selectedCity, selectedState, selectedArea, openLocationModal } = useLocationStore();

  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const displayLocation = selectedArea ? `${selectedArea}, ${selectedCity}` : selectedCity;

  useEffect(() => {
    fetchEvents();
  }, [selectedCity, selectedSpecialty]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.getJobs({
        city: selectedCity,
        category: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
      });

      // Augment or filter with event-focused titles
      const allGigs = res.data?.data || [];
      setEventsList(allGigs);
    } catch (e) {
      console.error('Error fetching event gigs:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="events-page-container">
      {/* Header Banner */}
      <div className="events-hero-banner">
        <div className="events-badge">🎪 SEWAA EVENTS & TEMPORARY GIGS</div>
        <h1 className="events-title">Local Events, Functions & Temporary Work</h1>
        <p className="events-subtitle">
          Find one-day event staff, wedding helpers, banquet catering, exhibitions, security, and weekend gigs across {displayLocation}, {selectedState}.
        </p>

        {/* Location chip */}
        <button className="events-loc-chip" onClick={openLocationModal}>
          📍 Location: <strong>{displayLocation}, {selectedState}</strong> (Tap to change)
        </button>
      </div>

      {/* Specialty Filter Chips */}
      <div className="specialty-scroll-bar">
        {EVENT_SPECIALTIES.map((spec) => (
          <button
            key={spec.id}
            className={`specialty-chip ${selectedSpecialty === spec.id ? 'active' : ''}`}
            onClick={() => setSelectedSpecialty(spec.id)}
          >
            <span className="spec-icon">{spec.icon}</span>
            <span className="spec-label">{spec.label}</span>
          </button>
        ))}
      </div>

      {/* Events Feed Grid */}
      <div className="events-feed-wrap">
        <div className="events-feed-header">
          <h2>Active Event Opportunities ({eventsList.length})</h2>
          <span className="instant-pay-badge">⚡ Same-Day / Next-Day Payouts Available</span>
        </div>

        {loading ? (
          <div className="events-loading">
            <div className="spinner-ring"></div>
            <p>Loading active event shifts in {displayLocation}...</p>
          </div>
        ) : eventsList.length === 0 ? (
          <div className="no-events-card">
            <span className="no-event-icon">🎪</span>
            <h3>No event gigs posted yet in {displayLocation}</h3>
            <p>Check back shortly or explore other nearby cities across India.</p>
            <button className="change-city-btn" onClick={openLocationModal}>
              Switch Location
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {eventsList.map((gig) => (
              <div key={gig.id} className="event-gig-card">
                <div className="event-card-top">
                  <span className="event-tag">{gig.job_type || 'Event Gig'}</span>
                  <span className="event-shift">⏰ {gig.shift || 'Evening Function'}</span>
                </div>

                <h3 className="event-gig-title">{gig.title}</h3>
                <p className="event-gig-desc">{gig.description}</p>

                <div className="event-meta-box">
                  <div className="event-meta-item">
                    <span className="meta-lbl">Venue Location</span>
                    <strong className="meta-val">📍 {gig.area ? `${gig.area}, ${gig.city}` : gig.city}</strong>
                  </div>
                  <div className="event-meta-item">
                    <span className="meta-lbl">Event Daily Pay</span>
                    <strong className="meta-val pay">₹{gig.salary_max || gig.salary_min || 800} / shift</strong>
                  </div>
                </div>

                <div className="event-card-actions">
                  <span className="event-spots">👥 {gig.applications_count || 3} applicants</span>
                  <button
                    className="apply-event-btn"
                    onClick={() => navigate(`/jobs/${gig.id}`)}
                  >
                    Apply for Shift →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
