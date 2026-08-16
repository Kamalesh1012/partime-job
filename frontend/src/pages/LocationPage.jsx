import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationStore } from '../store';
import { locationsAPI } from '../services/api';
import './LocationPage.css';

export default function LocationPage() {
  const navigate = useNavigate();
  const {
    selectedCity,
    selectedState,
    selectedArea,
    state_id,
    district_id,
    recentLocations,
    setLocation,
  } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Hierarchy Navigation State
  const [states, setStates] = useState([]);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictObj, setSelectedDistrictObj] = useState(null);
  const [cities, setCities] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const res = await locationsAPI.getStates();
      if (res.data?.data) {
        setStates(res.data.data);
        // Pre-select current state if matches
        const current = res.data.data.find(
          (s) => s.id === state_id || s.name.toLowerCase() === (selectedState || '').toLowerCase()
        );
        if (current) {
          handleSelectState(current);
        }
      }
    } catch (e) {
      console.error('Error fetching states:', e);
    }
  };

  const handleSelectState = async (stateObj) => {
    setSelectedStateObj(stateObj);
    setSelectedDistrictObj(null);
    setCities([]);
    setLoadingDistricts(true);
    try {
      const res = await locationsAPI.getDistricts(stateObj.id);
      if (res.data?.data) {
        setDistricts(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching districts:', e);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleSelectDistrict = async (distObj) => {
    setSelectedDistrictObj(distObj);
    setLoadingCities(true);
    try {
      const res = await locationsAPI.getCities(distObj.id);
      if (res.data?.data) {
        setCities(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching cities:', e);
    } finally {
      setLoadingCities(false);
    }
  };

  // Fast Autocomplete Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await locationsAPI.search(searchQuery.trim());
        setSearchResults(res.data?.data || []);
      } catch (e) {
        console.error('Error searching locations:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GPS Device Detection
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device/browser.');
      return;
    }

    setGpsDetecting(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await locationsAPI.reverseGeocode(latitude, longitude);
          if (geoRes.data?.nearest_city) {
            const nc = geoRes.data.nearest_city;
            setLocation({
              city: nc.district_name || nc.name,
              state: nc.state_name,
              area: nc.name,
              state_id: nc.state_id,
              district_id: nc.district_id,
              city_id: nc.id,
              latitude: nc.latitude || latitude,
              longitude: nc.longitude || longitude,
            });
            setGpsDetecting(false);
            navigate(-1);
            return;
          }
        } catch (e) {
          console.error('GPS reverse geocode failed:', e);
        }

        // Fallback default
        setLocation({
          city: 'Chennai',
          state: 'Tamil Nadu',
          area: 'Sholinganallur',
          state_id: 'ST-TN',
          district_id: 'DIST-TN-CHENN',
          city_id: 'LOC-TN-SHOLIN',
          latitude,
          longitude,
        });
        setGpsDetecting(false);
        navigate(-1);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsError('Location permission was denied or timed out. Please select from the list below.');
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const handleApplyLocation = (locObj) => {
    setLocation(locObj);
    navigate(-1);
  };

  const currentDisplay = selectedArea
    ? `${selectedArea}, ${selectedCity}`
    : `${selectedCity}, ${selectedState}`;

  return (
    <div className="location-page-container">
      {/* Mobile Top Header */}
      <div className="location-header-bar">
        <button className="back-nav-btn" onClick={() => navigate(-1)} aria-label="Go back">
          ←
        </button>
        <div className="location-header-title">
          <h1>Choose Your Location</h1>
          <p>Find part-time jobs and local services in your area</p>
        </div>
      </div>

      <div className="location-page-content">
        {/* Search Bar */}
        <div className="location-search-box">
          <span className="loc-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search state, district, city, or 6-digit PIN code..."
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

        {/* GPS Auto-Detect Button */}
        <button
          className={`gps-location-btn ${gpsDetecting ? 'detecting' : ''}`}
          onClick={handleUseGPS}
          disabled={gpsDetecting}
        >
          <span className="gps-icon">🎯</span>
          <div className="gps-text">
            <strong>{gpsDetecting ? 'Locating your device...' : 'Use My Current Location'}</strong>
            <small>Detect GPS coordinates for nearest part-time gigs</small>
          </div>
          <span className="gps-arrow">→</span>
        </button>

        {gpsError && (
          <div className="gps-error-notice">
            <span>⚠️ {gpsError}</span>
          </div>
        )}

        {/* Search Results Dropdown/List */}
        {searchQuery.trim().length >= 2 ? (
          <div className="search-results-section">
            <h3>Search Results ({searchResults.length})</h3>
            {isSearching ? (
              <div className="loc-loading-spinner">Searching pan-India locations...</div>
            ) : searchResults.length === 0 ? (
              <div className="loc-empty-result">
                <span>📍</span>
                <p>No locations matched "{searchQuery}". Try browsing by State below.</p>
              </div>
            ) : (
              <div className="search-results-list">
                {searchResults.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.id || idx}`}
                    className="search-result-item"
                    onClick={() => {
                      if (item.type === 'state') {
                        handleApplyLocation({
                          city: item.name,
                          state: item.name,
                          state_id: item.id,
                          district_id: '',
                        });
                      } else if (item.type === 'district') {
                        handleApplyLocation({
                          city: item.name,
                          state: item.state_name || 'India',
                          state_id: item.state_id,
                          district_id: item.id,
                          latitude: item.latitude,
                          longitude: item.longitude,
                        });
                      } else {
                        handleApplyLocation({
                          city: item.district_name || item.name,
                          state: item.state_name || 'India',
                          area: item.name,
                          state_id: item.state_id,
                          district_id: item.district_id,
                          city_id: item.id,
                          latitude: item.latitude,
                          longitude: item.longitude,
                        });
                      }
                    }}
                  >
                    <span className="res-icon">
                      {item.type === 'state' ? '🏛️' : item.type === 'district' ? '📍' : '🏙️'}
                    </span>
                    <div className="res-details">
                      <strong>{item.name}</strong>
                      <small>
                        {item.type.toUpperCase()} • {item.state_name || item.name}{' '}
                        {item.pincode ? `(PIN: ${item.pincode})` : ''}
                      </small>
                    </div>
                    <span className="res-select-tag">Select →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Current Active Location */}
            <div className="active-loc-card">
              <span className="active-loc-tag">Active Selection</span>
              <div className="active-loc-main">
                <span className="active-loc-pin">📍</span>
                <strong>{currentDisplay}</strong>
              </div>
            </div>

            {/* Recently Selected Locations */}
            {recentLocations && recentLocations.length > 0 && (
              <div className="recent-loc-section">
                <h3>Recently Selected</h3>
                <div className="recent-chips-wrap">
                  {recentLocations.map((rec, i) => (
                    <button
                      key={i}
                      className={`recent-chip ${
                        rec.city === selectedCity && (rec.area || '') === (selectedArea || '')
                          ? 'current'
                          : ''
                      }`}
                      onClick={() => handleApplyLocation(rec)}
                    >
                      <span className="chip-pin">📍</span>
                      <span className="chip-name">
                        {rec.area ? `${rec.area}, ` : ''}{rec.city}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cascading State & District Explorer */}
            <div className="hierarchy-explorer-section">
              <h3>Browse All States & Union Territories (36)</h3>
              <p className="hierarchy-hint">Select your state to view districts and local hubs:</p>

              {/* State Horizontal / Grid Pills */}
              <div className="states-grid-selector">
                {states.map((st) => (
                  <button
                    key={st.id}
                    className={`state-select-pill ${selectedStateObj?.id === st.id ? 'active' : ''}`}
                    onClick={() => handleSelectState(st)}
                  >
                    <span className="state-name">{st.name}</span>
                    <span className="state-code">{st.code}</span>
                  </button>
                ))}
              </div>

              {/* District Drawer if State Selected */}
              {selectedStateObj && (
                <div className="districts-subpanel">
                  <div className="subpanel-header">
                    <h4>
                      Districts in <strong>{selectedStateObj.name}</strong> ({districts.length})
                    </h4>
                    <button
                      className="select-whole-state-btn"
                      onClick={() =>
                        handleApplyLocation({
                          city: selectedStateObj.name,
                          state: selectedStateObj.name,
                          state_id: selectedStateObj.id,
                        })
                      }
                    >
                      Select Entire {selectedStateObj.name} →
                    </button>
                  </div>

                  {loadingDistricts ? (
                    <div className="loc-loading-spinner">Loading districts...</div>
                  ) : (
                    <div className="districts-chips-wrap">
                      {districts.map((dst) => (
                        <button
                          key={dst.id}
                          className={`district-chip ${
                            selectedDistrictObj?.id === dst.id ? 'active' : ''
                          }`}
                          onClick={() => handleSelectDistrict(dst)}
                        >
                          📍 {dst.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cities & Localities if District Selected */}
                  {selectedDistrictObj && (
                    <div className="cities-subpanel">
                      <div className="subpanel-header">
                        <h4>
                          Localities in <strong>{selectedDistrictObj.name}</strong>
                        </h4>
                        <button
                          className="select-whole-dist-btn"
                          onClick={() =>
                            handleApplyLocation({
                              city: selectedDistrictObj.name,
                              state: selectedStateObj.name,
                              state_id: selectedStateObj.id,
                              district_id: selectedDistrictObj.id,
                              latitude: selectedDistrictObj.latitude,
                              longitude: selectedDistrictObj.longitude,
                            })
                          }
                        >
                          Select All {selectedDistrictObj.name} →
                        </button>
                      </div>

                      {loadingCities ? (
                        <div className="loc-loading-spinner">Loading localities...</div>
                      ) : cities.length === 0 ? (
                        <div className="no-cities-notice">
                          <p>
                            Direct district selection enabled for {selectedDistrictObj.name}.
                          </p>
                          <button
                            className="apply-direct-btn"
                            onClick={() =>
                              handleApplyLocation({
                                city: selectedDistrictObj.name,
                                state: selectedStateObj.name,
                                state_id: selectedStateObj.id,
                                district_id: selectedDistrictObj.id,
                              })
                            }
                          >
                            Set Location to {selectedDistrictObj.name}
                          </button>
                        </div>
                      ) : (
                        <div className="cities-cards-grid">
                          {cities.map((cty) => (
                            <div
                              key={cty.id}
                              className="city-area-card"
                              onClick={() =>
                                handleApplyLocation({
                                  city: selectedDistrictObj.name,
                                  state: selectedStateObj.name,
                                  area: cty.name,
                                  state_id: selectedStateObj.id,
                                  district_id: selectedDistrictObj.id,
                                  city_id: cty.id,
                                  latitude: cty.latitude,
                                  longitude: cty.longitude,
                                  pincode: cty.pincode,
                                })
                              }
                            >
                              <div className="city-card-info">
                                <strong>{cty.name}</strong>
                                {cty.pincode && <small>PIN: {cty.pincode}</small>}
                              </div>
                              <span className="select-arrow-icon">→</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
