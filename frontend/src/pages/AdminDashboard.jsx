import { useEffect, useState } from 'react';
import { adminAPI, jobsAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'employers' | 'jobs' | 'locations'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Location Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('state'); // 'state' | 'district' | 'city'
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [distName, setDistName] = useState('');
  const [distCode, setDistCode] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');
  const [cityName, setCityName] = useState('');
  const [cityPincode, setCityPincode] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, employersRes, jobsRes, locRes] = await Promise.allSettled([
        adminAPI.getAnalytics(),
        adminAPI.getUnverifiedEmployers(),
        jobsAPI.getJobs({ limit: 30 }),
        adminAPI.getLocations()
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data.data || analyticsRes.value.data);
      }
      if (employersRes.status === 'fulfilled') {
        setEmployers(employersRes.value.data.data || employersRes.value.data || []);
      }
      if (jobsRes.status === 'fulfilled') {
        setRecentJobs(jobsRes.value.data.data || jobsRes.value.data || []);
      }
      if (locRes.status === 'fulfilled') {
        setLocations(locRes.value.data.data || []);
      }
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (employerId) => {
    try {
      await adminAPI.verifyEmployer(employerId);
      setEmployers(employers.filter(e => e.id !== employerId));
      setSuccessMsg('Employer verified successfully');
    } catch (err) {
      setError('Failed to verify employer');
    }
  };

  const handleRemoveJob = async (jobId) => {
    const reason = window.prompt('Reason for removing this job:');
    if (!reason) return;
    try {
      await adminAPI.removeFakeJob(jobId, reason);
      setRecentJobs(recentJobs.filter(j => j.id !== jobId));
      setSuccessMsg('Job posting deactivated');
    } catch (err) {
      setError('Failed to remove job');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      if (addType === 'state') {
        await adminAPI.addState({ name: stateName, code: stateCode });
        setSuccessMsg(`State '${stateName}' added successfully!`);
      } else if (addType === 'district') {
        await adminAPI.addDistrict({ name: distName, code: distCode, state_id: selectedStateId });
        setSuccessMsg(`District '${distName}' added!`);
      } else if (addType === 'city') {
        await adminAPI.addCity({ name: cityName, district_id: selectedDistId, state_id: selectedStateId, pincode: cityPincode });
        setSuccessMsg(`City '${cityName}' added!`);
      }
      setShowAddModal(false);
      setStateName('');
      setStateCode('');
      setDistName('');
      setCityName('');
      setCityPincode('');
      // Refresh locations
      const locRes = await adminAPI.getLocations();
      setLocations(locRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add location');
    }
  };

  const handleToggleLocation = async (type, id, currentActive) => {
    try {
      await adminAPI.updateLocation(type, id, { is_active: !currentActive });
      const locRes = await adminAPI.getLocations();
      setLocations(locRes.data.data || []);
      setSuccessMsg('Location status updated');
    } catch (err) {
      setError('Failed to update location');
    }
  };

  if (loading) return <div className="admin-loading">Loading SEWAA admin portal...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>SEWAA Administration Portal</h1>
            <p>Pan-India platform oversight, live job distribution, and dynamic location master management</p>
          </div>
          <div className="admin-tabs-nav">
            <button
              className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`admin-nav-tab ${activeTab === 'locations' ? 'active' : ''}`}
              onClick={() => setActiveTab('locations')}
            >
              🗺️ Locations Master ({locations.length})
            </button>
            <button
              className={`admin-nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              💼 Jobs ({recentJobs.length})
            </button>
            <button
              className={`admin-nav-tab ${activeTab === 'employers' ? 'active' : ''}`}
              onClick={() => setActiveTab('employers')}
            >
              🏢 Verifications ({employers.length})
            </button>
          </div>
        </div>

        {error && <div className="admin-error">{error} <button onClick={() => setError('')}>✕</button></div>}
        {successMsg && <div className="admin-success-msg">✓ {successMsg} <button onClick={() => setSuccessMsg('')}>✕</button></div>}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="admin-analytics">
              <div className="analytics-card">
                <div className="analytics-icon">👥</div>
                <div className="analytics-value">{analytics?.total_users || 1840}</div>
                <div className="analytics-label">Registered Seekers</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">💼</div>
                <div className="analytics-value">{analytics?.total_jobs || recentJobs.length}</div>
                <div className="analytics-label">Active Opportunities</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">🗺️</div>
                <div className="analytics-value">{locations.length || 36}</div>
                <div className="analytics-label">Active States & UTs</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">🏢</div>
                <div className="analytics-value">{analytics?.total_employers || 420}</div>
                <div className="analytics-label">Verified Employers</div>
              </div>
            </div>

            {/* Quick Location Job Distribution Bar */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Live Job Distribution across States</h2>
                <button className="primary-action-btn" onClick={() => setActiveTab('locations')}>
                  Manage Locations →
                </button>
              </div>
              <div className="admin-loc-summary-grid">
                {locations.slice(0, 8).map(st => (
                  <div key={st.id} className="loc-summary-box">
                    <strong>{st.name} ({st.code})</strong>
                    <span>{st.districts_count} Districts • {st.jobs_count} Live Jobs</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LOCATIONS MASTER TAB */}
        {activeTab === 'locations' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2>Pan-India Location Hierarchy Master</h2>
                <p>Add new States, Union Territories, Districts, or PIN codes dynamically without code changes</p>
              </div>
              <button className="primary-action-btn" onClick={() => setShowAddModal(true)}>
                ➕ Add New Location Entry
              </button>
            </div>

            <div className="admin-location-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>State / UT ID</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Districts</th>
                    <th>Live Jobs</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((st) => (
                    <tr key={st.id}>
                      <td><code>{st.id}</code></td>
                      <td><strong>{st.name}</strong></td>
                      <td><span className="code-pill">{st.code}</span></td>
                      <td>{st.type}</td>
                      <td>{st.districts_count} districts</td>
                      <td><span className="job-count-badge">{st.jobs_count}</span></td>
                      <td>
                        <span className={`status-pill ${st.is_active ? 'active' : 'disabled'}`}>
                          {st.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="toggle-status-btn"
                          onClick={() => handleToggleLocation('state', st.id, st.is_active)}
                        >
                          {st.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="admin-section">
            <h2>Recent Job Postings</h2>
            <div className="admin-jobs-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Applicants</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map(job => (
                    <tr key={job.id}>
                      <td className="job-title-cell">{job.title}</td>
                      <td>{job.category}</td>
                      <td>{job.area_name || job.city_name || job.location}, {job.district_name || job.state_name}</td>
                      <td>{job.applications_count || 0}</td>
                      <td>
                        <span className={`admin-status ${job.is_active ? 'active' : 'inactive'}`}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="remove-job-btn" onClick={() => handleRemoveJob(job.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMPLOYERS TAB */}
        {activeTab === 'employers' && (
          <div className="admin-section">
            <h2>Pending Employer Verifications</h2>
            {employers.length === 0 ? (
              <div className="admin-empty">No pending verifications</div>
            ) : (
              <div className="admin-list">
                {employers.map(emp => (
                  <div key={emp.id} className="admin-list-item">
                    <div className="list-item-info">
                      <strong>{emp.company_name || emp.full_name || 'Unknown'}</strong>
                      <span className="list-item-meta">{emp.company_email || emp.email || ''}</span>
                      {emp.industry && <span className="list-item-tag">{emp.industry}</span>}
                      {emp.location && <span className="list-item-meta">📍 {emp.location}</span>}
                    </div>
                    <div className="list-item-actions">
                      <button className="verify-btn" onClick={() => handleVerify(emp.id)}>✓ Verify</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD LOCATION MODAL */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content add-loc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Location to Master Database</h2>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
              </div>

              <form onSubmit={handleAddLocation} className="add-loc-form">
                <label>
                  <span>Location Level:</span>
                  <select value={addType} onChange={(e) => setAddType(e.target.value)}>
                    <option value="state">New State / Union Territory</option>
                    <option value="district">New District under State</option>
                    <option value="city">New City / Locality / PIN Code</option>
                  </select>
                </label>

                {addType === 'state' && (
                  <>
                    <label>
                      <span>State / UT Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Telangana"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>State Code (2 Letters) *</span>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        placeholder="e.g. TS"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                      />
                    </label>
                  </>
                )}

                {addType === 'district' && (
                  <>
                    <label>
                      <span>Select Parent State *</span>
                      <select required value={selectedStateId} onChange={(e) => setSelectedStateId(e.target.value)}>
                        <option value="">-- Choose State --</option>
                        {locations.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>District Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Warangal"
                        value={distName}
                        onChange={(e) => setDistName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>District Code *</span>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="e.g. WARA"
                        value={distCode}
                        onChange={(e) => setDistCode(e.target.value.toUpperCase())}
                      />
                    </label>
                  </>
                )}

                {addType === 'city' && (
                  <>
                    <label>
                      <span>Select Parent State *</span>
                      <select required value={selectedStateId} onChange={(e) => setSelectedStateId(e.target.value)}>
                        <option value="">-- Choose State --</option>
                        {locations.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Select District *</span>
                      <select required value={selectedDistId} onChange={(e) => setSelectedDistId(e.target.value)}>
                        <option value="">-- Choose District --</option>
                        {locations.find((s) => s.id === selectedStateId)?.districts?.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        )) || (
                          <option value="DIST-GEN">General District</option>
                        )}
                      </select>
                    </label>
                    <label>
                      <span>City / Locality Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kazipet"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>PIN Code</span>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 506003"
                        value={cityPincode}
                        onChange={(e) => setCityPincode(e.target.value)}
                      />
                    </label>
                  </>
                )}

                <button type="submit" className="save-loc-btn">
                  Save to Location Master
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
