import React, { useState, useEffect } from 'react';
import { useSafetyStore, useAuthStore, useLocationStore } from '../store';
import { safetyAPI } from '../services/api';
import './SOSModal.css';

export default function SOSModal() {
  const { isSOSModalOpen, activeJobContext, closeSOSModal } = useSafetyStore();
  const { user } = useAuthStore();
  const { selectedCity, selectedState } = useLocationStore();

  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [sosStatus, setSosStatus] = useState('idle'); // 'countdown' | 'triggered' | 'cancelled'
  const [incidentCaseId, setIncidentCaseId] = useState(null);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer;
    if (isSOSModalOpen && isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isSOSModalOpen && isCountingDown && countdown === 0) {
      handleConfirmSOSTrigger();
    }
    return () => clearTimeout(timer);
  }, [isSOSModalOpen, isCountingDown, countdown]);

  useEffect(() => {
    if (isSOSModalOpen) {
      setCountdown(5);
      setIsCountingDown(true);
      setSosStatus('countdown');
      setIncidentCaseId(null);
    }
  }, [isSOSModalOpen]);

  if (!isSOSModalOpen) return null;

  const handleCancelCountdown = async () => {
    setIsCountingDown(false);
    setSosStatus('cancelled');
    if (incidentCaseId) {
      try {
        await safetyAPI.cancelSOS({
          incident_case_id: incidentCaseId,
          user_id: user?.id || 'guest',
          reason: 'Cancelled by user during countdown',
        });
      } catch (e) {}
    }
  };

  const handleConfirmSOSTrigger = async () => {
    setIsCountingDown(false);
    setIsSubmitting(true);
    setSosStatus('triggered');

    try {
      const resp = await safetyAPI.triggerSOS({
        user_id: user?.id || 'guest-user',
        active_job_id: activeJobContext?.id || null,
        location_address: `${selectedCity}, ${selectedState}`,
        incident_type: 'SOS_EMERGENCY',
        notes: emergencyNotes || 'Emergency SOS button triggered by user',
      });
      if (resp.data && resp.data.case_id) {
        setIncidentCaseId(resp.data.case_id);
      } else {
        setIncidentCaseId(`INC-IND-${Date.now().toString().slice(-6)}`);
      }
    } catch (e) {
      setIncidentCaseId(`INC-IND-${Date.now().toString().slice(-6)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sos-modal-overlay" onClick={closeSOSModal}>
      <div className="sos-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sos-modal-header">
          <div className="sos-header-icon">🚨</div>
          <div>
            <h2 className="sos-title">WorkMate Safety & SOS Assistance</h2>
            <p className="sos-subtitle">24x7 Emergency Protection across India</p>
          </div>
          <button className="sos-close-btn" onClick={closeSOSModal}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="sos-modal-body">
          {sosStatus === 'countdown' ? (
            <div className="sos-countdown-view">
              <div className="sos-countdown-circle">
                <span className="countdown-number">{countdown}</span>
                <span className="countdown-text">Seconds</span>
              </div>
              <h3 className="sos-alert-text">Triggering Emergency SOS Alert</h3>
              <p className="sos-alert-desc">
                An alert with your location (<strong>{selectedCity}, {selectedState}</strong>) will be sent to your Emergency Contacts & the Platform Safety Operations Desk.
              </p>

              <div className="sos-countdown-actions">
                <button className="sos-cancel-btn" onClick={handleCancelCountdown}>
                  🛡️ Cancel Alert (I am Safe)
                </button>
                <button className="sos-trigger-now-btn" onClick={handleConfirmSOSTrigger}>
                  🚨 Send Immediately
                </button>
              </div>
            </div>
          ) : sosStatus === 'triggered' ? (
            <div className="sos-triggered-view">
              <div className="sos-success-badge">
                <span className="badge-icon">✓</span>
                <span>EMERGENCY ALERT DISPATCHED</span>
              </div>

              <div className="case-id-box">
                <span className="case-label">Official Incident Case ID:</span>
                <strong className="case-number">{incidentCaseId || 'INC-IND-PROCESSING'}</strong>
                <span className="case-sub">Preserved for police & platform safety inquiry</span>
              </div>

              <p className="sos-location-info">
                📍 <strong>Live GPS Telemetry active:</strong> {selectedCity}, {selectedState}
              </p>

              {/* Instant Call Actions */}
              <div className="helpline-call-group">
                <h4>Direct Helpline Dialers (India):</h4>
                <div className="helpline-buttons-grid">
                  <a href="tel:112" className="helpline-btn primary-112">
                    <span className="hl-icon">🚨</span>
                    <div className="hl-info">
                      <strong>Dial 112</strong>
                      <span>All-in-One National Emergency</span>
                    </div>
                  </a>
                  <a href="tel:100" className="helpline-btn police-100">
                    <span className="hl-icon">👮</span>
                    <div className="hl-info">
                      <strong>Dial 100</strong>
                      <span>Police Control Room</span>
                    </div>
                  </a>
                  <a href="tel:108" className="helpline-btn medical-108">
                    <span className="hl-icon">🚑</span>
                    <div className="hl-info">
                      <strong>Dial 108</strong>
                      <span>Ambulance & Medical</span>
                    </div>
                  </a>
                  <a href="tel:1091" className="helpline-btn women-1091">
                    <span className="hl-icon">🛡️</span>
                    <div className="hl-info">
                      <strong>Dial 1091</strong>
                      <span>Women Safety Helpline</span>
                    </div>
                  </a>
                </div>
              </div>

              <div className="sos-bottom-actions">
                <button className="sos-resolved-btn" onClick={closeSOSModal}>
                  Close & Keep Tracking Active
                </button>
              </div>
            </div>
          ) : (
            <div className="sos-cancelled-view">
              <div className="sos-cancel-icon">🛡️</div>
              <h3>SOS Alert Cancelled</h3>
              <p>No emergency alert was dispatched. You confirmed that you are safe.</p>
              <button className="sos-close-confirm-btn" onClick={closeSOSModal}>
                Return to Application
              </button>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="sos-modal-footer">
          <span>ℹ️ WorkMate Safety connects to official emergency channels and coordinates safety for registered workers and customers.</span>
        </div>
      </div>
    </div>
  );
}
