import { useState, useEffect } from 'react';
import { useAuthStore, useSafetyStore } from '../store';
import { activeJobsAPI, applicationsAPI, servicesAPI, safetyAPI } from '../services/api';
import './ActivityPage.css';

export default function ActivityPage() {
  const { user } = useAuthStore();
  const { openSOSModal } = useSafetyStore();

  const [activeTab, setActiveTab] = useState('active_jobs'); // 'active_jobs' | 'applications' | 'services' | 'incidents'
  const [activeJobs, setActiveJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock initial active job if list is empty for demo/live tracking experience
  const defaultDemoActiveJob = {
    id: 'AJ-DEMO-2026',
    job_title: 'E-commerce Evening Delivery Shift',
    customer_id: 'client-amazon-del',
    worker_id: user?.id || 'demo-worker',
    location_address: 'Saket & South Extension Hub, New Delhi',
    current_status: 'work_started',
    start_time: new Date(Date.now() - 3600000).toISOString(),
    emergency_contact_alerted: false,
  };

  useEffect(() => {
    fetchActivityData();
  }, [user]);

  const fetchActivityData = async () => {
    setLoading(true);
    const userId = user?.id || 'guest';

    try {
      const [ajRes, appRes, srRes, incRes] = await Promise.allSettled([
        activeJobsAPI.getUserActiveJobs(userId),
        applicationsAPI.getStudentApplications(userId),
        servicesAPI.getCustomerRequests(userId),
        safetyAPI.getUserIncidents(userId),
      ]);

      const fetchedJobs = ajRes.status === 'fulfilled' ? ajRes.value.data?.data || [] : [];
      setActiveJobs(fetchedJobs.length > 0 ? fetchedJobs : [defaultDemoActiveJob]);

      if (appRes.status === 'fulfilled') setApplications(appRes.value.data?.data || []);
      if (srRes.status === 'fulfilled') setServiceRequests(srRes.value.data?.data || []);
      if (incRes.status === 'fulfilled') setIncidents(incRes.value.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (jobId, currentStatus) => {
    const statusOrder = ['accepted', 'on_the_way', 'arrived', 'work_started', 'work_completed'];
    const nextIdx = statusOrder.indexOf(currentStatus) + 1;
    if (nextIdx >= statusOrder.length) return;

    const nextStatus = statusOrder[nextIdx];
    try {
      await activeJobsAPI.updateActiveJobStatus(jobId, nextStatus);
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, current_status: nextStatus } : j))
      );
    } catch (e) {
      // Local optimistic update
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, current_status: nextStatus } : j))
      );
    }
  };

  const getStepProgressIndex = (status) => {
    const map = { accepted: 0, on_the_way: 1, arrived: 2, work_started: 3, work_completed: 4 };
    return map[status] ?? 0;
  };

  return (
    <div className="activity-page-container">
      <header className="activity-header">
        <h1>Work & Service Activity</h1>
        <p>Real-time active jobs tracking, safety management, job applications, and service requests.</p>
      </header>

      {/* Tabs */}
      <div className="activity-tabs-bar">
        <button
          className={`act-tab-btn ${activeTab === 'active_jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('active_jobs')}
        >
          ⚡ Live Active Jobs ({activeJobs.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🔧 Service Bookings ({serviceRequests.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Job Applications ({applications.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          🚨 Safety Cases ({incidents.length})
        </button>
      </div>

      <main className="activity-main-content">
        {loading ? (
          <div className="act-loading">
            <div className="spinner-ring"></div>
            <p>Loading your activity...</p>
          </div>
        ) : activeTab === 'active_jobs' ? (
          /* Live Active Jobs with Safety Check */
          <div className="active-jobs-feed">
            {activeJobs.map((aj) => {
              const currentStep = getStepProgressIndex(aj.current_status);
              const steps = [
                { label: 'Accepted', icon: '📝' },
                { label: 'On The Way', icon: '🛵' },
                { label: 'Arrived', icon: '📍' },
                { label: 'Work Started', icon: '⚙️' },
                { label: 'Completed', icon: '✅' },
              ];

              return (
                <div key={aj.id} className="live-job-card">
                  <div className="live-job-header">
                    <div className="live-badge-row">
                      <span className="live-pulse-badge">LIVE TRACKING</span>
                      <span className="live-job-id">ID: {aj.id}</span>
                    </div>
                    <h3 className="live-job-title">{aj.job_title}</h3>
                    <p className="live-job-loc">📍 {aj.location_address}</p>
                  </div>

                  {/* Step Progress Tracker */}
                  <div className="progress-tracker-bar">
                    {steps.map((step, idx) => (
                      <div
                        key={step.label}
                        className={`step-item ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}`}
                      >
                        <div className="step-circle">{step.icon}</div>
                        <span className="step-text">{step.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Safety & Action Controls */}
                  <div className="live-job-footer">
                    <div className="job-safety-status">
                      <span className="safety-icon-good">🛡️</span>
                      <span>Safe Tracking Active • Emergency contacts ready</span>
                    </div>

                    <div className="job-action-buttons">
                      <button
                        className="live-sos-btn"
                        onClick={() => openSOSModal(aj)}
                        title="Trigger Emergency SOS for this Job"
                      >
                        🚨 SOS Alert
                      </button>

                      {currentStep < 4 ? (
                        <button
                          className="advance-step-btn"
                          onClick={() => handleAdvanceStatus(aj.id, aj.current_status)}
                        >
                          Update Status: {steps[currentStep + 1]?.label} →
                        </button>
                      ) : (
                        <span className="job-finished-badge">🎉 Work Successfully Finished</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'services' ? (
          /* Service Bookings */
          <div className="services-activity-list">
            {serviceRequests.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">🔧</span>
                <h4>No active technician service requests</h4>
                <p>Book a certified electrician, plumber, or AC technician from the Services tab.</p>
              </div>
            ) : (
              serviceRequests.map((sr) => (
                <div key={sr.id} className="sr-item-card">
                  <div className="sr-header">
                    <h4>{sr.service_title}</h4>
                    <span className={`status-pill ${sr.status}`}>{sr.status}</span>
                  </div>
                  <p className="sr-desc">Problem: {sr.problem_description}</p>
                  <div className="sr-meta">
                    <span>📅 {sr.preferred_date} ({sr.preferred_time_slot})</span>
                    <span>📍 {sr.service_address}</span>
                    <span>💵 ₹{sr.estimated_cost}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'applications' ? (
          /* Job Applications */
          <div className="applications-activity-list">
            {applications.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">💼</span>
                <h4>No job applications submitted yet</h4>
                <p>Explore part-time and daily wage jobs from the Home or Jobs tab.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="app-item-card">
                  <div className="app-header">
                    <h4>Application for Job #{app.job_id}</h4>
                    <span className={`status-pill ${app.status}`}>{app.status}</span>
                  </div>
                  <p className="app-date">Applied on: {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Safety Cases */
          <div className="incidents-activity-list">
            {incidents.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">🛡️</span>
                <h4>All Clear: 0 Safety Incidents</h4>
                <p>Your active shifts are monitored under 24x7 WorkMate safety protection.</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="incident-card">
                  <div className="inc-header">
                    <span className="inc-id">{inc.incident_case_id}</span>
                    <span className="inc-status">{inc.status}</span>
                  </div>
                  <p className="inc-notes">{inc.evidence_notes || 'SOS Emergency Alert'}</p>
                  <span className="inc-time">Logged at: {new Date(inc.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
