import { useEffect, useState } from 'react';
import { adminAPI, jobsAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, employersRes, jobsRes] = await Promise.allSettled([
        adminAPI.getAnalytics(),
        adminAPI.getUnverifiedEmployers(),
        jobsAPI.getJobs({ limit: 20 })
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
    } catch (err) {
      setError('Failed to remove job');
    }
  };

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Platform management and analytics</p>
        </div>

        {error && <div className="admin-error">{error} <button onClick={() => setError('')}>✕</button></div>}

        {/* Analytics Cards */}
        <div className="admin-analytics">
          <div className="analytics-card">
            <div className="analytics-icon">👥</div>
            <div className="analytics-value">{analytics?.total_users || 0}</div>
            <div className="analytics-label">Total Users</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">💼</div>
            <div className="analytics-value">{analytics?.total_jobs || 0}</div>
            <div className="analytics-label">Total Jobs</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">📄</div>
            <div className="analytics-value">{analytics?.total_applications || 0}</div>
            <div className="analytics-label">Applications</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">🏢</div>
            <div className="analytics-value">{analytics?.total_employers || 0}</div>
            <div className="analytics-label">Employers</div>
          </div>
        </div>

        {/* Unverified Employers */}
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
                    <button className="reject-action-btn" onClick={() => handleVerify(emp.id)}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="admin-section">
          <h2>Recent Job Postings</h2>
          {recentJobs.length === 0 ? (
            <div className="admin-empty">No jobs found</div>
          ) : (
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
                      <td>{job.location}</td>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
