import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, servicesAPI, locationsAPI } from '../services/api';
import { useLocationStore } from '../store';
import { PART_TIME_JOB_CATEGORIES, TECHNICIAN_SERVICE_CATEGORIES } from '../data/categoriesData';
import './HomePage.css';

const QUICK_CATEGORIES = [
  { id: 'Delivery', icon: '🚚', label: 'Delivery', path: '/jobs?cat=Delivery' },
  { id: 'Daily wage', icon: '⚡', label: 'Daily Wage', path: '/jobs?type=Daily%20wage' },
  { id: 'Store Assistant', icon: '🏪', label: 'Retail & Store', path: '/jobs?cat=Store%20Assistant' },
  { id: 'Event Staff', icon: '🎉', label: 'Event Work', path: '/jobs?cat=Event%20Staff' },
  { id: 'Electrician', icon: '⚡', label: 'Electrician', path: '/services?cat=Electrician' },
  { id: 'Plumber', icon: '🔧', label: 'Plumbing', path: '/services?cat=Plumber' },
  { id: 'AC Repair', icon: '❄️', label: 'AC Repair', path: '/services?cat=AC%20Repair' },
  { id: 'Cleaning', icon: '🧹', label: 'Cleaning', path: '/jobs?cat=Cleaning' },
  { id: 'Security', icon: '🔒', label: 'Security', path: '/jobs?cat=Security' },
  { id: 'Data Entry', icon: '💻', label: 'Data Entry', path: '/jobs?cat=Data%20Entry' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectedCity,
    selectedState,
    selectedArea,
    state_id,
    district_id,
    latitude,
    longitude,
    radiusKm,
    setLocation,
  } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyJobs, setNearbyJobs] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Service Quick Booking Modal
  const [selectedTechToBook, setSelectedTechToBook] = useState(null);
  const [bookingProblem, setBookingProblem] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const displayLocation = selectedArea
    ? `${selectedArea}, ${selectedCity}`
    : `${selectedCity}, ${selectedState}`;

  useEffect(() => {
    fetchHomeData();
  }, [selectedCity, selectedState, state_id, district_id]);

  const fetchHomeData = async () => {
    // 1. Fetch Nearby Jobs
    try {
      setLoadingJobs(true);
      let res;
      if (latitude && longitude) {
        res = await jobsAPI.getNearbyJobs(latitude, longitude, radiusKm || 20);
      } else {
        res = await jobsAPI.getJobs({ city: selectedCity, state: selectedState, limit: 6 });
      }
      setNearbyJobs(res.data?.data?.slice(0, 6) || []);
    } catch (e) {
      console.error('Error loading home jobs:', e);
    } finally {
      setLoadingJobs(false);
    }

    // 2. Fetch Popular Technicians
    try {
      setLoadingServices(true);
      const sRes = await servicesAPI.getTechnicians({ city: selectedCity });
      setPopularServices(sRes.data?.data?.slice(0, 4) || []);
    } catch (e) {
      console.error('Error loading technicians:', e);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/jobs');
      return;
    }
    navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsDetecting(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const geoRes = await locationsAPI.reverseGeocode(lat, lng);
          if (geoRes.data?.nearest_city) {
            const nc = geoRes.data.nearest_city;
            setLocation({
              city: nc.district_name || nc.name,
              state: nc.state_name,
              area: nc.name,
              state_id: nc.state_id,
              district_id: nc.district_id,
              city_id: nc.id,
              latitude: nc.latitude || lat,
              longitude: nc.longitude || lng,
            });
            setGpsDetecting(false);
            return;
          }
        } catch (e) {
          console.error('GPS reverse geocode error:', e);
        }

        setLocation({
          city: 'Chennai',
          state: 'Tamil Nadu',
          area: 'Sholinganallur',
          state_id: 'ST-TN',
          district_id: 'DIST-TN-CHENN',
          latitude: lat,
          longitude: lng,
        });
        setGpsDetecting(false);
      },
      () => {
        setGpsDetecting(false);
        setGpsError('GPS permission was denied. Tap "Change Location" to choose manually.');
      },
      { timeout: 5000 }
    );
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedTechToBook) return;

    try {
      await servicesAPI.bookService({
        customer_id: 'verified-user',
        technician_id: selectedTechToBook.id,
        category: selectedTechToBook.service_categories?.[0] || 'General Repair',
        service_title: `${selectedTechToBook.full_name} Doorstep Service`,
        problem_description: bookingProblem || 'Doorstep inspection & maintenance',
        city: selectedCity,
        state: selectedState,
        service_address: bookingAddress || `${displayLocation}, Street Address`,
        preferred_date: bookingDate || new Date().toISOString().split('T')[0],
        preferred_time_slot: bookingTimeSlot,
        estimated_cost: selectedTechToBook.visiting_charge || 199.0,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTechToBook(null);
        navigate('/activity');
      }, 1500);
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  return (
    <div className="sewaa-home-page">
      {/* 1. Mobile Compact Location Bar */}
      <section className="home-location-strip">
        <div className="loc-indicator-pill" onClick={() => navigate('/location')}>
          <span className="loc-pin-icon">📍</span>
          <div className="loc-name-group">
            <span className="loc-sub-tag">Work & Services in</span>
            <strong className="loc-main-name">{displayLocation}</strong>
          </div>
          <span className="loc-arrow-btn">Change ▾</span>
        </div>

        <button
          className={`home-gps-btn ${gpsDetecting ? 'pulsing' : ''}`}
          onClick={handleUseGPS}
          title="Use GPS for nearby jobs"
        >
          {gpsDetecting ? '📡 Locating...' : '🎯 Near Me'}
        </button>
      </section>

      {gpsError && (
        <div className="home-gps-warning">
          <span>⚠️ {gpsError}</span>
          <button onClick={() => setGpsError('')}>✕</button>
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="home-hero-clean">
        <div className="hero-brand-pill">
          ⚡ INDIA'S PART-TIME & LOCAL SERVICES PLATFORM
        </div>
        <h1 className="hero-main-title">
          Your Work. Your Service. <span className="title-gradient">Your SEWAA.</span>
        </h1>
        <p className="hero-subtitle">
          Find flexible part-time shifts, daily gigs, event work, and doorstep technicians near you in <strong>{selectedCity}</strong>.
        </p>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="home-search-bar">
          <span className="search-lens-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search for jobs or services in ${selectedCity}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-btn">
            Search
          </button>
        </form>
      </section>

      {/* 3. Popular Categories (Horizontal Scrolling) */}
      <section className="home-categories-section">
        <div className="section-title-row">
          <h2>Popular Categories</h2>
          <span className="section-sub-hint">Instant part-time & local work</span>
        </div>

        <div className="categories-horizontal-scroll">
          {QUICK_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="cat-card-item"
              onClick={() => navigate(cat.path)}
            >
              <span className="cat-icon-badge">{cat.icon}</span>
              <span className="cat-label-text">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Nearby Opportunities Feed (No Map) */}
      <section className="home-feed-section">
        <div className="section-title-row">
          <div>
            <h2>Nearby Opportunities</h2>
            <span className="section-sub-hint">Verified flexible shifts in {displayLocation}</span>
          </div>
          <button className="view-all-link-btn" onClick={() => navigate('/jobs')}>
            View All Jobs ({nearbyJobs.length}) →
          </button>
        </div>

        {loadingJobs ? (
          <div className="home-skeleton-feed">
            {[1, 2, 3].map((i) => (
              <div key={i} className="feed-skeleton-card" />
            ))}
          </div>
        ) : nearbyJobs.length === 0 ? (
          <div className="home-empty-notice">
            <span>📍</span>
            <h4>No jobs found in {displayLocation}</h4>
            <p>Try switching to another nearby district or viewing all India jobs.</p>
            <button className="change-loc-cta" onClick={() => navigate('/location')}>
              📍 Change Location
            </button>
          </div>
        ) : (
          <div className="nearby-jobs-grid">
            {nearbyJobs.map((job) => (
              <div key={job.id} className="home-job-card">
                <div className="card-top-header">
                  <div className="card-badges-row">
                    <span className="job-badge-type">{job.job_type || 'Part-Time'}</span>
                    {job.is_urgent && <span className="job-badge-urgent">⚡ Urgent</span>}
                    {job.distance_display && (
                      <span className="job-badge-dist">📍 {job.distance_display}</span>
                    )}
                  </div>
                  <span className="card-shift-tag">{job.shift || 'Flexible'}</span>
                </div>

                <h3 className="job-headline">{job.title}</h3>
                <span className="job-company">
                  🏢 {job.employer_name || job.company_name || 'SEWAA Verified Employer'}
                </span>

                <div className="job-specs-box">
                  <span className="specs-loc">
                    📍 {job.area_name || job.city_name || job.city || selectedCity}
                  </span>
                  <span className="specs-pay">
                    ₹{job.salary_min} - ₹{job.salary_max} <small>/{job.payment_frequency || 'day'}</small>
                  </span>
                </div>

                <div className="card-bottom-row">
                  <span className="applicants-note">
                    👥 {job.applications_count || 0} applied
                  </span>
                  <button
                    className="view-details-cta"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    View Job →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Popular Doorstep Services Feed */}
      <section className="home-feed-section">
        <div className="section-title-row">
          <div>
            <h2>Popular Doorstep Services</h2>
            <span className="section-sub-hint">Verified home technicians & repair pros</span>
          </div>
          <button className="view-all-link-btn" onClick={() => navigate('/services')}>
            All Services →
          </button>
        </div>

        {loadingServices ? (
          <div className="home-skeleton-feed">
            {[1, 2].map((i) => (
              <div key={i} className="feed-skeleton-card" />
            ))}
          </div>
        ) : popularServices.length === 0 ? (
          <div className="home-empty-notice">
            <span>🔧</span>
            <h4>No technicians available in {displayLocation} yet</h4>
            <p>We are onboarding local service providers in this area daily.</p>
            <button className="change-loc-cta" onClick={() => navigate('/location')}>
              📍 Change Location
            </button>
          </div>
        ) : (
          <div className="popular-services-grid">
            {popularServices.map((tech) => (
              <div key={tech.id} className="home-service-card">
                <div className="service-card-header">
                  <div className="tech-avatar-circle">🔧</div>
                  <div className="tech-info">
                    <h4>{tech.full_name}</h4>
                    <span className="tech-rating">⭐ {tech.rating || 4.9} (Verified Pro)</span>
                  </div>
                </div>

                <div className="service-skills-row">
                  {tech.service_categories?.map((cat, idx) => (
                    <span key={idx} className="tech-cat-chip">{cat}</span>
                  ))}
                </div>

                <div className="service-card-bottom">
                  <span className="visiting-fee">
                    ₹{tech.visiting_charge || 199} <small>visit fee</small>
                  </span>
                  <button
                    className="book-tech-cta"
                    onClick={() => setSelectedTechToBook(tech)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Why SEWAA Trust & Safety Section */}
      <section className="why-sewaa-section">
        <h2>Why Millions Trust SEWAA</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feat-icon">⚡</span>
            <h4>Daily & Weekly Payouts</h4>
            <p>Work shifts and get paid on time with zero hidden deductions.</p>
          </div>
          <div className="feature-item">
            <span className="feat-icon">🛡️</span>
            <h4>Verified Employers & Pros</h4>
            <p>Every job and technician is verified with government ID checks.</p>
          </div>
          <div className="feature-item">
            <span className="feat-icon">📍</span>
            <h4>Hyperlocal Opportunities</h4>
            <p>Find gigs within 5–15 km of your doorstep to save travel time.</p>
          </div>
        </div>
      </section>

      {/* 7. Employer Quick Action CTA */}
      <section className="employer-cta-card">
        <div className="emp-cta-content">
          <span className="emp-cta-tag">FOR BUSINESSES & RESIDENTS</span>
          <h3>Looking to Hire Workers or Technicians?</h3>
          <p>Post part-time gigs, delivery shifts, or event helper requirements in 2 minutes.</p>
          <button
            className="emp-post-btn"
            onClick={() => navigate('/employer-dashboard')}
          >
            ➕ Post a Job Opportunity
          </button>
        </div>
      </section>

      {/* Service Booking Modal */}
      {selectedTechToBook && (
        <div className="modal-overlay" onClick={() => setSelectedTechToBook(null)}>
          <div className="modal-content booking-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book Doorstep Service</h2>
              <button className="close-btn" onClick={() => setSelectedTechToBook(null)}>✕</button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-box">
                <span className="success-icon">✅</span>
                <h3>Service Booked Successfully!</h3>
                <p>{selectedTechToBook.full_name} will contact you for confirmation.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="booking-sheet-form">
                <div className="booking-summary-pill">
                  <strong>🔧 {selectedTechToBook.full_name}</strong>
                  <span>₹{selectedTechToBook.visiting_charge || 199} visiting charge</span>
                </div>

                <label>
                  <span>Describe the Issue / Problem *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AC cooling problem, power switch sparking"
                    value={bookingProblem}
                    onChange={(e) => setBookingProblem(e.target.value)}
                  />
                </label>

                <div className="two-inputs-row">
                  <label>
                    <span>Preferred Date *</span>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Time Slot</span>
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                    >
                      <option>Morning (9 AM - 12 PM)</option>
                      <option>Afternoon (1 PM - 4 PM)</option>
                      <option>Evening (5 PM - 8 PM)</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Doorstep Service Address *</span>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No, Street, Area"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                  />
                </label>

                <button type="submit" className="confirm-booking-btn">
                  Confirm Booking (Pay ₹{selectedTechToBook.visiting_charge || 199} on Arrival)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
