import { useState, useEffect } from 'react';
import { servicesAPI } from '../services/api';
import { useLocationStore, useAuthStore } from '../store';
import { TECHNICIAN_SERVICE_CATEGORIES } from '../data/categoriesData';
import InteractiveMapView from '../components/InteractiveMapView';
import './ServicesPage.css';

export default function ServicesPage() {
  const { user } = useAuthStore();
  const { selectedCity, selectedState, openLocationModal } = useLocationStore();

  const [categories, setCategories] = useState(TECHNICIAN_SERVICE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal
  const [selectedTech, setSelectedTech] = useState(null);
  const [problemDesc, setProblemDesc] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [address, setAddress] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchTechnicians();
  }, [selectedCity, selectedCategory]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await servicesAPI.getTechnicians({
        city: selectedCity,
        category: selectedCategory || undefined,
      });
      setTechnicians(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedTech) return;

    try {
      await servicesAPI.bookService({
        customer_id: user?.id || 'guest-customer',
        technician_id: selectedTech.id,
        category: selectedCategory || selectedTech.service_categories?.[0] || 'General Service',
        service_title: `${selectedTech.full_name} Doorstep Service`,
        problem_description: problemDesc || 'General repair & maintenance',
        city: selectedCity,
        state: selectedState,
        service_address: address || `${selectedCity}, Landmark area`,
        preferred_date: serviceDate || new Date().toISOString().split('T')[0],
        preferred_time_slot: timeSlot,
        estimated_cost: selectedTech.visiting_charge || 199.0,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTech(null);
        setProblemDesc('');
        setAddress('');
      }, 2000);
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const filteredTechs = technicians.filter((t) =>
    searchQuery
      ? t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  return (
    <div className="services-page-container">
      {/* Location Bar */}
      <div className="services-top-bar">
        <div className="services-location-chip" onClick={openLocationModal}>
          <span>📍 Technicians in <strong>{selectedCity}, {selectedState}</strong></span>
          <span className="switch-tag">Change</span>
        </div>
      </div>

      <header className="services-header">
        <h1>Doorstep Technicians & Home Services</h1>
        <p>Verified electricians, plumbers, AC mechanics, and appliance specialists across India.</p>

        {/* Search */}
        <div className="services-search-bar">
          <span className="s-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by skill, e.g. Split AC, Inverter, Front Load, 3-Phase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Category Pills & View Switcher */}
      <section className="service-category-pills-row">
        <div className="service-category-pills">
          <button
            className={`service-cat-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            🌟 All Services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`service-cat-pill ${selectedCategory === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
            >
              <span>{c.icon}</span>
              <span>{c.title}</span>
            </button>
          ))}
        </div>

        <div className="view-mode-toggle-group">
          <button
            className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Map View
          </button>
        </div>
      </section>

      {/* Technicians Main Content */}
      <main className="technicians-grid-section">
        {viewMode === 'map' ? (
          <InteractiveMapView
            technicians={filteredTechs}
            onSelectTechnician={(t) => setSelectedTech(t)}
            height="500px"
          />
        ) : loading ? (
          <div className="tech-loading-state">
            <div className="spinner-ring"></div>
            <p>Loading certified technicians in {selectedCity}...</p>
          </div>
        ) : filteredTechs.length === 0 ? (
          <div className="no-tech-state">
            <span className="no-tech-icon">🔧</span>
            <h3>No technicians listed for this category in {selectedCity}</h3>
            <p>We are expanding daily across India. Try selecting All Services.</p>
            <button className="reset-service-btn" onClick={() => setSelectedCategory('')}>
              View All Services
            </button>
          </div>
        ) : (
          <div className="tech-cards-grid">
            {filteredTechs.map((tech) => (
              <div key={tech.id} className="tech-card">
                <div className="tech-card-header">
                  <img src={tech.avatar_url} alt={tech.full_name} className="tech-img" />
                  <div className="tech-meta">
                    <div className="tech-name-row">
                      <h4>{tech.full_name}</h4>
                      <span className="verified-badge">{tech.badge_type || 'Verified Pro ✓'}</span>
                    </div>
                    <div className="rating-info">
                      <span className="stars">⭐ {tech.rating}</span>
                      <span className="reviews">({tech.total_reviews} reviews)</span>
                      <span className="jobs-count">• {tech.completed_jobs} jobs done</span>
                    </div>
                    <span className="experience-tag">🛠️ {tech.experience_years} years experience</span>
                  </div>
                </div>

                <div className="tech-skills-list">
                  {tech.skills?.map((sk, idx) => (
                    <span key={idx} className="tech-sk-bubble">{sk}</span>
                  ))}
                </div>

                <div className="service-charges-box">
                  <div className="charge-col">
                    <span className="c-title">Visiting Charge</span>
                    <strong className="c-val">₹{tech.visiting_charge}</strong>
                  </div>
                  <div className="charge-col">
                    <span className="c-title">Service Rate</span>
                    <strong className="c-val">₹{tech.hourly_rate}/hr</strong>
                  </div>
                </div>

                <div className="tech-coverage-area">
                  📍 Covering {tech.area ? `${tech.area}, ` : ''}{tech.city} (within {tech.service_radius_km || 15} km)
                </div>

                <button className="book-btn-primary" onClick={() => setSelectedTech(tech)}>
                  ⚡ Book Technician (Doorstep)
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedTech && (
        <div className="booking-modal-overlay" onClick={() => setSelectedTech(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <h3>Book {selectedTech.full_name}</h3>
                <span className="sub">{selectedTech.badge_type} • {selectedCity}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedTech(null)}>✕</button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-box">
                <span className="s-icon">✅</span>
                <h4>Booking Request Confirmed!</h4>
                <p>The technician will reach your location at the selected time slot.</p>
              </div>
            ) : (
              <form className="booking-modal-form" onSubmit={handleBook}>
                <label>
                  <span>Describe the Problem:</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inverter AC not cooling / Water heater coil failure"
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                  />
                </label>

                <div className="form-cols">
                  <label>
                    <span>Preferred Date:</span>
                    <input
                      type="date"
                      required
                      value={serviceDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setServiceDate(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Time Slot:</span>
                    <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      <option value="Immediate (Within 2 Hours)">Immediate (Within 2 Hours)</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Service Address:</span>
                  <textarea
                    required
                    rows="2"
                    placeholder="Flat/House, Street, Area in..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </label>

                <div className="price-confirm-bar">
                  <span>Visiting Charge (Pay after check):</span>
                  <strong>₹{selectedTech.visiting_charge}</strong>
                </div>

                <button type="submit" className="confirm-btn">
                  Confirm Booking (Cash/UPI After Service)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
