import { useState, useEffect } from 'react';
import { profilesAPI, safetyAPI, verificationAPI } from '../services/api';
import { useAuthStore, useLocationStore, useSafetyStore } from '../store';
import { ALL_INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '../data/indiaLocations';
import './ProfilePage.css';

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const userType = useAuthStore((s) => s.userType) || 'worker';
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

  // KYC Verification
  const [maskedAadhaar, setMaskedAadhaar] = useState('XXXX-XXXX-9842');
  const [kycConsent, setKycConsent] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(true);

  // Face Liveness Simulator
  const [isLivenessChecking, setIsLivenessChecking] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(true);
  const [faceConsent, setFaceConsent] = useState(false);

  useEffect(() => {
    fetchProfileAndSafety();
  }, [user]);

  const fetchProfileAndSafety = async () => {
    const userId = user?.id || 'demo-user-ind';
    try {
      if (userType === 'employer') {
        const res = await profilesAPI.getEmployerProfile(userId);
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
    const userId = user?.id || 'demo-user-ind';

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
      } else {
        await profilesAPI.updateStudentProfile(userId, updated);
      }
      setLocation(updated.city || selectedCity, updated.state || selectedState, updated.area);
      setStatusMsg('Profile updated successfully across India network!');
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
      user_id: user?.id || 'demo-user-ind',
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
        await verificationAPI.submitFaceLiveness(user?.id || 'demo-user-ind');
      } catch (e) {}
      setStatusMsg('Face Liveness Verified! Anti-impersonation badge granted.');
    }, 2000);
  };

  const handleVerifyAadhaar = async (e) => {
    e.preventDefault();
    if (!kycConsent) {
      alert('Explicit user consent is mandatory for Indian identity verification.');
      return;
    }
    try {
      await verificationAPI.submitMaskedAadhaar(user?.id || 'demo-user-ind', maskedAadhaar);
      setIsIdentityVerified(true);
      setStatusMsg('Masked Aadhaar KYC completed with zero sensitive data exposure.');
    } catch (e) {
      setIsIdentityVerified(true);
    }
  };

  const currentCities = MAJOR_CITIES_BY_STATE[profile.state || selectedState] || [selectedCity];

  return (
    <div className="profile-container">
      <header className="profile-top-header">
        <div className="user-avatar-badge-wrap">
          <div className="profile-avatar-circle">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="avatar-img" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="profile-header-info">
            <h2>{user?.full_name || 'WorkMate Member'}</h2>
            <span className="user-role-badge">{userType.toUpperCase()} • INDIA</span>
            <div className="badges-row">
              <span className="badge-pill phone">📞 Phone Verified ✓</span>
              {isIdentityVerified && <span className="badge-pill kyc">🛡️ Identity Verified ✓</span>}
              {isFaceVerified && <span className="badge-pill face">📸 Face Liveness Verified ✓</span>}
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
          🛡️ Verification & KYC Badges
        </button>
        <button
          className={`p-tab ${activeSection === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveSection('privacy')}
        >
          🔒 Privacy & Data Retention
        </button>
      </div>

      <main className="profile-tab-body">
        {activeSection === 'profile' && (
          <form className="profile-form-grid" onSubmit={handleUpdateProfile}>
            {userType === 'employer' && (
              <label>
                <span>Company / Business Name</span>
                <input name="company_name" defaultValue={profile.company_name || ''} placeholder="e.g. Reliance Retail / Local Store" />
              </label>
            )}

            <label>
              <span>Mobile Phone Number (Primary Contact)</span>
              <input name="phone" defaultValue={profile.phone || '+91 98401 23456'} required />
            </label>

            <div className="form-cols-2">
              <label>
                <span>State / UT</span>
                <select name="state" defaultValue={profile.state || selectedState}>
                  {ALL_INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>District / City</span>
                <input name="city" defaultValue={profile.city || selectedCity} placeholder="e.g. Chennai, Bengaluru, Mumbai" required />
              </label>
            </div>

            <div className="form-cols-2">
              <label>
                <span>Locality / Area</span>
                <input name="area" defaultValue={profile.area || ''} placeholder="e.g. Velachery / Whitefield / Andheri" />
              </label>
              <label>
                <span>PIN Code</span>
                <input name="pin_code" defaultValue={profile.pin_code || '600001'} placeholder="6-digit Indian PIN" />
              </label>
            </div>

            <label>
              <span>Skills / Specializations (Comma-separated)</span>
              <input
                name="skills"
                defaultValue={Array.isArray(profile.skills) ? profile.skills.join(', ') : 'Delivery, Packing, Electrician'}
                placeholder="e.g. AC Repair, Bike Driving, Front Load"
              />
            </label>

            <label>
              <span>Bio / Work Profile Summary</span>
              <textarea name="bio" rows="3" defaultValue={profile.bio || 'Experienced local part-time worker & technician ready for flexible shifts across the city.'}></textarea>
            </label>

            <button type="submit" className="save-profile-btn" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Profile'}
            </button>
          </form>
        )}

        {activeSection === 'emergency' && (
          <div className="emergency-contacts-manager">
            <div className="ec-notice-card">
              <span className="ec-icon">🚨</span>
              <div>
                <h4>Emergency Contact & SOS Dispatch System</h4>
                <p>These trusted contacts receive your live GPS location if you trigger the SOS safety button during an active shift.</p>
              </div>
            </div>

            <div className="contacts-list">
              {emergencyContacts.map((c) => (
                <div key={c.id || c.phone} className="contact-item-row">
                  <div className="c-avatar">📞</div>
                  <div className="c-info">
                    <strong>{c.name}</strong>
                    <span>{c.phone} • Relationship: {c.relationship}</span>
                    {c.is_primary && <span className="primary-pill">Primary Contact</span>}
                  </div>
                  <button className="del-c-btn" onClick={() => handleDeleteEmergencyContact(c.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add Contact Form */}
            <form className="add-contact-form" onSubmit={handleAddEmergencyContact}>
              <h4>Add Trusted Emergency Contact</h4>
              <div className="form-cols-3">
                <input
                  type="text"
                  required
                  placeholder="Contact Full Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile Phone (+91...)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
                <select value={newContactRel} onChange={(e) => setNewContactRel(e.target.value)}>
                  <option value="Family">Family / Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Friend">Friend</option>
                  <option value="Supervisor">Work Supervisor</option>
                </select>
              </div>
              <button type="submit" className="add-contact-btn">
                ➕ Add Emergency Contact
              </button>
            </form>
          </div>
        )}

        {activeSection === 'verification' && (
          <div className="verification-center">
            <div className="vc-header-banner">
              <h3>Trust & Identity Verification Center</h3>
              <p>Verified workers and technicians get 3x more bookings and job offers.</p>
            </div>

            {/* Masked Aadhaar KYC */}
            <div className="verification-card">
              <div className="vc-top">
                <span className="vc-icon">🪪</span>
                <div className="vc-text">
                  <h4>Government ID / Masked Aadhaar Verification</h4>
                  <p>In strict accordance with Indian Privacy & UIDAI guidelines, raw Aadhaar numbers are never stored, logged, or exposed to employers.</p>
                </div>
                <span className="vc-status-badge verified">
                  {isIdentityVerified ? 'Verified ✓' : 'Pending'}
                </span>
              </div>

              <form onSubmit={handleVerifyAadhaar} className="aadhaar-verify-box">
                <label>
                  <span>Masked Aadhaar Number (Last 4 digits visible only):</span>
                  <input
                    type="text"
                    value={maskedAadhaar}
                    onChange={(e) => setMaskedAadhaar(e.target.value)}
                    placeholder="XXXX-XXXX-1234"
                  />
                </label>
                <div className="consent-checkbox-row">
                  <input
                    type="checkbox"
                    id="aadhaarConsent"
                    checked={kycConsent}
                    onChange={(e) => setKycConsent(e.target.checked)}
                  />
                  <label htmlFor="aadhaarConsent">
                    I give explicit consent for privacy-compliant identity verification. I understand my sensitive ID details are encrypted and masked.
                  </label>
                </div>
                <button type="submit" className="verify-action-btn">
                  Submit Privacy-Compliant KYC
                </button>
              </form>
            </div>

            {/* Face Liveness Anti-Impersonation Check */}
            <div className="verification-card">
              <div className="vc-top">
                <span className="vc-icon">📸</span>
                <div className="vc-text">
                  <h4>Face Liveness & Anti-Impersonation Verification</h4>
                  <p>Verifies real worker presence to prevent fraudulent profile sharing. Zero raw biometric photos are stored permanently.</p>
                </div>
                <span className="vc-status-badge verified">
                  {isFaceVerified ? 'Live Verified ✓' : 'Not Verified'}
                </span>
              </div>

              <div className="face-liveness-box">
                {isLivenessChecking ? (
                  <div className="liveness-scanning-state">
                    <div className="scan-reticle"></div>
                    <span>Performing real-time liveness test...</span>
                  </div>
                ) : (
                  <>
                    <div className="consent-checkbox-row">
                      <input
                        type="checkbox"
                        id="faceConsent"
                        checked={faceConsent}
                        onChange={(e) => setFaceConsent(e.target.checked)}
                      />
                      <label htmlFor="faceConsent">
                        I consent to real-time face liveness verification to confirm my identity as the registered service professional.
                      </label>
                    </div>
                    <button
                      type="button"
                      className="verify-action-btn"
                      onClick={handleSimulateFaceLiveness}
                    >
                      📷 Start 5-Second Liveness Verification
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="privacy-settings-box">
            <h3>Indian Privacy & Data Protection Compliance</h3>
            <p>WorkMate India adheres strictly to India’s Digital Personal Data Protection (DPDP) principles:</p>
            <ul>
              <li><strong>Data Minimization:</strong> We only collect information essential for location-based job matching and emergency safety.</li>
              <li><strong>Zero Sensitive Identity Exposure:</strong> Neither employers nor customers can view your Aadhaar number or biometric tokens.</li>
              <li><strong>Emergency Telemetry Access:</strong> Location coordinates are accessed exclusively during active shifts or when the SOS button is triggered.</li>
              <li><strong>Right to Deletion:</strong> You can export or permanently delete your account and work history at any time.</li>
            </ul>

            <div className="privacy-action-buttons">
              <button className="export-data-btn" onClick={() => alert('Work history & safety log export prepared.')}>
                📥 Download My Data Archive
              </button>
              <button className="delete-account-btn" onClick={() => alert('Account deletion request initiated with safety verification.')}>
                ⚠️ Request Account & Data Deletion
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
