import React, { useState } from 'react';
import { useLocationStore } from '../store';
import { POPULAR_INDIAN_CITIES, ALL_INDIAN_STATES, DISTRICT_TALUK_DATA } from '../data/indiaLocations';
import './LocationSelectorModal.css';

export default function LocationSelectorModal() {
  const {
    selectedCity,
    selectedState,
    selectedArea,
    radiusKm,
    isLocationModalOpen,
    setLocation,
    setRadiusKm,
    closeLocationModal
  } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'state_drilldown'
  const [selectedStateFilter, setSelectedStateFilter] = useState(selectedState || 'Tamil Nadu');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('Chengalpattu');
  const [selectedTalukFilter, setSelectedTalukFilter] = useState('Sholinganallur');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleSelectLocation = (city, state, area = '') => {
    setLocation(city, state, area);
    closeLocationModal();
  };

  const handleDetectGPS = () => {
    setIsDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Check if Google Maps API key exists in env
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            try {
              const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
              );
              const data = await res.json();
              if (data.results && data.results[0]) {
                const comps = data.results[0].address_components;
                let city = 'Chennai';
                let state = 'Tamil Nadu';
                let area = '';

                comps.forEach((c) => {
                  if (c.types.includes('locality')) city = c.long_name;
                  if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                  if (c.types.includes('sublocality') || c.types.includes('neighborhood')) area = c.long_name;
                });

                setIsDetectingLocation(false);
                handleSelectLocation(city, state, area || 'Current Locality');
                return;
              }
            } catch (e) {
              console.error('Google Maps geocoding error:', e);
            }
          }

          // Fallback based on coordinate proximities
          setIsDetectingLocation(false);
          if (lat >= 12.8 && lat <= 13.2 && lng >= 80.0 && lng <= 80.4) {
            handleSelectLocation('Chennai', 'Tamil Nadu', 'Sholinganallur');
          } else if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
            handleSelectLocation('Bengaluru', 'Karnataka', 'Whitefield');
          } else if (lat >= 17.2 && lat <= 17.6 && lng >= 78.2 && lng <= 78.6) {
            handleSelectLocation('Hyderabad', 'Telangana', 'Madhapur');
          } else if (lat >= 18.9 && lat <= 19.3 && lng >= 72.7 && lng <= 73.1) {
            handleSelectLocation('Mumbai', 'Maharashtra', 'Andheri');
          } else if (lat >= 28.4 && lat <= 28.8 && lng >= 77.0 && lng <= 77.4) {
            handleSelectLocation('New Delhi', 'Delhi', 'Saket');
          } else {
            handleSelectLocation(selectedCity || 'Bengaluru', selectedState || 'Karnataka', 'Current Area (GPS)');
          }
        },
        () => {
          setIsDetectingLocation(false);
          handleSelectLocation('Chennai', 'Tamil Nadu', 'Sholinganallur');
        },
        { timeout: 4000 }
      );
    } else {
      setTimeout(() => {
        setIsDetectingLocation(false);
        handleSelectLocation('Chennai', 'Tamil Nadu', 'Sholinganallur');
      }, 600);
    }
  };

  const filteredCities = POPULAR_INDIAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.locality && c.locality.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.taluk && c.taluk.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const districtsForState = DISTRICT_TALUK_DATA[selectedStateFilter] || {};
  const districtKeys = Object.keys(districtsForState);
  const currentDistrictData = districtsForState[selectedDistrictFilter] || { taluks: [], localities: [] };

  return (
    <div className="location-modal-overlay" onClick={closeLocationModal}>
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-icon">📍</span>
            <div>
              <h3>Choose Your Location</h3>
              <p className="location-modal-subtitle">Discover nearby work, events, and technicians across India</p>
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
            <strong>{isDetectingLocation ? 'Detecting GPS via Google Maps...' : 'Use Current Location'}</strong>
            <span>Accurate pinpoint to your State, District, Taluk & Area</span>
          </div>
          <span className="gps-arrow">→</span>
        </button>

        {/* Search Bar */}
        <div className="location-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search state, district, taluk, or city across India..."
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
          <span className="radius-label">Radius:</span>
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

        {/* Tabs: Popular vs Hierarchy Drilldown */}
        {!searchQuery && (
          <div className="location-tabs">
            <button
              className={`location-tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular Hubs
            </button>
            <button
              className={`location-tab-btn ${activeTab === 'state_drilldown' ? 'active' : ''}`}
              onClick={() => setActiveTab('state_drilldown')}
            >
              State → District → Taluk
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
                    key={`${item.city}-${item.taluk || item.state}`}
                    className={`city-select-card ${selectedCity === item.city && selectedArea === item.taluk ? 'selected' : ''}`}
                    onClick={() => handleSelectLocation(item.city, item.state, item.taluk || item.locality)}
                  >
                    <span className="city-icon">📍</span>
                    <div className="city-info">
                      <div className="city-name">{item.taluk ? `${item.taluk}, ${item.city}` : item.city}</div>
                      <div className="city-state">{item.district || item.state} • {item.tag}</div>
                    </div>
                    {selectedCity === item.city && <span className="city-check">✓</span>}
                  </button>
                ))
              ) : (
                <div className="no-location-found">
                  <p>No matching location found for "{searchQuery}".</p>
                  <button
                    className="custom-city-select-btn"
                    onClick={() => handleSelectLocation(searchQuery, 'India', searchQuery)}
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
                  key={`${item.city}-${item.taluk}`}
                  className={`city-select-card ${selectedCity === item.city && (selectedArea === item.taluk || selectedArea === item.locality) ? 'selected' : ''}`}
                  onClick={() => handleSelectLocation(item.city, item.state, item.taluk || item.locality)}
                >
                  <span className="city-icon">📍</span>
                  <div className="city-info">
                    <div className="city-name">{item.taluk ? `${item.taluk}, ${item.city}` : item.city}</div>
                    <div className="city-state">{item.state} • {item.locality}</div>
                  </div>
                  {selectedCity === item.city && <span className="city-check">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            /* Multi-tier State -> District -> Taluk drilldown */
            <div className="state-hierarchy-drilldown">
              <div className="drill-group">
                <label>1. Select State / UT:</label>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => {
                    setSelectedStateFilter(e.target.value);
                    const dKeys = Object.keys(DISTRICT_TALUK_DATA[e.target.value] || {});
                    if (dKeys.length > 0) setSelectedDistrictFilter(dKeys[0]);
                  }}
                >
                  {ALL_INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {districtKeys.length > 0 && (
                <div className="drill-group">
                  <label>2. Select District:</label>
                  <select
                    value={selectedDistrictFilter}
                    onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  >
                    {districtKeys.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentDistrictData.taluks?.length > 0 && (
                <div className="drill-group">
                  <label>3. Select Taluk / Sub-District:</label>
                  <div className="taluk-chips-grid">
                    {currentDistrictData.taluks.map((taluk) => (
                      <button
                        key={taluk}
                        className={`taluk-chip ${selectedArea === taluk ? 'active' : ''}`}
                        onClick={() => handleSelectLocation(selectedDistrictFilter, selectedStateFilter, taluk)}
                      >
                        {taluk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentDistrictData.localities?.length > 0 && (
                <div className="drill-group">
                  <label>Or Choose Major Locality:</label>
                  <div className="taluk-chips-grid">
                    {currentDistrictData.localities.map((loc) => (
                      <button
                        key={loc}
                        className={`taluk-chip ${selectedArea === loc ? 'active' : ''}`}
                        onClick={() => handleSelectLocation(selectedDistrictFilter, selectedStateFilter, loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="location-modal-footer">
          <span>Active Location: <strong>{selectedArea ? `${selectedArea}, ${selectedCity}` : selectedCity}, {selectedState}</strong></span>
        </div>
      </div>
    </div>
  );
}
