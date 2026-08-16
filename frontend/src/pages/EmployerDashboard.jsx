import { useEffect, useState } from 'react';
import { jobsAPI, applicationsAPI, locationsAPI } from '../services/api';
import { useAuthStore } from '../store';
import InteractiveMapView from '../components/InteractiveMapView';
import './EmployerDashboard.css';

const JOB_CATEGORIES = [
  { id: 'Delivery', label: 'Delivery & Logistics' },
  { id: 'Store Assistant', label: 'Retail & Store Assistant' },
  { id: 'Event Staff', label: 'Catering & Event Staff' },
  { id: 'Packing', label: 'Warehouse & Packing' },
  { id: 'Technician Helper', label: 'Technician & Repair Helper' },
  { id: 'Cleaning', label: 'Housekeeping & Cleaning' },
  { id: 'Security', label: 'Security & Bouncer' },
  { id: 'Data Entry', label: 'Office & Data Entry' },
];

const JOB_TYPES = [
  { id: 'Part-time', label: 'Part-Time' },
  { id: 'Daily wage', label: 'Daily Wage' },
  { id: 'Weekend', label: 'Weekend Job' },
  { id: 'One-day job', label: '1-Day Event Gig' },
];

const WORK_TYPES = [
  { id: 'On-site', label: 'On-site / Worksite' },
  { id: 'Field', label: 'Field / Mobile' },
  { id: 'Remote', label: 'Work from Home' },
];

const EmployerDashboard = () => {
  const user = useAuthStore((s) => s.user);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicants, setShowApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // 5-Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  const defaultForm = {
    title: '',
    description: '',
    category: 'Delivery',
    job_type: 'Part-time',
    work_type: 'On-site',
    shift: 'Evening (5 PM - 10 PM)',
    salary_min: 750,
    salary_max: 1200,
    salary_currency: 'INR',
    payment_frequency: 'Per Day',
    openings: 2,
    is_urgent: false,
    is_weekend: false,
    skills_required: '',
    application_deadline: '',
    // Location Details
    state_id: 'ST-TN',
    state_name: 'Tamil Nadu',
    district_id: 'DIST-TN-CHEN',
    district_name: 'Chennai',
    city_id: 'LOC-TN-SHOLIN',
    city_name: 'Chennai',
    area_name: 'Sholinganallur',
    address: 'OMR Road, Sholinganallur',
    pin_code: '600119',
    latitude: 12.8996,
    longitude: 80.2279,
  };

  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const res = await locationsAPI.getStates();
      if (res.data?.data) {
        setStatesList(res.data.data);
      }
    } catch (e) {
      console.error('Error loading states:', e);
    }
  };

  const loadDistrictsForState = async (stateId) => {
    try {
      const res = await locationsAPI.getDistricts(stateId);
      if (res.data?.data) {
        setDistrictsList(res.data.data);
        if (res.data.data.length > 0) {
          const firstDist = res.data.data[0];
          setFormData((prev) => ({
            ...prev,
            district_id: firstDist.id,
            district_name: firstDist.name,
            latitude: firstDist.latitude || prev.latitude,
            longitude: firstDist.longitude || prev.longitude,
          }));
          loadCitiesForDistrict(firstDist.id);
        }
      }
    } catch (e) {
      console.error('Error loading districts:', e);
    }
  };

  const loadCitiesForDistrict = async (districtId) => {
    try {
      const res = await locationsAPI.getCities(districtId);
      if (res.data?.data) {
        setCitiesList(res.data.data);
      }
    } catch (e) {
      console.error('Error loading cities:', e);
    }
  };

  const handleStateChange = (e) => {
    const selectedStId = e.target.value;
    const stObj = statesList.find((s) => s.id === selectedStId);
    if (!stObj) return;

    setFormData((prev) => ({
      ...prev,
      state_id: stObj.id,
      state_name: stObj.name,
      latitude: stObj.latitude || prev.latitude,
      longitude: stObj.longitude || prev.longitude,
    }));

    loadDistrictsForState(stObj.id);
  };

  const handleDistrictChange = (e) => {
    const selectedDistId = e.target.value;
    const distObj = districtsList.find((d) => d.id === selectedDistId);
    if (!distObj) return;

    setFormData((prev) => ({
      ...prev,
      district_id: distObj.id,
      district_name: distObj.name,
      city_name: distObj.name,
      area_name: distObj.name,
      latitude: distObj.latitude || prev.latitude,
      longitude: distObj.longitude || prev.longitude,
    }));

    loadCitiesForDistrict(distObj.id);
  };

  const handleCityChange = (e) => {
    const selectedCityId = e.target.value;
    const cityObj = citiesList.find((c) => c.id === selectedCityId);
    if (!cityObj) return;

    setFormData((prev) => ({
      ...prev,
      city_id: cityObj.id,
      city_name: cityObj.name,
      area_name: cityObj.name,
      pin_code: cityObj.pincode || prev.pin_code,
      latitude: cityObj.latitude || prev.latitude,
      longitude: cityObj.longitude || prev.longitude,
    }));
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.getJobs({ employer_id: user?.id });
      setJobs(res.data.data || res.data || []);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishJob = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        salary_min: parseFloat(formData.salary_min) || 0,
        salary_max: parseFloat(formData.salary_max) || 0,
        openings: parseInt(formData.openings, 10) || 1,
        skills_required: typeof formData.skills_required === 'string'
          ? formData.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
          : formData.skills_required,
        latitude: parseFloat(formData.latitude) || 13.0827,
        longitude: parseFloat(formData.longitude) || 80.2707,
      };

      if (editingJob) {
        await jobsAPI.updateJob(editingJob.id, payload, user?.id || 'employer-verified');
      } else {
        await jobsAPI.createJob(payload, user?.id || 'employer-verified');
      }

      setShowCreateModal(false);
      setFormData(defaultForm);
      setEditingJob(null);
      setCurrentStep(1);
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save job posting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Deactivate this job posting?')) return;
    try {
      await jobsAPI.deleteJob(jobId, user?.id || 'employer-verified');
      fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData(defaultForm);
    setCurrentStep(1);
    loadDistrictsForState(defaultForm.state_id);
    setShowCreateModal(true);
  };

  const viewApplicants = async (jobId) => {
    setShowApplicants(jobId);
    setApplicantsLoading(true);
    try {
      const res = await applicationsAPI.getJobApplications(jobId);
      setApplicants(res.data.data || res.data || []);
    } catch (err) {
      setApplicants([]);
    } finally {
      setApplicantsLoading(false);
    }
  };

  return (
    <div className="employer-dashboard">
      <div className="employer-container">
        {/* Header */}
        <div className="employer-header">
          <div>
            <h1>Employer Portal</h1>
            <p>Post flexible part-time shifts, gigs, and manage applicants across India</p>
          </div>
          <button className="post-job-btn" onClick={openCreateModal}>
            ➕ Post New Job Opportunity
          </button>
        </div>

        {error && (
          <div className="employer-error">
            {error} <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Jobs List */}
        <div className="employer-section">
          <h2>Your Active Job Postings ({jobs.length})</h2>
          {loading ? (
            <div className="employer-loading">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="employer-empty">
              <p>You haven't posted any jobs yet.</p>
              <button className="post-job-btn" onClick={openCreateModal}>
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="employer-jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="employer-job-card">
                  <div className="employer-job-header">
                    <h3>{job.title}</h3>
                    <span className={`status-badge ${job.is_active ? 'active' : 'inactive'}`}>
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="employer-job-desc">{job.description?.slice(0, 100)}...</p>
                  <div className="employer-job-details">
                    <span>📁 {job.category}</span>
                    <span>⏰ {job.job_type}</span>
                    <span>📍 {job.area_name || job.city_name || job.city}, {job.district_name || job.state_name || job.state}</span>
                    <span>💰 ₹{job.salary_min} - ₹{job.salary_max} /{job.payment_frequency || 'day'}</span>
                  </div>
                  <div className="employer-job-actions">
                    <button className="action-btn view-btn" onClick={() => viewApplicants(job.id)}>
                      👥 Applicants ({job.applications_count || 0})
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteJob(job.id)}>
                      🗑️ Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applicants Modal */}
        {showApplicants && (
          <div className="modal-overlay" onClick={() => setShowApplicants(null)}>
            <div className="modal-content applicants-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Job Applicants</h2>
                <button className="close-btn" onClick={() => setShowApplicants(null)}>✕</button>
              </div>
              {applicantsLoading ? (
                <div className="modal-loading">Loading applicants...</div>
              ) : applicants.length === 0 ? (
                <div className="employer-empty">No applications received yet.</div>
              ) : (
                <div className="applicants-list">
                  {applicants.map((app) => (
                    <div key={app.id} className="applicant-card">
                      <div className="applicant-info">
                        <h4>{app.student_profile?.full_name || 'Applicant'}</h4>
                        <p>📞 {app.student_profile?.phone || 'Phone on file'}</p>
                        <p>📍 {app.student_profile?.location || 'Verified seeker'}</p>
                      </div>
                      <div className="applicant-actions">
                        <span className={`app-status ${app.status}`}>{app.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5-STEP JOB CREATION WIZARD MODAL */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content create-job-wizard-modal" onClick={(e) => e.stopPropagation()}>
              {/* Wizard Steps Indicator */}
              <div className="wizard-progress-bar">
                <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}>
                  <span className="step-num">1</span>
                  <span className="step-txt">Job Info</span>
                </div>
                <div className={`wizard-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''}`}>
                  <span className="step-num">2</span>
                  <span className="step-txt">Location</span>
                </div>
                <div className={`wizard-step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''}`}>
                  <span className="step-num">3</span>
                  <span className="step-txt">Map Pin</span>
                </div>
                <div className={`wizard-step ${currentStep >= 4 ? 'active' : ''} ${currentStep === 4 ? 'current' : ''}`}>
                  <span className="step-num">4</span>
                  <span className="step-txt">Review</span>
                </div>
                <div className={`wizard-step ${currentStep >= 5 ? 'active' : ''} ${currentStep === 5 ? 'current' : ''}`}>
                  <span className="step-num">5</span>
                  <span className="step-txt">Publish</span>
                </div>
              </div>

              <div className="modal-header">
                <h2>
                  {currentStep === 1 && '📝 Step 1: Job Details & Compensation'}
                  {currentStep === 2 && '📍 Step 2: India Location & Cascading Selection'}
                  {currentStep === 3 && '🗺️ Step 3: Pinpoint Exact Location on Map'}
                  {currentStep === 4 && '👁️ Step 4: Preview Job Opportunity'}
                  {currentStep === 5 && '🚀 Step 5: Publish & Confirmation'}
                </h2>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
              </div>

              <div className="wizard-step-body">
                {/* STEP 1: Job Information */}
                {currentStep === 1 && (
                  <div className="wizard-form-fields">
                    <label>
                      <span>Job Title *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Evening E-Commerce Delivery Partner"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </label>

                    <div className="form-two-cols">
                      <label>
                        <span>Category *</span>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {JOB_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Job Type *</span>
                        <select
                          value={formData.job_type}
                          onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                        >
                          {JOB_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="form-two-cols">
                      <label>
                        <span>Work Arrangement *</span>
                        <select
                          value={formData.work_type}
                          onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                        >
                          {WORK_TYPES.map((w) => (
                            <option key={w.id} value={w.id}>{w.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Shift Schedule</span>
                        <input
                          type="text"
                          placeholder="e.g. Evening (5 PM - 10 PM)"
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="form-two-cols">
                      <label>
                        <span>Min Pay (₹) *</span>
                        <input
                          type="number"
                          required
                          value={formData.salary_min}
                          onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>Max Pay (₹) *</span>
                        <input
                          type="number"
                          required
                          value={formData.salary_max}
                          onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                        />
                      </label>
                    </div>

                    <label>
                      <span>Job Description *</span>
                      <textarea
                        rows={3}
                        required
                        placeholder="Describe duties, timings, incentives, and requirements..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Skills Required (comma-separated)</span>
                      <input
                        type="text"
                        placeholder="e.g. 2-Wheeler Driving, Navigation, Box Packing"
                        value={formData.skills_required}
                        onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                {/* STEP 2: Cascading Location Selection */}
                {currentStep === 2 && (
                  <div className="wizard-form-fields">
                    <div className="form-two-cols">
                      <label>
                        <span>Country</span>
                        <input type="text" disabled value="India" />
                      </label>
                      <label>
                        <span>State / Union Territory *</span>
                        <select value={formData.state_id} onChange={handleStateChange}>
                          {statesList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) - {s.type}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="form-two-cols">
                      <label>
                        <span>District (Filtered to {formData.state_name}) *</span>
                        <select value={formData.district_id} onChange={handleDistrictChange}>
                          {districtsList.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>City / Taluk / Locality</span>
                        <select value={formData.city_id} onChange={handleCityChange}>
                          <option value="">-- Select Locality in {formData.district_name} --</option>
                          {citiesList.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} {c.pincode ? `(${c.pincode})` : ''}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="form-two-cols">
                      <label>
                        <span>Specific Area / Hub Name *</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sholinganallur / Whitefield / Andheri West"
                          value={formData.area_name}
                          onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>PIN Code *</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 600119"
                          value={formData.pin_code}
                          onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                        />
                      </label>
                    </div>

                    <label>
                      <span>Complete Worksite / Office Address *</span>
                      <input
                        type="text"
                        required
                        placeholder="Building No, Street Name, Landmark"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                {/* STEP 3: Map Pinpoint Picker */}
                {currentStep === 3 && (
                  <div className="wizard-map-step">
                    <p className="map-step-hint">
                      📍 <strong>Drag the pin</strong> on the map below to pinpoint the exact worksite / doorstep coordinates.
                    </p>
                    <InteractiveMapView
                      isPicker={true}
                      initialCoords={[formData.latitude, formData.longitude]}
                      onPositionChange={(pos) => {
                        setFormData((prev) => ({
                          ...prev,
                          latitude: pos.latitude,
                          longitude: pos.longitude,
                        }));
                      }}
                      height="360px"
                      showFilters={false}
                    />
                    <div className="coords-display-box">
                      <span>Selected Latitude: <strong>{Number(formData.latitude).toFixed(4)}</strong></span>
                      <span>Selected Longitude: <strong>{Number(formData.longitude).toFixed(4)}</strong></span>
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Validate */}
                {currentStep === 4 && (
                  <div className="wizard-review-card">
                    <h3>Review Job Posting Details</h3>
                    <div className="review-grid">
                      <div className="rev-item">
                        <small>Title</small>
                        <strong>{formData.title || 'Untitled Job'}</strong>
                      </div>
                      <div className="rev-item">
                        <small>Category & Type</small>
                        <strong>{formData.category} • {formData.job_type} ({formData.work_type})</strong>
                      </div>
                      <div className="rev-item">
                        <small>Compensation</small>
                        <strong>₹{formData.salary_min} - ₹{formData.salary_max} /{formData.payment_frequency}</strong>
                      </div>
                      <div className="rev-item">
                        <small>Location Hierarchy</small>
                        <strong>India → {formData.state_name} → {formData.district_name} → {formData.area_name}</strong>
                      </div>
                      <div className="rev-item">
                        <small>Street Address & PIN</small>
                        <strong>{formData.address} (PIN: {formData.pin_code})</strong>
                      </div>
                      <div className="rev-item">
                        <small>GPS Coordinates</small>
                        <strong>Lat {Number(formData.latitude).toFixed(4)}, Lng {Number(formData.longitude).toFixed(4)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Final Publish */}
                {currentStep === 5 && (
                  <div className="wizard-publish-ready">
                    <span className="ready-icon">🚀</span>
                    <h3>Ready to Publish on SEWAA India!</h3>
                    <p>
                      Your job will immediately appear on the Pan-India Map, Nearby GPS Feed, and District Search for verified workers.
                    </p>
                  </div>
                )}
              </div>

              {/* Wizard Nav Controls */}
              <div className="wizard-nav-footer">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="wizard-back-btn"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    ← Back
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    className="wizard-next-btn"
                    onClick={() => {
                      if (currentStep === 1 && !formData.title.trim()) {
                        alert('Please provide a job title.');
                        return;
                      }
                      setCurrentStep(currentStep + 1);
                    }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wizard-publish-btn"
                    disabled={submitting}
                    onClick={handlePublishJob}
                  >
                    {submitting ? 'Publishing...' : '✨ Publish Job Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
