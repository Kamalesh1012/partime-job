import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useLocationStore } from '../store';
import { PART_TIME_JOB_CATEGORIES, WORK_SHIFTS, JOB_TYPE_FILTERS } from '../data/categoriesData';
import InteractiveMapView from '../components/InteractiveMapView';
import './JobsPage.css';

export default function JobsPage() {
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
    setRadiusKm,
  } = useLocationStore();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState(radiusKm || 15);

  const displayLocation = selectedArea
    ? `${selectedArea}, ${selectedCity}`
    : `${selectedCity}, ${selectedState}`;

  useEffect(() => {
    fetchJobs();
  }, [selectedCity, selectedState, state_id, district_id, selectedCategory, selectedShift, selectedJobType, selectedRadius]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        state_id: state_id || undefined,
        district_id: district_id || undefined,
        city: selectedCity,
        state: selectedState,
        category: selectedCategory || undefined,
        shift: selectedShift !== 'all' ? selectedShift : undefined,
        job_type: selectedJobType !== 'all' ? selectedJobType : undefined,
      };

      // If coordinates exist, use nearby endpoint for real distance calculation
      let res;
      if (latitude && longitude) {
        res = await jobsAPI.getNearbyJobs(latitude, longitude, selectedRadius, selectedCategory || undefined);
      } else {
        res = await jobsAPI.getJobs(params);
      }

      setJobs(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to load jobs for this location.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedShift('all');
    setSelectedJobType('all');
    setSearchQuery('');
    setSelectedRadius(15);
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.category?.toLowerCase().includes(q) ||
      job.area_name?.toLowerCase().includes(q) ||
      job.employer_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="jobs-page-container">
      {/* Top Location Bar */}
      <div className="jobs-location-bar">
        <div className="location-info-chip" onClick={() => navigate('/location')}>
          <span className="loc-icon">📍</span>
          <div className="loc-text">
            <span className="loc-sub">Jobs in your area</span>
            <strong className="loc-title">{displayLocation}</strong>
          </div>
          <span className="loc-change-btn">Change ▾</span>
        </div>

        {/* View Mode Switcher */}
        <div className="jobs-view-switcher">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List View"
          >
            📋 List
          </button>
          <button
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            aria-label="Map View"
          >
            🗺️ Map
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="jobs-main-content">
        {/* Search Bar */}
        <div className="jobs-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search ${jobs.length} part-time jobs in ${selectedCity}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Category Filter Chips Carousel */}
        <div className="category-scroll-chips">
          <button
            className={`cat-chip ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            🌟 All Categories
          </button>
          {PART_TIME_JOB_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>

        {/* Secondary Filter Row: Radius & Shift */}
        <div className="jobs-filter-row">
          <div className="radius-pills-group">
            <span className="filter-label">Distance:</span>
            {[5, 10, 15, 25, 50].map((r) => (
              <button
                key={r}
                className={`radius-pill ${selectedRadius === r ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRadius(r);
                  setRadiusKm(r);
                }}
              >
                {r} km
              </button>
            ))}
          </div>

          <div className="shift-dropdown-wrap">
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="shift-select"
            >
              <option value="all">⏰ All Shifts</option>
              {WORK_SHIFTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="jobs-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchJobs} className="retry-btn">Retry</button>
          </div>
        )}

        {/* VIEW MODE: MAP VIEW */}
        {viewMode === 'map' ? (
          <div className="jobs-map-container">
            <div className="map-info-banner">
              <span>📍 Showing <strong>{filteredJobs.length}</strong> part-time opportunities on map in {displayLocation}</span>
            </div>
            <InteractiveMapView
              jobs={filteredJobs}
              onSelectJob={(job) => navigate(`/jobs/${job.id}`)}
              initialCoords={latitude && longitude ? [latitude, longitude] : undefined}
              height="550px"
              showFilters={false}
            />
          </div>
        ) : (
          /* VIEW MODE: LIST VIEW */
          <div className="jobs-list-view">
            {/* Header info */}
            <div className="jobs-feed-header">
              <h2>Part-Time & Flexible Work Opportunities</h2>
              <span className="results-count-badge">{filteredJobs.length} Available</span>
            </div>

            {loading ? (
              /* Loading Skeletons */
              <div className="jobs-skeleton-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="job-card-skeleton">
                    <div className="skeleton-line title" />
                    <div className="skeleton-line desc" />
                    <div className="skeleton-line meta" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              /* Polished Empty State */
              <div className="jobs-empty-card">
                <span className="empty-icon">📍</span>
                <h3>No jobs found in {displayLocation}</h3>
                <p>
                  We couldn't find any opportunities matching your current filters. Try increasing your search radius or selecting a different location.
                </p>
                <div className="empty-actions">
                  <button className="primary-action-btn" onClick={() => navigate('/location')}>
                    📍 Change Location
                  </button>
                  <button className="secondary-action-btn" onClick={handleResetFilters}>
                    🔄 Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              /* Job Cards Grid */
              <div className="jobs-cards-grid">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="job-card-item">
                    <div className="job-card-top-row">
                      <div className="job-badges">
                        <span className="job-type-pill">{job.job_type || 'Part-Time'}</span>
                        {job.is_urgent && <span className="urgent-pill">⚡ Urgent</span>}
                        {job.is_weekend && <span className="weekend-pill">📅 Weekend</span>}
                        {job.distance_display && (
                          <span className="distance-pill">📍 {job.distance_display}</span>
                        )}
                      </div>
                      <span className="job-shift-badge">{job.shift || 'Flexible Shift'}</span>
                    </div>

                    <h3 className="job-title-text">{job.title}</h3>
                    <span className="job-employer-name">
                      🏢 {job.employer_name || job.company_name || 'Verified Employer'}
                    </span>
                    <p className="job-desc-text">{job.description?.slice(0, 110)}...</p>

                    <div className="job-meta-specs">
                      <span className="meta-loc">
                        📍 {job.area_name || job.city_name || job.city || selectedCity}
                      </span>
                      <span className="meta-salary">
                        ₹{job.salary_min} - ₹{job.salary_max}{' '}
                        <small>/{job.payment_frequency || 'day'}</small>
                      </span>
                    </div>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="job-skills-tags">
                        {job.skills_required.slice(0, 3).map((sk, idx) => (
                          <span key={idx} className="skill-chip">{sk}</span>
                        ))}
                      </div>
                    )}

                    <div className="job-card-bottom-action">
                      <span className="applicants-count">
                        👥 {job.applications_count || 0} applied
                      </span>
                      <button
                        className="view-job-btn"
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
        )}
      </div>
    </div>
  );
}
