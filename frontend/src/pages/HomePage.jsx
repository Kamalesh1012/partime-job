import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, servicesAPI } from '../services/api';
import { useLocationStore, useSafetyStore, useAuthStore } from '../store';
import { PART_TIME_JOB_CATEGORIES, TECHNICIAN_SERVICE_CATEGORIES, WORK_SHIFTS, JOB_TYPE_FILTERS } from '../data/categoriesData';
import { POPULAR_INDIAN_CITIES } from '../data/indiaLocations';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedCity, selectedState, radiusKm, openLocationModal } = useLocationStore();
  const { openSOSModal } = useSafetyStore();

  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'services'
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [selectedTechToBook, setSelectedTechToBook] = useState(null);
  const [bookingProblem, setBookingProblem] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    fetchFeedData();
  }, [selectedCity, selectedState, selectedCategory, selectedShift, selectedJobType]);

  const fetchFeedData = async () => {
    try {
      setLoading(true);
      const params = {
        city: selectedCity,
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
        service_address: bookingAddress || `${selectedCity}, Landmark area`,
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
      console.error('Booking failed:', error);
    }
  };

  return (
    <div className="home-container">
      {/* Top Location & Safety Header */}
      <section className="location-bar-header">
        <div className="location-info-chip" onClick={openLocationModal}>
          <span className="loc-icon">📍</span>
          <div className="loc-text">
            <span className="loc-sub">Showing Work in</span>
            <strong className="loc-title">{selectedCity}, {selectedState} ▾</strong>
          </div>
          <span className="loc-badge">Within {radiusKm} km</span>
        </div>

        <button className="sos-quick-pill" onClick={() => openSOSModal()} title="Safety & SOS">
          <span className="sos-blip"></span>
          <span>SOS Help</span>
        </button>
      </section>

      {/* Hero Headline */}
      <section className="hero-compact-section">
        <h1 className="hero-headline">
          Find Part-Time Work. <br />
          <span className="text-highlight">Find Trusted Technicians.</span>
        </h1>
        <p className="hero-subtext">
          Pan-India on-demand jobs, daily wage shifts, and certified doorstep appliance repair across all states.
        </p>

        {/* Search Box */}
        <div className="hero-search-wrapper">
          <span className="search-symbol">🔍</span>
          <input
            type="text"
            placeholder={`Search ${activeTab === 'jobs' ? 'delivery, packing, retail, daily wage...' : 'electrician, AC repair, plumber, mechanic...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-action-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      {/* Dual Mode Switcher */}
      <div className="dual-mode-switcher">
        <button
          className={`mode-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('jobs'); setSelectedCategory(''); }}
        >
          <span className="tab-icon">💼</span>
          <div className="tab-text">
            <strong>Part-Time & Gig Jobs</strong>
            <span>Daily wage, weekend, delivery</span>
          </div>
        </button>
        <button
          className={`mode-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => { setActiveTab('services'); setSelectedCategory(''); }}
        >
          <span className="tab-icon">🔧</span>
          <div className="tab-text">
            <strong>Technicians & Repair</strong>
            <span>Electrician, AC, plumber, mechanic</span>
          </div>
        </button>
      </div>

      {/* Category Icons Carousel */}
      <section className="categories-section">
        <div className="section-header-compact">
          <h3>{activeTab === 'jobs' ? 'Popular Job Categories' : 'Home & Repair Services'}</h3>
          <span className="section-count">{activeTab === 'jobs' ? PART_TIME_JOB_CATEGORIES.length : TECHNICIAN_SERVICE_CATEGORIES.length} Categories</span>
        </div>

        <div className="categories-scroll-grid">
          {(activeTab === 'jobs' ? PART_TIME_JOB_CATEGORIES : TECHNICIAN_SERVICE_CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill-card ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-title">{cat.title}</span>
              <span className="cat-price">{cat.avg_pay || cat.min_price}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Shift & Job Type Filter Chips (When in Jobs mode) */}
      {activeTab === 'jobs' && (
        <section className="filter-chips-row">
          <div className="shift-chips">
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

      {/* Main Feed Content */}
      <main className="feed-main-section">
        {loading ? (
          <div className="feed-loading-spinner">
            <div className="spinner-ring"></div>
            <p>Finding verified opportunities in {selectedCity}...</p>
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="jobs-feed-list">
            <div className="feed-header-info">
              <h3>Available Jobs in {selectedCity}</h3>
              <span className="jobs-count-tag">{jobs.length} Opportunities</span>
            </div>

            {jobs.length === 0 ? (
              <div className="empty-feed-card">
                <span className="empty-icon">📍</span>
                <h4>No jobs match your current filters in {selectedCity}</h4>
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
                      </div>
                      <span className="job-shift-tag">{job.shift || 'Flexible Shift'}</span>
                    </div>

                    <h4 className="job-card-title">{job.title}</h4>
                    <p className="job-card-desc">{job.description}</p>

                    <div className="job-meta-row">
                      <span className="job-loc">📍 {job.area ? `${job.area}, ${job.city}` : job.location || job.city}</span>
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
              <h3>Verified Technicians in {selectedCity}</h3>
              <span className="jobs-count-tag">{technicians.length} Verified Pros</span>
            </div>

            {technicians.length === 0 ? (
              <div className="empty-feed-card">
                <span className="empty-icon">🔧</span>
                <h4>No technicians found in {selectedCity} for this category</h4>
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

      {/* Safety & SOS Protection Banner */}
      <section className="safety-guarantee-banner">
        <div className="safety-banner-icon">🛡️</div>
        <div className="safety-banner-text">
          <h4>WorkMate 24x7 Safety & SOS Protection</h4>
          <p>Real-time location check-in, verified identities with privacy protection, and one-tap emergency SOS support.</p>
        </div>
        <button className="safety-action-btn" onClick={() => openSOSModal()}>
          Test SOS Safety
        </button>
      </section>

      {/* Technician Booking Modal */}
      {selectedTechToBook && (
        <div className="booking-modal-overlay" onClick={() => setSelectedTechToBook(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <h3>Book {selectedTechToBook.full_name}</h3>
                <span className="booking-sub">{selectedTechToBook.badge_type} • {selectedCity}</span>
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

                <div className="form-two-cols">
                  <label>
                    <span>Preferred Date:</span>
                    <input
                      type="date"
                      required
                      value={bookingDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Preferred Time Slot:</span>
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                    >
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      <option value="Immediate Urgent (Within 2 Hours)">Immediate Urgent (Within 2 Hours)</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Doorstep Address in {selectedCity}:</span>
                  <textarea
                    required
                    rows="2"
                    placeholder="House/Flat No, Street, Landmark, Area..."
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                  ></textarea>
                </label>

                <div className="booking-price-summary">
                  <span>Visiting & Inspection Fee:</span>
                  <strong>₹{selectedTechToBook.visiting_charge}</strong>
                </div>

                <button type="submit" className="confirm-booking-btn">
                  Confirm Booking (Pay After Service)
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
