import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSafetyStore } from '../store';
import { activeJobsAPI, applicationsAPI, servicesAPI, safetyAPI, notificationsAPI } from '../services/api';
import LiveTrackingMap from '../components/LiveTrackingMap';
import './ActivityPage.css';

export default function ActivityPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openSOSModal } = useSafetyStore();

  const [activeTab, setActiveTab] = useState('active_jobs'); // 'active_jobs' | 'applications' | 'services' | 'notifications' | 'incidents'
  const [activeJobs, setActiveJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock initial active job for demo/live tracking
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
    const userId = user?.id || 'demo-worker';

    try {
      const [ajRes, appRes, srRes, notifRes, incRes] = await Promise.allSettled([
        activeJobsAPI.getUserActiveJobs(userId),
        applicationsAPI.getStudentApplications(userId),
        servicesAPI.getCustomerRequests(userId),
        notificationsAPI.getNotifications(userId),
        safetyAPI.getUserIncidents(userId),
      ]);

      const fetchedJobs = ajRes.status === 'fulfilled' ? ajRes.value.data?.data || [] : [];
      setActiveJobs(fetchedJobs.length > 0 ? fetchedJobs : [defaultDemoActiveJob]);

      if (appRes.status === 'fulfilled') setApplications(appRes.value.data?.data || []);
      if (srRes.status === 'fulfilled') setServiceRequests(srRes.value.data?.data || []);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data?.data || []);
      if (incRes.status === 'fulfilled') setIncidents(incRes.value.data?.data || []);
    } catch (e) {
      console.error('Error fetching activity data:', e);
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
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, current_status: nextStatus } : j))
      );
    }
  };

  const handleCancelServiceBooking = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this doorstep service request?')) return;
    try {
      await servicesAPI.updateRequestStatus(requestId, 'cancelled');
      setServiceRequests((prev) =>
        prev.map((sr) => (sr.id === requestId ? { ...sr, status: 'cancelled' } : sr))
      );
    } catch (e) {
      setServiceRequests((prev) =>
        prev.map((sr) => (sr.id === requestId ? { ...sr, status: 'cancelled' } : sr))
      );
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await notificationsAPI.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (e) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead(user?.id || 'demo-worker');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const getStepProgressIndex = (status) => {
    const map = { accepted: 0, on_the_way: 1, arrived: 2, work_started: 3, work_completed: 4 };
    return map[status] ?? 0;
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="activity-page-container">
      <header className="activity-header">
        <h1>Activity & Engagement Hub</h1>
        <p>Real-time active gig tracking, job application statuses, doorstep services, and notifications.</p>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="activity-tabs-bar">
        <button
          className={`act-tab-btn ${activeTab === 'active_jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('active_jobs')}
        >
          ⚡ Live Gigs ({activeJobs.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Applications ({applications.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🔧 Service Bookings ({serviceRequests.length})
        </button>
        <button
          className={`act-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications {unreadNotifsCount > 0 && <span className="tab-unread-pill">{unreadNotifsCount}</span>}
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
          /* TAB 1: Live Active Gigs */
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

                  {/* Interactive Live Doorstep Tracking Map */}
                  <LiveTrackingMap
                    jobTitle={aj.job_title}
                    destinationAddress={aj.location_address}
                    status={aj.current_status}
                  />

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
        ) : activeTab === 'applications' ? (
          /* TAB 2: Job Applications */
          <div className="applications-activity-list">
            {applications.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">💼</span>
                <h4>No job applications submitted yet</h4>
                <p>Explore part-time shifts and daily wage gigs near your area.</p>
                <button className="act-cta-btn" onClick={() => navigate('/jobs')}>
                  Find Part-Time Jobs →
                </button>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="app-item-card">
                  <div className="app-header">
                    <div>
                      <h4>{app.job_title || `Job Application #${app.job_id}`}</h4>
                      <p className="app-company">🏢 {app.company_name || 'SEWAA Employer'}</p>
                    </div>
                    <span className={`status-pill ${app.status || 'applied'}`}>
                      {(app.status || 'applied').toUpperCase()}
                    </span>
                  </div>
                  <div className="app-meta-row">
                    <span>📍 {app.location_display || 'Chennai'}</span>
                    <span>💰 {app.salary_display || 'Daily Payout'}</span>
                    <span>📅 Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                  {app.cover_letter && (
                    <p className="app-cover-note">💬 Note: "{app.cover_letter}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'services' ? (
          /* TAB 3: Service Bookings */
          <div className="services-activity-list">
            {serviceRequests.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">🔧</span>
                <h4>No doorstep technician bookings yet</h4>
                <p>Book verified electricians, plumbers, AC mechanics, or cleaners in your city.</p>
                <button className="act-cta-btn" onClick={() => navigate('/services')}>
                  Explore Doorstep Services →
                </button>
              </div>
            ) : (
              serviceRequests.map((sr) => (
                <div key={sr.id} className="sr-item-card">
                  <div className="sr-header">
                    <h4>{sr.service_title || 'Doorstep Service Booking'}</h4>
                    <span className={`status-pill ${sr.status}`}>{sr.status.toUpperCase()}</span>
                  </div>
                  <p className="sr-desc"><strong>Problem / Request:</strong> {sr.problem_description}</p>
                  <div className="sr-meta">
                    <span>📅 Scheduled: {sr.preferred_date} ({sr.preferred_time_slot})</span>
                    <span>📍 {sr.service_address}</span>
                    <span>💵 ₹{sr.estimated_cost} Visiting Charge</span>
                  </div>
                  {sr.status !== 'cancelled' && sr.status !== 'completed' && (
                    <div className="sr-actions-row">
                      <button
                        className="sr-cancel-btn"
                        onClick={() => handleCancelServiceBooking(sr.id)}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'notifications' ? (
          /* TAB 4: Notifications Center */
          <div className="notifications-activity-list">
            <div className="notif-actions-header">
              <span className="notif-total-text">
                {notifications.length} Alerts ({unreadNotifsCount} unread)
              </span>
              {unreadNotifsCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllNotificationsRead}
                >
                  ✓ Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">🔔</span>
                <h4>No notifications yet</h4>
                <p>You'll receive instant alerts when employers review your applications or bookings are confirmed.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleMarkNotificationRead(notif.id)}
                >
                  <div className="notif-card-header">
                    <h4>{notif.title}</h4>
                    <span className="notif-time">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="notif-message">{notif.message}</p>
                  {!notif.is_read && <span className="unread-dot-badge">● New</span>}
                </div>
              ))
            )}
          </div>
        ) : (
          /* TAB 5: Safety Cases */
          <div className="incidents-activity-list">
            {incidents.length === 0 ? (
              <div className="empty-act-box">
                <span className="empty-icon">🛡️</span>
                <h4>All Clear: 0 Safety Incidents</h4>
                <p>Your active shifts are protected under 24x7 SEWAA emergency monitoring.</p>
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
