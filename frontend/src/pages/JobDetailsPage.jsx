import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI, profilesAPI } from '../services/api';
import { useAuthStore } from '../store';
import './JobDetailsPage.css';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.getJobDetails(id);
      setJob(res.data.data || res.data);
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setApplying(true);
    try {
      await applicationsAPI.createApplication({ job_id: id, cover_letter: coverLetter }, user.id);
      setApplied(true);
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (saved) {
        await profilesAPI.unsaveJob(id, user.id);
        setSaved(false);
      } else {
        await profilesAPI.saveJob(id, user.id);
        setSaved(true);
      }
    } catch (err) {
      console.error('Save job failed:', err);
    }
  };

  if (loading) return <div className="job-details-loading">Loading job details...</div>;
  if (error && !job) return <div className="job-details-error">{error}</div>;
  if (!job) return <div className="job-details-error">Job not found</div>;

  return (
    <div className="job-details-page">
      <div className="job-details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="job-details-grid">
          {/* Main Content */}
          <div className="job-main">
            <div className="job-header-section">
              <div className="job-title-row">
                <h1>{job.title}</h1>
                <span className="job-type-tag">{job.job_type}</span>
              </div>
              <p className="job-company">{job.employer_name || 'Company'}</p>
              <div className="job-meta">
                <span>📍 {job.location || 'Chennai'}</span>
                <span>📁 {job.category}</span>
                {job.experience_required && <span>💼 {job.experience_required}</span>}
              </div>
              {(job.salary_min || job.salary_max) && (
                <div className="job-salary-range">
                  ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()} {job.salary_currency || 'INR'}
                </div>
              )}
            </div>

            <div className="job-section">
              <h2>Description</h2>
              <p className="job-description-text">{job.description}</p>
            </div>

            {job.skills_required && job.skills_required.length > 0 && (
              <div className="job-section">
                <h2>Skills Required</h2>
                <div className="skills-list">
                  {job.skills_required.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {job.application_deadline && (
              <div className="job-section">
                <h2>Application Deadline</h2>
                <p>{new Date(job.application_deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}

            <div className="job-actions">
              {applied ? (
                <button className="applied-btn" disabled>✓ Applied</button>
              ) : (
                <button className="apply-btn" onClick={() => user ? setShowApplyModal(true) : navigate('/login')}>
                  Apply Now
                </button>
              )}
              <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                {saved ? '★ Saved' : '☆ Save Job'}
              </button>
            </div>

            {error && <div className="job-error-msg">{error}</div>}
          </div>

          {/* Sidebar */}
          <div className="job-sidebar">
            <div className="sidebar-card">
              <h3>Job Summary</h3>
              <div className="summary-item"><strong>Type:</strong> {job.job_type}</div>
              <div className="summary-item"><strong>Category:</strong> {job.category}</div>
              <div className="summary-item"><strong>Location:</strong> {job.location}</div>
              <div className="summary-item"><strong>Applications:</strong> {job.applications_count || 0}</div>
              <div className="summary-item"><strong>Status:</strong> {job.is_active ? '🟢 Active' : '🔴 Closed'}</div>
              {job.created_at && (
                <div className="summary-item"><strong>Posted:</strong> {new Date(job.created_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for {job.title}</h2>
            <div className="modal-form">
              <label>Cover Letter (Optional)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief cover letter explaining why you're a good fit..."
                rows={6}
              />
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={handleApply} disabled={applying}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;
