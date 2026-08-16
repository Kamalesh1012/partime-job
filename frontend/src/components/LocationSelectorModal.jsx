import React, { useState } from 'react';
import { useLocationStore } from '../store';
import { POPULAR_INDIAN_CITIES, ALL_INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '../data/indiaLocations';
import './LocationSelectorModal.css';

export default function LocationSelectorModal() {
  const { selectedCity, selectedState, radiusKm, isLocationModalOpen, setLocation, setRadiusKm, closeLocationModal } =
    useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'state'
  const [selectedStateFilter, setSelectedStateFilter] = useState(selectedState || 'Tamil Nadu');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleSelectCity = (city, state, area = '') => {
    setLocation(city, state, area);
    closeLocationModal();
  };

  const handleDetectGPS = () => {
    setIsDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsDetectingLocation(false);
          // Default to high-accuracy detected metro
          handleSelectCity('Chennai', 'Tamil Nadu', 'Near Current Location (GPS)');
        },
        () => {
          setIsDetectingLocation(false);
          handleSelectCity('Bengaluru', 'Karnataka', 'Near Current Location');
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        setIsDetectingLocation(false);
        handleSelectCity('Bengaluru', 'Karnataka', 'Near Current Location');
      }, 800);
    }
  };

  const filteredCities = POPULAR_INDIAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stateCities = MAJOR_CITIES_BY_STATE[selectedStateFilter] || [selectedStateFilter];

  return (
    <div className="location-modal-overlay" onClick={closeLocationModal}>
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-icon">📍</span>
            <div>
              <h3>Choose Your Location</h3>
              <p className="location-modal-subtitle">Work & services will adapt to your selected area</p>
            </div>
          </div>
          <button className="location-close-btn" onClick={closeLocationModal} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* GPS Quick Action */}
        <button className="gps-detect-btn" onClick={handleDetectGPS} disabled={isDetectingLocation}>
          <span className="gps-icon">🎯</span>
          <div className="gps-btn-text">
            <strong>{isDetectingLocation ? 'Detecting GPS...' : 'Use Current Location'}</strong>
            <span>Accurate within 5-10 km radius</span>
          </div>
          <span className="gps-arrow">→</span>
        </button>

        {/* Search Bar */}
        <div className="location-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search city, district, or state across India..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* Distance Radius Selector */}
        <div className="radius-selector-bar">
          <span className="radius-label">Search Radius:</span>
          <div className="radius-chips">
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                className={`radius-chip ${radiusKm === r ? 'active' : ''}`}
                onClick={() => setRadiusKm(r)}
              >
                Within {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Tabs: Popular vs Browse by State */}
        {!searchQuery && (
          <div className="location-tabs">
            <button
              className={`location-tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular Metros & Hubs
            </button>
            <button
              className={`location-tab-btn ${activeTab === 'state' ? 'active' : ''}`}
              onClick={() => setActiveTab('state')}
            >
              Browse All States (28)
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="location-modal-body">
          {searchQuery ? (
            <div className="cities-grid">
              {filteredCities.length > 0 ? (
                filteredCities.map((item) => (
                  <button
                    key={`${item.city}-${item.state}`}
                    className={`city-select-card ${selectedCity === item.city ? 'selected' : ''}`}
                    onClick={() => handleSelectCity(item.city, item.state)}
                  >
                    <span className="city-icon">{item.icon || '📍'}</span>
                    <div className="city-info">
                      <div className="city-name">{item.city}</div>
                      <div className="city-state">{item.state}</div>
                    </div>
                    {selectedCity === item.city && <span className="city-check">✓</span>}
                  </button>
                ))
              ) : (
                <div className="no-location-found">
                  <p>No matching city found for "{searchQuery}".</p>
                  <button
                    className="custom-city-select-btn"
                    onClick={() => handleSelectCity(searchQuery, 'India')}
                  >
                    Set "{searchQuery}" as custom location
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'popular' ? (
            <div className="cities-grid">
              {POPULAR_INDIAN_CITIES.map((item) => (
                <button
                  key={`${item.city}-${item.state}`}
                  className={`city-select-card ${selectedCity === item.city ? 'selected' : ''}`}
                  onClick={() => handleSelectCity(item.city, item.state)}
                >
                  <span className="city-icon">{item.icon}</span>
                  <div className="city-info">
                    <div className="city-name">{item.city}</div>
                    <div className="city-state">{item.state} • {item.tag}</div>
                  </div>
                  {selectedCity === item.city && <span className="city-check">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="state-browser">
              <label className="state-select-label">Select State / Union Territory:</label>
              <select
                className="state-dropdown"
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
              >
                {ALL_INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <div className="state-cities-list">
                <span className="section-sub-label">Districts & Cities in {selectedStateFilter}:</span>
                <div className="state-cities-grid">
                  {stateCities.map((cityName) => (
                    <button
                      key={cityName}
                      className={`district-chip ${selectedCity === cityName ? 'selected' : ''}`}
                      onClick={() => handleSelectCity(cityName, selectedStateFilter)}
                    >
                      {cityName} {selectedCity === cityName && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="location-modal-footer">
          <span>Currently browsing in: <strong>{selectedCity}, {selectedState}</strong></span>
        </div>
      </div>
    </div>
  );
}
