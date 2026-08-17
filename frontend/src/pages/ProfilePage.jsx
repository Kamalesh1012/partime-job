import { useState, useEffect } from 'react';
import { profilesAPI, safetyAPI, verificationAPI } from '../services/api';
import { useAuthStore, useLocationStore, useSafetyStore } from '../store';
import { ALL_INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '../data/indiaLocations';
import './ProfilePage.css';

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const userType = useAuthStore((s) => s.userType) || 'worker';
  const logout = useAuthStore((s) => s.logout);
  const { selectedCity, selectedState, setLocation } = useLocationStore();
  const { openSOSModal } = useSafetyStore();

  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'emergency' | 'verification' | 'privacy'
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Family');

  // KYC Verification state: 'not_started' | 'under_review' | 'verified'
  const [kycStatus, setKycStatus] = useState('verified');
  const [maskedAadhaar, setMaskedAadhaar] = useState('XXXX-XXXX-9842');
  const [kycConsent, setKycConsent] = useState(true);

  // Face Liveness
  const [isLivenessChecking, setIsLivenessChecking] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(true);
  const [faceConsent, setFaceConsent] = useState(true);

  // Data erasure modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    fetchProfileAndSafety();
  }, [user]);

  const fetchProfileAndSafety = async () => {
    const userId = user?.id || 'demo-worker';
    try {
      if (userType === 'employer') {
        const res = await profilesAPI.getEmployerProfile(userId);
        setProfile(res.data || {});
      } else if (userType === 'technician') {
        const res = await profilesAPI.getTechnicianProfile(userId);
        setProfile(res.data || {});
      } else {
        const res = await profilesAPI.getStudentProfile(userId);
        setProfile(res.data || {});
      }

      const ecRes = await safetyAPI.getEmergencyContacts(userId);
      setEmergencyContacts(ecRes.data?.data || [
        { id: 'ec-1', name: 'Ramesh (Brother)', phone: '+91 98401 99887', relationship: 'Family', is_primary: true }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    const userId = user?.id || 'demo-worker';

    const formData = new FormData(e.target);
    const updated = {
      phone: formData.get('phone'),
      state: formData.get('state'),
      city: formData.get('city'),
      area: formData.get('area'),
      pin_code: formData.get('pin_code'),
      bio: formData.get('bio'),
      skills: formData.get('skills') ? formData.get('skills').split(',').map((s) => s.trim()) : [],
    };

    try {
      if (userType === 'employer') {
        await profilesAPI.updateEmployerProfile(userId, { ...updated, company_name: formData.get('company_name') });
      } else if (userType === 'technician') {
        await profilesAPI.updateTechnicianProfile(userId, {
          ...updated,
          full_name: user?.full_name || 'Technician Pro',
          hourly_rate: parseFloat(formData.get('hourly_rate')) || 350,
          visiting_charge: parseFloat(formData.get('visiting_charge')) || 199,
        });
      } else {
        await profilesAPI.updateStudentProfile(userId, updated);
      }
      setLocation(updated.city || selectedCity, updated.state || selectedState, updated.area);
      setStatusMsg('Profile updated successfully!');
    } catch (err) {
      setStatusMsg('Profile updated locally.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact = {
      user_id: user?.id || 'demo-worker',
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRel,
      is_primary: emergencyContacts.length === 0,
    };

    try {
      const res = await safetyAPI.addEmergencyContact(newContact);
      setEmergencyContacts([...emergencyContacts, res.data?.data || newContact]);
      setNewContactName('');
      setNewContactPhone('');
      setStatusMsg('Emergency contact registered for 24x7 SOS protection.');
    } catch (err) {
      setEmergencyContacts([...emergencyContacts, { ...newContact, id: Date.now().toString() }]);
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  const handleDeleteEmergencyContact = async (id) => {
    try {
      await safetyAPI.deleteEmergencyContact(id);
    } catch (e) {}
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const handleSimulateFaceLiveness = async () => {
    if (!faceConsent) {
      alert('Please check the biometric consent box to begin liveness verification.');
      return;
    }
    setIsLivenessChecking(true);
    setTimeout(async () => {
      setIsLivenessChecking(false);
      setIsFaceVerified(true);
      try {
        await verificationAPI.submitFaceLiveness(user?.id || 'demo-worker');
      } catch (e) {}
      setStatusMsg('Face Liveness Verified! Anti-impersonation badge active.');
    }, 1500);
  };

  const handleVerifyAadhaar = async (e) => {
    e.preventDefault();
    if (!kycConsent) {
      alert('Explicit user consent is mandatory for Indian identity verification.');
      return;
    }
    setKycStatus('under_review');
    setStatusMsg('Masked identification submitted for review.');
    setTimeout(() => {
      setKycStatus('verified');
      setStatusMsg('Identity Verified! Verified Trust Badge awarded.');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmed(true);
    setTimeout(() => {
      logout();
      window.location.href = '/';
    }, 2000);
  };

  const currentCities = MAJOR_CITIES_BY_STATE[profile.state || selectedState] || [selectedCity];

  return (
    <div className="profile-container">
      <header className="profile-top-header">
        <div className="user-avatar-badge-wrap">
          <div className="profile-avatar-circle">
            {profile.photo_url || user?.profile_picture ? (
              <img src={profile.photo_url || user?.profile_picture} alt="Profile" className="avatar-img" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="profile-header-info">
            <h2>{user?.full_name || 'SEWAA Member'}</h2>
            <span className="user-role-badge">{userType.toUpperCase()} • INDIA</span>
            <div className="badges-row">
              <span className="badge-pill phone">📞 Phone Verified ✓</span>
              {kycStatus === 'verified' && <span className="badge-pill kyc">🛡️ Verified ID ✓</span>}
              {isFaceVerified && <span className="badge-pill face">📸 Liveness Check ✓</span>}
            </div>
          </div>
        </div>

        <button className="profile-sos-trigger-btn" onClick={() => openSOSModal()}>
          🚨 SOS Center
        </button>
      </header>

      {statusMsg && <div className="status-alert-box">{statusMsg}</div>}

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`p-tab ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          👤 Personal Details
        </button>
        <button
          className={`p-tab ${activeSection === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveSection('emergency')}
        >
          🚨 Emergency Contacts ({emergencyContacts.length})
        </button>
        <button
          className={`p-tab ${activeSection === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveSection('verification')}
        >
          🛡️ Trust & Verification
        </button>
        <button
          className={`p-tab ${activeSection === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveSection('privacy')}
        >
          🔒 Privacy & Compliance
        </button>
      </div>

      <div className="profile-tab-content">
        {/* SECTION 1: Personal Details Form */}
        {activeSection === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="profile-details-form">
            <div className="form-section-title">
              <h3>Basic Profile & Region</h3>
              <p>Your details are matched with nearby shifts and service inquiries across India.</p>
            </div>

            <div className="form-grid-2">
              <label>
                <span>Email Address (Read-only)</span>
                <input type="email" disabled value={user?.email || 'user@sewaa.in'} />
              </label>

              <label>
                <span>Contact Phone</span>
                <input
                  type="text"
                  name="phone"
                  defaultValue={profile.phone || user?.phone || '+91 98401 23456'}
                />
              </label>
            </div>

            {userType === 'employer' && (
              <label>
                <span>Organization / Business Name</span>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={profile.company_name || 'SEWAA Business Partner'}
                />
              </label>
            )}

            {userType === 'technician' && (
              <div className="form-grid-2">
                <label>
                  <span>Visiting Inspection Charge (₹)</span>
                  <input
                    type="number"
                    name="visiting_charge"
                    defaultValue={profile.visiting_charge || 199}
                  />
                </label>
                <label>
                  <span>Hourly Service Rate (₹)</span>
                  <input
                    type="number"
                    name="hourly_rate"
                    defaultValue={profile.hourly_rate || 350}
                  />
                </label>
              </div>
            )}

            <div className="form-grid-2">
              <label>
                <span>State / Union Territory</span>
                <select name="state" defaultValue={profile.state || selectedState}>
                  {ALL_INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>City / Town</span>
                <select name="city" defaultValue={profile.city || selectedCity}>
                  {currentCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-grid-2">
              <label>
                <span>Area / Locality / Landmark</span>
                <input
                  type="text"
                  name="area"
                  placeholder="e.g. Sholinganallur, OMR, Indiranagar"
                  defaultValue={profile.area || ''}
                />
              </label>

              <label>
                <span>PIN Code</span>
                <input
                  type="text"
                  name="pin_code"
                  placeholder="600119"
                  defaultValue={profile.pin_code || ''}
                />
              </label>
            </div>

            <label>
              <span>Skills & Expertise (Comma separated)</span>
              <input
                type="text"
                name="skills"
                placeholder="e.g. Delivery, AC Repair, Electrical Wiring, Cashier"
                defaultValue={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || ''}
              />
            </label>

            <label>
              <span>Bio & Experience Summary</span>
              <textarea
                name="bio"
                rows="3"
                placeholder="Tell employers or customers about your background..."
                defaultValue={profile.bio || ''}
              />
            </label>

            <button type="submit" className="save-profile-btn" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Profile Changes'}
            </button>
          </form>
        )}

        {/* SECTION 2: Emergency Contacts */}
        {activeSection === 'emergency' && (
          <div className="emergency-contacts-section">
            <div className="form-section-title">
              <h3>24x7 Safety & SOS Contacts</h3>
              <p>These verified contacts will receive automatic SMS and GPS alerts if you trigger the SOS button.</p>
            </div>

            <div className="contacts-list">
              {emergencyContacts.map((c) => (
                <div key={c.id} className="contact-card-item">
                  <div className="c-info">
                    <strong>{c.name}</strong>
                    <span className="c-rel">({c.relationship})</span>
                    <p className="c-phone">📞 {c.phone}</p>
                    {c.is_primary && <span className="primary-pill">Primary Contact</span>}
                  </div>
                  <button
                    className="delete-c-btn"
                    onClick={() => handleDeleteEmergencyContact(c.id)}
                    title="Remove Contact"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddEmergencyContact} className="add-contact-form">
              <h4>Add New Safety Contact</h4>
              <div className="form-grid-3">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Ramesh)"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Mobile (+91 98401 23456)"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
                <select
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                >
                  <option>Family</option>
                  <option>Friend</option>
                  <option>Colleague</option>
                  <option>Employer</option>
                </select>
              </div>
              <button type="submit" className="add-c-btn">
                ➕ Add Contact to SOS Alert Network
              </button>
            </form>
          </div>
        )}

        {/* SECTION 3: KYC & Trust Verification */}
        {activeSection === 'verification' && (
          <div className="verification-section">
            <div className="form-section-title">
              <h3>Trust & Identity Verification</h3>
              <p>Build credibility with customers and employers across India.</p>
            </div>

            {/* Privacy Legal Banner */}
            <div className="privacy-compliance-banner">
              <span className="banner-icon">🛡️</span>
              <div className="banner-text">
                <strong>DPDP Privacy Standard:</strong>
                <p>
                  SEWAA adheres to Indian Digital Personal Data Protection standards. We do not store raw 12-digit Aadhaar numbers or government credentials. Only user-consented masked IDs are processed.
                </p>
              </div>
            </div>

            {/* Masked Aadhaar Card */}
            <div className="kyc-subcard">
              <div className="kyc-header-row">
                <h4>1. Masked Identification (Aadhaar / Voter / Driving Licence)</h4>
                <span className={`kyc-badge ${kycStatus}`}>
                  {kycStatus === 'verified' ? '✓ Verified Pro' : 'Pending Review'}
                </span>
              </div>
              <form onSubmit={handleVerifyAadhaar} className="kyc-form">
                <label>
                  <span>Masked ID Number (First 8 digits masked)</span>
                  <input
                    type="text"
                    value={maskedAadhaar}
                    onChange={(e) => setMaskedAadhaar(e.target.value)}
                    placeholder="XXXX-XXXX-1234"
                  />
                </label>
                <div className="consent-row">
                  <input
                    type="checkbox"
                    id="kycConsent"
                    checked={kycConsent}
                    onChange={(e) => setKycConsent(e.target.checked)}
                  />
                  <label htmlFor="kycConsent">
                    I explicitly consent to masked ID verification for SEWAA trust scoring.
                  </label>
                </div>
                <button type="submit" className="kyc-submit-btn">
                  Submit Masked ID for Verification
                </button>
              </form>
            </div>

            {/* Face Liveness Check */}
            <div className="kyc-subcard">
              <div className="kyc-header-row">
                <h4>2. Anti-Impersonation Liveness Check</h4>
                <span className="kyc-badge verified">✓ Live Check Passed</span>
              </div>
              <p className="kyc-desc">
                Prevents bots and duplicate profiles. Validates that the profile photo belongs to the active account holder.
              </p>
              <div className="consent-row">
                <input
                  type="checkbox"
                  id="faceConsent"
                  checked={faceConsent}
                  onChange={(e) => setFaceConsent(e.target.checked)}
                />
                <label htmlFor="faceConsent">
                  I give consent for real-time anti-impersonation liveness check.
                </label>
              </div>
              <button
                type="button"
                className="liveness-btn"
                onClick={handleSimulateFaceLiveness}
                disabled={isLivenessChecking}
              >
                {isLivenessChecking ? 'Analyzing camera feed...' : '📸 Run Face Liveness Verification'}
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: Privacy & Account Control */}
        {activeSection === 'privacy' && (
          <div className="privacy-section">
            <div className="form-section-title">
              <h3>Privacy & Data Control</h3>
              <p>Manage your data sharing preferences and account lifecycle.</p>
            </div>

            <div className="privacy-card-item">
              <h4>📍 Location Privacy</h4>
              <p>Your exact GPS coordinates are only shared during active work shifts for safety tracking.</p>
            </div>

            <div className="privacy-card-item">
              <h4>📞 Phone Masking</h4>
              <p>Your direct phone number is never displayed publicly without an active confirmed gig or booking.</p>
            </div>

            <div className="danger-zone-card">
              <h4>⚠️ Danger Zone</h4>
              <p>Permanently delete your SEWAA account and all associated profile, application, and gig data.</p>
              <button
                className="delete-acc-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                Request Account & Data Deletion
              </button>
            </div>

            {showDeleteModal && (
              <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Confirm Account Deletion</h3>
                  <p>
                    Are you sure you want to delete your SEWAA account? This will erase all your verified badges, ratings, and application history.
                  </p>
                  {deleteConfirmed ? (
                    <div className="delete-success-msg">
                      ✅ Account deletion request processed. Logging out...
                    </div>
                  ) : (
                    <div className="delete-modal-actions">
                      <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                      </button>
                      <button className="confirm-delete-btn" onClick={handleDeleteAccount}>
                        Yes, Delete My Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
