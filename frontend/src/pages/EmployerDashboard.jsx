import { useEffect, useState } from 'react';
import { jobsAPI, applicationsAPI, profilesAPI } from '../services/api';
import { useAuthStore } from '../store';
import './EmployerDashboard.css';

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

  const emptyForm = {
    title: '', description: '', category: 'data_entry', job_type: 'part_time',
    location: 'omr', salary_min: '', salary_max: '', experience_required: '0-1 years',
    skills_required: '', application_deadline: ''
  };
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

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

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salary_min: parseFloat(formData.salary_min) || 0,
        salary_max: parseFloat(formData.salary_max) || 0,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(Boolean),
        application_deadline: formData.application_deadline || null
      };

      if (editingJob) {
        await jobsAPI.updateJob(editingJob.id, payload, user.id);
      } else {
        await jobsAPI.createJob(payload, user.id);
      }
      setShowCreateModal(false);
      setFormData(emptyForm);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await jobsAPI.deleteJob(jobId, user.id);
      fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  const openEdit = (job) => {
    setFormData({
      title: job.title, description: job.description, category: job.category,
      job_type: job.job_type, location: job.location,
      salary_min: job.salary_min || '', salary_max: job.salary_max || '',
      experience_required: job.experience_required || '0-1 years',
      skills_required: (job.skills_required || []).join(', '),
      application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : ''
    });
    setEditingJob(job);
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

  const updateAppStatus = async (appId, newStatus) => {
    try {
      await applicationsAPI.updateApplicationStatus(appId, newStatus, user.id);
      viewApplicants(showApplicants);
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const stats = {
    activeJobs: jobs.filter(j => j.is_active).length,
    totalApplicants: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
    totalJobs: jobs.length
  };

  if (loading) return <div className="emp-loading">Loading dashboard...</div>;

  return (
    <div className="employer-dashboard">
      <div className="emp-container">
        <div className="emp-header">
          <div>
            <h1>Employer Dashboard</h1>
            <p>Manage your job postings and applicants</p>
          </div>
          <button className="create-job-btn" onClick={() => { setFormData(emptyForm); setEditingJob(null); setShowCreateModal(true); }}>
            + Post New Job
          </button>
        </div>

        {error && <div className="emp-error">{error} <button onClick={() => setError('')}>✕</button></div>}

        {/* Stats */}
        <div className="emp-stats">
          <div className="emp-stat-card">
            <div className="emp-stat-value">{stats.totalJobs}</div>
            <div className="emp-stat-label">Total Jobs</div>
          </div>
          <div className="emp-stat-card">
            <div className="emp-stat-value">{stats.activeJobs}</div>
            <div className="emp-stat-label">Active Jobs</div>
          </div>
          <div className="emp-stat-card">
            <div className="emp-stat-value">{stats.totalApplicants}</div>
            <div className="emp-stat-label">Total Applicants</div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="emp-section">
          <h2>My Job Postings</h2>
          {jobs.length === 0 ? (
            <div className="emp-empty">No jobs posted yet. Click "Post New Job" to get started.</div>
          ) : (
            <div className="emp-jobs-list">
              {jobs.map(job => (
                <div key={job.id} className="emp-job-card">
                  <div className="emp-job-info">
                    <div className="emp-job-title-row">
                      <h3>{job.title}</h3>
                      <span className={`emp-status-tag ${job.is_active ? 'active' : 'inactive'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="emp-job-meta">
                      <span>📍 {job.location}</span>
                      <span>📁 {job.category}</span>
                      <span>👤 {job.applications_count || 0} applicants</span>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <div className="emp-job-salary">₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}</div>
                    )}
                  </div>
                  <div className="emp-job-actions">
                    <button className="view-apps-btn" onClick={() => viewApplicants(job.id)}>View Applicants</button>
                    <button className="edit-btn" onClick={() => openEdit(job)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteJob(job.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applicants Panel */}
        {showApplicants && (
          <div className="emp-section applicants-section">
            <div className="section-header-row">
              <h2>Applicants</h2>
              <button className="close-section-btn" onClick={() => setShowApplicants(null)}>✕ Close</button>
            </div>
            {applicantsLoading ? (
              <div className="emp-loading-inline">Loading applicants...</div>
            ) : applicants.length === 0 ? (
              <div className="emp-empty">No applicants yet for this job.</div>
            ) : (
              <div className="applicants-list">
                {applicants.map(app => (
                  <div key={app.id} className="applicant-card">
                    <div className="applicant-info">
                      <strong>{app.student_name || `Student ${app.student_id?.slice(0, 8)}`}</strong>
                      <span className={`status-badge ${app.status}`}>{app.status}</span>
                    </div>
                    {app.cover_letter && <p className="applicant-cover">{app.cover_letter}</p>}
                    <div className="applicant-date">Applied: {new Date(app.applied_at || app.created_at).toLocaleDateString()}</div>
                    <div className="applicant-actions">
                      {app.status === 'pending' && (
                        <>
                          <button className="shortlist-btn" onClick={() => updateAppStatus(app.id, 'shortlisted')}>Shortlist</button>
                          <button className="reject-btn" onClick={() => updateAppStatus(app.id, 'rejected')}>Reject</button>
                        </>
                      )}
                      {app.status === 'shortlisted' && (
                        <button className="hire-btn" onClick={() => updateAppStatus(app.id, 'hired')}>Hire</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Job Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingJob(null); }}>
          <div className="modal-content emp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
            <form onSubmit={handleCreateJob} className="job-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Part-Time Data Entry" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="data_entry">Data Entry</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="retail_sales">Retail Sales</option>
                    <option value="cafe_staff">Cafe Staff</option>
                    <option value="restaurant_crew">Restaurant Crew</option>
                    <option value="event_staff">Event Staff</option>
                    <option value="delivery_partner">Delivery Partner</option>
                    <option value="tutor">Tutor</option>
                    <option value="office_assistant">Office Assistant</option>
                    <option value="digital_marketing">Digital Marketing</option>
                    <option value="content_writer">Content Writer</option>
                    <option value="graphic_designer">Graphic Designer</option>
                    <option value="video_editor">Video Editor</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the job role and responsibilities..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <select value={formData.job_type} onChange={(e) => setFormData({...formData, job_type: e.target.value})}>
                    <option value="part_time">Part Time</option>
                    <option value="weekend">Weekend</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    <option value="omr">OMR</option>
                    <option value="sholinganallur">Sholinganallur</option>
                    <option value="velachery">Velachery</option>
                    <option value="guindy">Guindy</option>
                    <option value="tambaram">Tambaram</option>
                    <option value="t_nagar">T. Nagar</option>
                    <option value="adyar">Adyar</option>
                    <option value="anna_nagar">Anna Nagar</option>
                    <option value="porur">Porur</option>
                    <option value="perungudi">Perungudi</option>
                    <option value="ambattur">Ambattur</option>
                    <option value="medavakkam">Medavakkam</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Salary (₹)</label>
                  <input type="number" value={formData.salary_min} onChange={(e) => setFormData({...formData, salary_min: e.target.value})} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label>Max Salary (₹)</label>
                  <input type="number" value={formData.salary_max} onChange={(e) => setFormData({...formData, salary_max: e.target.value})} placeholder="15000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience Required</label>
                  <input type="text" value={formData.experience_required} onChange={(e) => setFormData({...formData, experience_required: e.target.value})} placeholder="0-1 years" />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="date" value={formData.application_deadline} onChange={(e) => setFormData({...formData, application_deadline: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input type="text" value={formData.skills_required} onChange={(e) => setFormData({...formData, skills_required: e.target.value})} placeholder="Excel, Communication, Tamil, English" />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => { setShowCreateModal(false); setEditingJob(null); }}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
