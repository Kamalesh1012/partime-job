import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, servicesAPI, locationsAPI } from '../services/api';
import { useLocationStore, useAuthStore } from '../store';
import { PART_TIME_JOB_CATEGORIES, TECHNICIAN_SERVICE_CATEGORIES, WORK_SHIFTS, JOB_TYPE_FILTERS } from '../data/categoriesData';
import InteractiveMapView from '../components/InteractiveMapView';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedCity, selectedState, selectedArea, radiusKm, setLocation, setRadius, openLocationModal } = useLocationStore();

  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'services'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid' | 'map'
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [jobCounts, setJobCounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState(15);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [userCoords, setUserCoords] = useState(null);

  // Booking Modal State
  const [selectedTechToBook, setSelectedTechToBook] = useState(null);
  const [bookingProblem, setBookingProblem] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    fetchFeedData();
    fetchLocationCounts();
  }, [selectedCity, selectedState, selectedCategory, selectedShift, selectedJobType, selectedRadius]);

  const fetchLocationCounts = async () => {
    try {
      const res = await jobsAPI.getJobCountsByLocation();
      if (res.data?.states) {
        setJobCounts(res.data.states);
      }
    } catch (e) {
      console.error('Error loading job counts:', e);
    }
  };

  const fetchFeedData = async () => {
    try {
      setLoading(true);
      const params = {
        city: selectedCity,
        state: selectedState,
        category: selectedCategory || undefined,
        shift: selectedShift !== 'all' ? selectedShift : undefined,
        job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
      };

      const [jobsRes, techRes] = await Promise.all([
        jobsAPI.getJobs(params),
        servicesAPI.getTechnicians({ city: selectedCity, category: selectedCategory || undefined }),
      ]);

      setJobs(jobsRes.data?.data || []);
      setTechnicians(techRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching home feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Browser GPS Geolocation "Find Jobs Near Me"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords([latitude, longitude]);

        try {
          // 1. Reverse geocode to find nearest State/City
          const geoRes = await locationsAPI.reverseGeocode(latitude, longitude);
          if (geoRes.data?.nearest_city) {
            const nc = geoRes.data.nearest_city;
            setLocation(nc.district_name || nc.name, nc.state_name, nc.name);
          }

          // 2. Fetch nearby jobs with Haversine distance
          const nearbyRes = await jobsAPI.getNearbyJobs(latitude, longitude, selectedRadius);
          if (nearbyRes.data?.data) {
            setJobs(nearbyRes.data.data);
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Location access denied or unavailable. Please pick location manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchFeedData();
      return;
    }
    try {
      setLoading(true);
      const res = await jobsAPI.searchJobs(searchQuery, selectedCity);
      setJobs(res.data?.data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechToBook) return;

    try {
      await servicesAPI.bookService({
        customer_id: user?.id || 'guest-customer',
        technician_id: selectedTechToBook.id,
        category: selectedTechToBook.service_categories?.[0] || 'General Service',
        service_title: `${selectedTechToBook.full_name} - Doorstep Service`,
        problem_description: bookingProblem || 'General diagnosis & service required',
        city: selectedCity,
        state: selectedState,
        service_address: bookingAddress || `${selectedArea ? `${selectedArea}, ` : ''}${selectedCity}`,
        preferred_date: bookingDate || new Date().toISOString().split('T')[0],
        preferred_time_slot: bookingTimeSlot,
        estimated_cost: selectedTechToBook.visiting_charge || 199.0,
      });
      setBookingSubmitted(true);
      setTimeout(() => {
        setBookingSubmitted(false);
        setSelectedTechToBook(null);
        navigate('/activity');
      }, 1500);
    } catch (error) {
      console.error('Error booking technician:', error);
    }
  };

  const displayLocation = selectedArea ? `${selectedArea}, ${selectedCity}` : selectedCity;

  return (
    <div className="home-container">
      {/* Pan-India Location Selector Bar */}
      <header className="location-bar-header">
        <div className="location-info-chip" onClick={openLocationModal}>
          <span className="loc-icon">📍</span>
          <div className="loc-text">
            <span className="loc-sub">Selected Work Location</span>
            <strong className="loc-title">
              {displayLocation}, {selectedState}
              <span className="loc-badge">36 States/UTs</span>
            </strong>
          </div>
        </div>

        <div className="location-actions-group">
          <button
            className={`use-gps-btn ${gpsLoading ? 'loading' : ''}`}
            onClick={handleUseCurrentLocation}
            title="Use device GPS location"
          >
            {gpsLoading ? '📡 Locating...' : '🎯 Near Me'}
          </button>
          <button className="change-loc-quick-btn" onClick={openLocationModal}>
            Change Location ▾
          </button>
        </div>
      </header>

      {gpsError && (
        <div className="gps-error-banner">
          <span>⚠️ {gpsError}</span>
          <button onClick={() => setGpsError('')}>✕</button>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-compact-section">
        <div className="hero-badge-pill">
          ⚡ PAN-INDIA PART-TIME JOBS & DOORSTEP SERVICES
        </div>
        <h1 className="hero-headline">
          Find Flexible Work & Trusted Services <span className="text-highlight">Across India</span>
        </h1>
        <p className="hero-subtext">
          Instant part-time gigs, daily wage opportunities, banquet helpers, store staff, delivery shifts, and verified technicians in <strong>{displayLocation}</strong>.
        </p>

        {/* Search Bar */}
        <div className="hero-search-box">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Search part-time gigs or technicians in ${displayLocation}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="search-action-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* Main Tab Switcher */}
        <div className="main-tab-switcher">
          <button
            className={`tab-switch-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('jobs'); setSelectedCategory(''); }}
          >
            💼 Part-Time & Daily Gigs ({jobs.length})
          </button>
          <button
            className={`tab-switch-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => { setActiveTab('services'); setSelectedCategory(''); }}
          >
            🔧 Doorstep Technicians ({technicians.length})
          </button>
        </div>
      </section>

      {/* Category Pills Carousel */}
      <section className="category-carousel-section">
        <div className="category-scroll-container">
          <button
            className={`cat-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            <span className="cat-icon">⚡</span>
            <span className="cat-label">All Categories</span>
          </button>

          {activeTab === 'jobs'
            ? PART_TIME_JOB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.name}</span>
                </button>
              ))
            : TECHNICIAN_SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.name}</span>
                </button>
              ))}
        </div>
      </section>

      {/* Shift & Radius Filters */}
      {activeTab === 'jobs' && (
        <section className="feed-filters-bar">
          <div className="shift-chips">
            <span className="filter-group-label">Shift:</span>
            {WORK_SHIFTS.map((s) => (
              <button
                key={s.id}
                className={`filter-chip ${selectedShift === s.id ? 'active' : ''}`}
                onClick={() => setSelectedShift(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="radius-chips">
            <span className="filter-group-label">Radius:</span>
            {[5, 10, 15, 25, 50].map((r) => (
              <button
                key={r}
                className={`filter-chip radius-chip ${selectedRadius === r ? 'active' : ''}`}
                onClick={() => setSelectedRadius(r)}
              >
                📍 {r} km
              </button>
            ))}
          </div>

          <div className="job-type-chips">
            {JOB_TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                className={`filter-chip ${selectedJobType === t.id ? 'active' : ''}`}
                onClick={() => setSelectedJobType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Feed Content with Split View */}
      <main className="feed-main-section">
        {loading ? (
          <div className="feed-loading-spinner">
            <div className="spinner-ring"></div>
            <p>Finding verified opportunities in {displayLocation}...</p>
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="jobs-feed-list">
            <div className="feed-header-info">
              <div>
                <h3>Available Opportunities in {displayLocation}</h3>
                <span className="jobs-count-tag">{jobs.length} Active Listings</span>
              </div>
              <div className="view-mode-toggle-group">
                <button
                  className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  ⚡ Split View
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  📋 List
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Map
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <InteractiveMapView
                jobs={jobs}
                technicians={technicians}
                onSelectJob={(job) => navigate(`/jobs/${job.id}`)}
                onSelectTechnician={(t) => setSelectedTechToBook(t)}
                initialCoords={userCoords}
                height="500px"
              />
            ) : viewMode === 'split' ? (
              /* Desktop Split View: Left List + Right Interactive Map */
              <div className="split-view-container">
                <div className="split-list-column">
                  {jobs.length === 0 ? (
                    <div className="empty-feed-card">
                      <span className="empty-icon">📍</span>
                      <h4>No opportunities match in {displayLocation}</h4>
                      <p>Try switching location or clearing category filters.</p>
                      <button className="reset-filters-btn" onClick={() => { setSelectedCategory(''); setSelectedShift('all'); }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="job-opportunity-card split-card">
                        <div className="job-card-top">
                          <div className="job-badge-group">
                            <span className="job-type-badge">{job.job_type || 'Part-Time'}</span>
                            {job.is_urgent && <span className="urgent-badge">⚡ Urgent</span>}
                            {job.distance_display && <span className="dist-badge">📍 {job.distance_display}</span>}
                          </div>
                          <span className="job-shift-tag">{job.shift || 'Flexible Shift'}</span>
                        </div>

                        <h4 className="job-card-title">{job.title}</h4>
                        <p className="job-card-desc">{job.description?.slice(0, 100)}...</p>

                        <div className="job-meta-row">
                          <span className="job-loc">📍 {job.area_name || job.area || job.city_name || job.city}</span>
                          <span className="job-salary">
                            ₹{job.salary_min} - ₹{job.salary_max} <small>/{job.payment_frequency || 'day'}</small>
                          </span>
                        </div>

                        <div className="job-card-footer">
                          <span className="applicants-tag">👥 {job.applications_count || 0} applied</span>
                          <button
                            className="apply-job-btn"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            View & Apply →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="split-map-column">
                  <div className="sticky-map-wrapper">
                    <InteractiveMapView
                      jobs={jobs}
                      technicians={technicians}
                      onSelectJob={(job) => navigate(`/jobs/${job.id}`)}
                      onSelectTechnician={(t) => setSelectedTechToBook(t)}
                      initialCoords={userCoords}
                      height="580px"
                      showFilters={false}
                    />
                  </div>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-feed-card">
                <span className="empty-icon">📍</span>
                <h4>No opportunities match your current filters in {displayLocation}</h4>
                <p>Try switching to "All India" or clearing category filters.</p>
                <button className="reset-filters-btn" onClick={() => { setSelectedCategory(''); setSelectedShift('all'); setSelectedJobType('all'); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="jobs-cards-grid">
                {jobs.map((job) => (
                  <div key={job.id} className="job-opportunity-card">
                    <div className="job-card-top">
                      <div className="job-badge-group">
                        <span className="job-type-badge">{job.job_type || 'Part-Time'}</span>
                        {job.is_urgent && <span className="urgent-badge">⚡ Urgent</span>}
                        {job.is_weekend && <span className="weekend-badge">📅 Weekend</span>}
                        {job.distance_display && <span className="dist-badge">📍 {job.distance_display}</span>}
                      </div>
                      <span className="job-shift-tag">{job.shift || 'Flexible Shift'}</span>
                    </div>

                    <h4 className="job-card-title">{job.title}</h4>
                    <p className="job-card-desc">{job.description}</p>

                    <div className="job-meta-row">
                      <span className="job-loc">📍 {job.area_name || job.area || job.city_name || job.city}</span>
                      <span className="job-salary">
                        ₹{job.salary_min} - ₹{job.salary_max} <small>/{job.payment_frequency || 'day'}</small>
                      </span>
                    </div>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="job-skills-wrap">
                        {job.skills_required.map((sk, idx) => (
                          <span key={idx} className="skill-bubble">{sk}</span>
                        ))}
                      </div>
                    )}

                    <div className="job-card-footer">
                      <span className="applicants-tag">👥 {job.applications_count || 0} applied</span>
                      <button
                        className="apply-job-btn"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        View & Apply →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Technicians Feed */
          <div className="technicians-feed-list">
            <div className="feed-header-info">
              <div>
                <h3>Trusted Technicians in {displayLocation}</h3>
                <span className="jobs-count-tag">{technicians.length} Verified Pros</span>
              </div>
              <div className="view-mode-toggle-group">
                <button
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  ⚡ Grid View
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Live Map
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <InteractiveMapView
                technicians={technicians}
                jobs={jobs}
                onSelectTechnician={(t) => setSelectedTechToBook(t)}
                height="450px"
              />
            ) : technicians.length === 0 ? (
              <div className="empty-feed-card">
                <span className="empty-icon">🔧</span>
                <h4>No technicians found in {displayLocation} for this category</h4>
                <p>Try searching across nearby districts or view all services.</p>
              </div>
            ) : (
              <div className="technicians-cards-grid">
                {technicians.map((tech) => (
                  <div key={tech.id} className="technician-pro-card">
                    <div className="tech-card-header">
                      <img src={tech.avatar_url} alt={tech.full_name} className="tech-avatar-img" />
                      <div className="tech-header-meta">
                        <h4 className="tech-name">{tech.full_name}</h4>
                        <span className="tech-badge">{tech.badge_type || 'Verified Pro ✓'}</span>
                        <div className="tech-rating-row">
                          <span className="star-icon">⭐ {tech.rating}</span>
                          <span className="reviews-count">({tech.total_reviews} reviews)</span>
                          <span className="jobs-done">• {tech.completed_jobs} completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="tech-skills-row">
                      {tech.skills?.map((sk, idx) => (
                        <span key={idx} className="tech-skill-pill">{sk}</span>
                      ))}
                    </div>

                    <div className="tech-pricing-row">
                      <div className="price-item">
                        <span className="p-label">Visiting Charge</span>
                        <strong className="p-val">₹{tech.visiting_charge}</strong>
                      </div>
                      <div className="price-item">
                        <span className="p-label">Service Rate</span>
                        <strong className="p-val">₹{tech.hourly_rate}/hr</strong>
                      </div>
                    </div>

                    <div className="tech-location-row">
                      <span>📍 Serving {tech.area ? `${tech.area}, ` : ''}{tech.city} (within {tech.service_radius_km || 15} km)</span>
                    </div>

                    <button
                      className="book-technician-btn"
                      onClick={() => setSelectedTechToBook(tech)}
                    >
                      ⚡ Book Technician Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Location Job Count Showcase */}
      {jobCounts.length > 0 && (
        <section className="location-distribution-section">
          <div className="loc-dist-header">
            <h3>🗺️ Live Job Opportunities Across India</h3>
            <span className="loc-dist-tag">36 States & UTs Active</span>
          </div>
          <div className="loc-dist-grid">
            {jobCounts.slice(0, 8).map((st) => (
              <div
                key={st.state_id}
                className="loc-dist-card"
                onClick={() => {
                  setLocation(st.state_name, st.state_name);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                <div className="st-info">
                  <strong>{st.state_name}</strong>
                  <small>{st.code} • {st.type}</small>
                </div>
                <span className="st-count-chip">{st.job_count} Jobs</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEWAA Slogan Banner */}
      <section className="sewaa-slogan-banner">
        <div className="slogan-badge">SEWAA</div>
        <h2 className="slogan-title">Your Work. Your Service. Your SEWAA.</h2>
        <p className="slogan-sub">
          Find flexible work and trusted local professionals, wherever you are in India.
        </p>
        <div className="slogan-buttons">
          <button className="slogan-btn-primary" onClick={() => navigate('/events')}>
            Explore Events & Work
          </button>
          <button className="slogan-btn-secondary" onClick={() => navigate('/services')}>
            Find Nearby Technicians
          </button>
        </div>
      </section>

      {/* Technician Booking Modal */}
      {selectedTechToBook && (
        <div className="booking-modal-overlay" onClick={() => setSelectedTechToBook(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <h3>Book {selectedTechToBook.full_name}</h3>
                <span className="booking-sub">{selectedTechToBook.badge_type} • {displayLocation}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedTechToBook(null)}>✕</button>
            </div>

            {bookingSubmitted ? (
              <div className="booking-success-view">
                <span className="success-icon">✅</span>
                <h4>Booking Confirmed!</h4>
                <p>Technician has been notified and will arrive at your preferred time slot.</p>
              </div>
            ) : (
              <form className="booking-form" onSubmit={handleBookTechnician}>
                <label>
                  <span>Problem Description / Service Details:</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AC not cooling / Switchboard sparking / Tap leaking"
                    value={bookingProblem}
                    onChange={(e) => setBookingProblem(e.target.value)}
                  />
                </label>

                <div className="booking-form-row">
                  <label>
                    <span>Preferred Date:</span>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Time Slot:</span>
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                    >
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                      <option value="Evening (3 PM - 7 PM)">Evening (3 PM - 7 PM)</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Doorstep Service Address:</span>
                  <input
                    type="text"
                    required
                    placeholder="Flat/House No., Street, Landmark"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                  />
                </label>

                <div className="booking-summary-box">
                  <div className="summary-line">
                    <span>Visiting / Inspection Fee:</span>
                    <strong>₹{selectedTechToBook.visiting_charge || 199}</strong>
                  </div>
                  <small>Pay directly to technician after service completion.</small>
                </div>

                <button type="submit" className="confirm-booking-btn">
                  Confirm Doorstep Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
