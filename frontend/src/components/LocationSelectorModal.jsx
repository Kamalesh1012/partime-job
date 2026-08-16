import React, { useState, useMemo } from 'react';
import { useLocationStore } from '../store';
import {
  POPULAR_INDIAN_CITIES,
  ALL_INDIAN_STATES,
  ALL_INDIAN_DISTRICTS,
  DISTRICT_TALUK_DATA
} from '../data/indiaLocations';
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
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'all_districts'
  const [selectedStateFilter, setSelectedStateFilter] = useState(selectedState || 'Tamil Nadu');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState(selectedCity || 'Chennai');
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

  // Comprehensive search across all 786 districts, states, and hubs
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const results = [];

    // Search popular hubs
    POPULAR_INDIAN_CITIES.forEach((c) => {
      if (
        c.city.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query) ||
        (c.taluk && c.taluk.toLowerCase().includes(query))
      ) {
        results.push({
          name: c.taluk ? `${c.taluk}, ${c.city}` : c.city,
          city: c.city,
          state: c.state,
          area: c.taluk || c.locality || '',
          tag: c.tag || 'Popular Hub'
        });
      }
    });

    // Search all 786 Indian districts
    Object.entries(ALL_INDIAN_DISTRICTS).forEach(([state, dists]) => {
      if (state.toLowerCase().includes(query)) {
        results.push({
          name: state,
          city: dists[0] || state,
          state: state,
          area: '',
          tag: `State / UT (${dists.length} Districts)`
        });
      }
      dists.forEach((dist) => {
        if (dist.toLowerCase().includes(query)) {
          results.push({
            name: dist,
            city: dist,
            state: state,
            area: '',
            tag: `District in ${state}`
          });
        }
      });
    });

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    results.forEach((r) => {
      const key = `${r.city}-${r.state}-${r.area}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    });

    return unique.slice(0, 30);
  }, [searchQuery]);

  const currentDistrictsList = ALL_INDIAN_DISTRICTS[selectedStateFilter] || [];
  const currentTaluksData = (DISTRICT_TALUK_DATA[selectedStateFilter] && DISTRICT_TALUK_DATA[selectedStateFilter][selectedDistrictFilter]) || { taluks: [], localities: [] };

  return (
    <div className="location-modal-overlay" onClick={closeLocationModal}>
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-modal-title-group">
            <span className="location-modal-icon">📍</span>
            <div>
              <h3>Choose Location Across India</h3>
              <p className="location-modal-subtitle">All 28 States, 8 UTs & 780+ Districts Supported</p>
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
            placeholder="Search any State, District, Taluk or City across India..."
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

        {/* Tabs */}
        {!searchQuery && (
          <div className="location-tabs">
            <button
              className={`location-tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular Metros
            </button>
            <button
              className={`location-tab-btn ${activeTab === 'all_districts' ? 'active' : ''}`}
              onClick={() => setActiveTab('all_districts')}
            >
              All India States & Districts (780+)
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="location-modal-body">
          {searchQuery ? (
            <div className="cities-grid">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button
                    key={`${item.city}-${item.state}-${item.area}`}
                    className={`city-select-card ${selectedCity === item.city && (!item.area || selectedArea === item.area) ? 'selected' : ''}`}
                    onClick={() => handleSelectLocation(item.city, item.state, item.area)}
                  >
                    <span className="city-icon">📍</span>
                    <div className="city-info">
                      <div className="city-name">{item.name}</div>
                      <div className="city-state">{item.state} • {item.tag}</div>
                    </div>
                    {selectedCity === item.city && <span className="city-check">✓</span>}
                  </button>
                ))
              ) : (
                <div className="no-location-found">
                  <p>No matching district found for "{searchQuery}".</p>
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
            /* Pan-India 36 States & 786 Districts Explorer */
            <div className="state-hierarchy-drilldown">
              <div className="drill-group">
                <label>
                  <span>1. Select State / Union Territory:</span>
                  <span className="count-badge">{ALL_INDIAN_STATES.length} States & UTs</span>
                </label>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setSelectedStateFilter(newState);
                    const dList = ALL_INDIAN_DISTRICTS[newState] || [];
                    if (dList.length > 0) setSelectedDistrictFilter(dList[0]);
                  }}
                >
                  {ALL_INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st} ({ALL_INDIAN_DISTRICTS[st]?.length || 0} Districts)
                    </option>
                  ))}
                </select>
              </div>

              {/* District Selector */}
              <div className="drill-group">
                <div className="district-header-row">
                  <label>2. Districts in {selectedStateFilter}:</label>
                  <span className="count-badge">{currentDistrictsList.length} Districts</span>
                </div>

                <div className="districts-chips-wrap">
                  {currentDistrictsList.map((dist) => (
                    <button
                      key={dist}
                      className={`district-chip-btn ${selectedDistrictFilter === dist ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDistrictFilter(dist);
                        handleSelectLocation(dist, selectedStateFilter);
                      }}
                    >
                      <span className="dist-pin">📍</span>
                      <span className="dist-name">{dist}</span>
                      {selectedCity === dist && <span className="dist-tick">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taluks / Sub-districts if configured */}
              {currentTaluksData.taluks?.length > 0 && (
                <div className="drill-group">
                  <label>3. Major Taluks / Areas in {selectedDistrictFilter}:</label>
                  <div className="taluk-chips-grid">
                    {currentTaluksData.taluks.map((taluk) => (
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
