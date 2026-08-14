import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useApplicationStore } from '../store';
import { applicationsAPI, jobsAPI } from '../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    shortlisted: 0,
    saved: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch applications
      const appRes = await applicationsAPI.getStudentApplications(user?.id);
      setApplications(appRes.data.data || []);
      
      // Fetch recommended jobs
      const jobsRes = await jobsAPI.getJobs({ limit: 5 });
      setRecommendedJobs(jobsRes.data.data || []);
      
      // Calculate stats
      setStats({
        totalApplications: appRes.data.total || 0,
        shortlisted: (appRes.data.data || []).filter(a => a.status === 'shortlisted').length,
        saved: 0, // Fetch from saved jobs API
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard student-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Welcome back, {user?.full_name}! 👋</h1>
          <p>Your job search dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalApplications}</div>
            <div className="stat-label">Applications Submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.shortlisted}</div>
            <div className="stat-label">Shortlisted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.saved}</div>
            <div className="stat-label">Saved Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">85%</div>
            <div className="stat-label">Profile Complete</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/')}>
            🔍 Find Jobs
          </button>
          <button className="action-btn" onClick={() => navigate('/profile')}>
            👤 Edit Profile
          </button>
          <button className="action-btn" onClick={() => navigate('/profile')}>
            🖼️ Upload Photo
          </button>
          <button className="action-btn" onClick={() => navigate('/')}>
            ⭐ Saved Jobs
          </button>
        </div>

        {/* Recent Applications */}
        <section className="dashboard-section">
          <h2>Recent Applications</h2>
          <div className="applications-table">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.job_id}</td>
                      <td>Company Name</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${app.status}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-link">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No applications yet. Start exploring jobs!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recommended Jobs */}
        <section className="dashboard-section">
          <h2>Recommended for You</h2>
          <div className="jobs-preview">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="job-preview">
                <h3>{job.title}</h3>
                <p className="job-location">📍 {job.location}</p>
                <p className="job-salary">₹{job.salary_min} - ₹{job.salary_max}</p>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  View Job
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications Preview */}
        <section className="dashboard-section">
          <h2>Notifications</h2>
          <div className="notifications-list">
            <div className="notification-item">
              <span className="notification-title">Application Viewed</span>
              <span className="notification-time">2 hours ago</span>
            </div>
            <div className="notification-item">
              <span className="notification-title">New Job Match Found</span>
              <span className="notification-time">1 day ago</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
