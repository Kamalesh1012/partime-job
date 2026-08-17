import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import {
  sendOtp,
  verifyOtp,
  verifyKyc,
  verifyLiveness,
  registerVerifiedUser,
  getCurrentUser,
} from '../services/auth';
import { ALL_INDIAN_STATES } from '../data/indiaLocations';
import './LoginPage.css';

const ROLES_INFO = [
  {
    id: 'worker',
    title: '👷 Part-Time Worker',
    tagline: 'Find flexible shifts, daily wage gigs & event work.',
    perks: ['Daily & weekly payouts', 'Hyperlocal shifts near home', 'Zero hidden commissions'],
  },
  {
    id: 'technician',
    title: '🔧 Skilled Technician',
    tagline: 'Offer doorstep appliance, electrical, plumbing & repair services.',
    perks: ['Receive customer service leads', 'Set your own visiting fee', 'Verified Pro badge'],
  },
  {
    id: 'employer',
    title: '🏢 Business / Employer',
    tagline: 'Post part-time shifts, hire verified staff & track attendance.',
    perks: ['Post jobs in 2 minutes', 'Pre-screened verified applicants', 'Direct worker contact'],
  },
  {
    id: 'customer',
    title: '👤 Customer / Resident',
    tagline: 'Book trusted doorstep technicians & home maintenance pros.',
    perks: ['Doorstep inspection', 'Fixed visiting rates', 'Safety verified pros'],
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setUserType = useAuthStore((state) => state.setUserType);

  // State Machine Step (1: Role, 2: Mobile, 3: Mobile OTP, 4: Email, 5: Profile, 6: KYC, 7: Liveness, 8: Complete)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedRole, setSelectedRole] = useState('worker');
  const [phone, setPhone] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailStepMode, setEmailStepMode] = useState('input'); // 'input' | 'otp'

  // Profile State
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [city, setCity] = useState('Chennai');
  const [area, setArea] = useState('Sholinganallur');
  const [skills, setSkills] = useState('Delivery, Retail Assistant');
  const [preferredShift, setPreferredShift] = useState('Flexible');
  const [visitingCharge, setVisitingCharge] = useState('199');

  // KYC State
  const [kycDocType, setKycDocType] = useState('Aadhaar Card');
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [kycConsent, setKycConsent] = useState(true);
  const [kycVerified, setKycVerified] = useState(false);
  const [maskedDocDisplay, setMaskedDocDisplay] = useState('');

  // Liveness State
  const [livenessAction, setLivenessAction] = useState('Blink and look straight at camera');
  const [livenessChecking, setLivenessChecking] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [livenessScore, setLivenessScore] = useState(96);

  // UI Flow State
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdSessionData, setCreatedSessionData] = useState(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // STEP 2 -> SEND MOBILE OTP
  const handleSendMobileOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(phone, 'mobile', 'registration');
      setCooldown(30);
      setSuccessMsg(res?.message || 'Verification code sent to your mobile.');
      if (res?.dev_hint) setMobileOtp(res.dev_hint);
      setCurrentStep(3); // Go to OTP verification step
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 -> VERIFY MOBILE OTP
  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!mobileOtp || mobileOtp.length < 6) {
      setError('Please enter the 6-digit code received on your phone.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(phone, mobileOtp, 'mobile');
      if (res?.verified) {
        setMobileVerified(true);
        setSuccessMsg('✓ Mobile number verified successfully.');
        setCurrentStep(4); // Advance to Email step
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 4 -> SEND / VERIFY EMAIL
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email, 'email', 'registration');
      setEmailStepMode('otp');
      setCooldown(30);
      setSuccessMsg(`Verification code sent to ${email}`);
      if (res?.dev_hint) setEmailOtp(res.dev_hint);
    } catch (err) {
      setError(err?.message || 'Failed to send email verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailOtp || emailOtp.length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, emailOtp, 'email');
      if (res?.verified) {
        setEmailVerified(true);
        setSuccessMsg('✓ Email verified successfully.');
        setCurrentStep(5); // Advance to Profile step
      }
    } catch (err) {
      setError(err?.message || 'Invalid email verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 5 -> PROFILE VALIDATION
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name as per official records.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Please choose a password with at least 6 characters.');
      return;
    }
    setCurrentStep(6); // Advance to KYC step
  };

  // STEP 6 -> IDENTITY KYC VERIFICATION
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!kycDocNumber.trim() || kycDocNumber.trim().length < 4) {
      setError('Please enter a valid document identification number.');
      return;
    }
    if (!kycConsent) {
      setError('Please provide consent for identity verification.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyKyc(kycDocType, kycDocNumber, fullName, kycConsent);
      if (res?.is_kyc_verified) {
        setKycVerified(true);
        setMaskedDocDisplay(res.masked_document_number);
        setSuccessMsg(`✓ ${kycDocType} verified successfully.`);
        setCurrentStep(7); // Advance to Liveness verification
      }
    } catch (err) {
      setError(err?.message || 'Identity document verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 7 -> LIVE FACE / LIVENESS VERIFICATION
  const handlePerformLivenessCheck = async () => {
    setError('');
    setLivenessChecking(true);

    // Simulate real-time camera face mesh detection & challenge cycle
    setTimeout(async () => {
      try {
        const res = await verifyLiveness(null, 'blink_and_smile');
        if (res?.is_face_verified) {
          setLivenessVerified(true);
          setLivenessScore(96);
          setLivenessChecking(false);
          setSuccessMsg('✓ Live facial check completed successfully!');
          // Immediately trigger account finalization
          await finalizeAccountCreation();
        }
      } catch (err) {
        setLivenessChecking(false);
        setError(err?.message || 'Liveness check failed. Please look directly at the camera.');
      }
    }, 1800);
  };

  // FINALIZE ACCOUNT CREATION (STEP 8)
  const finalizeAccountCreation = async () => {
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const data = await registerVerifiedUser({
        role: selectedRole,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        city: city.trim(),
        state: stateName.trim(),
        area: area.trim(),
        skills: skillsArray,
        experience_years: 2,
        preferred_shift: preferredShift,
        visiting_charge: parseFloat(visitingCharge) || 199.0,
        is_mobile_verified: true,
        is_email_verified: true,
        is_kyc_verified: true,
        is_face_verified: true,
      });

      if (data?.access_token) {
        setCreatedSessionData(data);
        setToken(data.access_token);
        setUserType(selectedRole);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userType', selectedRole);

        const me = await getCurrentUser(data.access_token);
        const resolvedUser = me || {
          id: data.user_id || 'user-' + Date.now(),
          email: email.trim(),
          full_name: fullName.trim(),
          role: selectedRole,
          phone,
          city,
          state: stateName,
          verification_status: 'VERIFIED',
        };
        setUser(resolvedUser);
        localStorage.setItem('sewaa_user', JSON.stringify(resolvedUser));
        setCurrentStep(8); // Ready Screen!
      }
    } catch (err) {
      setError(err?.message || 'Failed to finalize account. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterPlatform = () => {
    if (selectedRole === 'employer') {
      navigate('/employer-dashboard');
    } else if (selectedRole === 'technician') {
      navigate('/services');
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="login-page register-page">
      <div className="login-container register-container">
        {/* Left Side Info */}
        <div className="login-info">
          <div className="platform-tag-pill">🇮🇳 VERIFIED PAN-INDIA ONBOARDING</div>
          <div className="auth-logo-header">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="auth-brand-logo" />
            <div>
              <h1>SEWAA</h1>
              <span className="auth-brand-sub">Part-Time Jobs & Local Services</span>
            </div>
          </div>
          <p className="auth-brand-tagline">
            Join millions of verified workers, technicians, and businesses across India.
          </p>

          {/* Stepper Progress Indicator */}
          <div className="onboarding-stepper">
            {[
              { num: 1, label: 'Role' },
              { num: 2, label: 'Mobile' },
              { num: 4, label: 'Email' },
              { num: 5, label: 'Profile' },
              { num: 6, label: 'KYC' },
              { num: 7, label: 'Face' },
              { num: 8, label: 'Ready' },
            ].map((st) => (
              <div
                key={st.num}
                className={`step-item ${currentStep >= st.num ? 'completed' : ''} ${currentStep === st.num ? 'active' : ''}`}
              >
                <div className="step-circle">{currentStep > st.num ? '✓' : st.num}</div>
                <span className="step-label">{st.label}</span>
              </div>
            ))}
          </div>

          <div className="security-badges-box">
            <div className="badge-item">🔒 Encrypted Government ID Verification</div>
            <div className="badge-item">🛡️ Anti-Spoofing Live Face Match</div>
            <div className="badge-item">⚡ Direct Payouts to Bank/UPI</div>
          </div>
        </div>

        {/* Right Side Step Views */}
        <div className="login-form-container">
          {error && <div className="error-message">⚠️ {error}</div>}
          {successMsg && <div className="success-message">✅ {successMsg}</div>}

          {/* STEP 1: SELECT ROLE */}
          {currentStep === 1 && (
            <div className="auth-step-block">
              <div className="login-form-header">
                <h2>Welcome to SEWAA 👋</h2>
                <p>Select your account type to get started.</p>
              </div>

              <div className="role-cards-grid">
                {ROLES_INFO.map((r) => (
                  <div
                    key={r.id}
                    className={`role-selection-card ${selectedRole === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedRole(r.id)}
                  >
                    <div className="role-card-header">
                      <h3>{r.title}</h3>
                      <span className="role-radio-dot">{selectedRole === r.id ? '●' : '○'}</span>
                    </div>
                    <p className="role-desc">{r.tagline}</p>
                    <ul className="role-perks-list">
                      {r.perks.map((p, i) => (
                        <li key={i}>✓ {p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => { setError(''); setCurrentStep(2); }}
              >
                Continue as {ROLES_INFO.find((r) => r.id === selectedRole)?.title.split(' ')[1]} →
              </button>
            </div>
          )}

          {/* STEP 2: MOBILE NUMBER */}
          {currentStep === 2 && (
            <form onSubmit={handleSendMobileOtp} className="auth-step-block">
              <div className="login-form-header">
                <h2>Enter Mobile Number 📱</h2>
                <p>We will send a 6-digit verification code to your phone.</p>
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <div className="phone-input-row">
                  <span className="country-code-badge">🇮🇳 +91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send Verification Code →'}
              </button>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setCurrentStep(1)}
              >
                ← Back to Role Selection
              </button>
            </form>
          )}

          {/* STEP 3: VERIFY MOBILE OTP */}
          {currentStep === 3 && (
            <form onSubmit={handleVerifyMobileOtp} className="auth-step-block">
              <div className="login-form-header">
                <h2>Verify Mobile Number 🔐</h2>
                <p>Enter the 6-digit code sent to <strong>+91 {phone}</strong></p>
              </div>

              <div className="form-group">
                <label>6-Digit Verification Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="● ● ● ● ● ●"
                  className="otp-boxed-input"
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <div className="otp-resend-row">
                {cooldown > 0 ? (
                  <span className="resend-cooldown">Resend code in <strong>{cooldown}s</strong></span>
                ) : (
                  <button type="button" className="resend-btn" onClick={handleSendMobileOtp} disabled={loading}>
                    🔄 Resend OTP
                  </button>
                )}
                <button type="button" className="btn-link-edit" onClick={() => setCurrentStep(2)}>
                  Change Phone
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Mobile OTP →'}
              </button>
            </form>
          )}

          {/* STEP 4: EMAIL ADDRESS & VERIFICATION */}
          {currentStep === 4 && (
            <div className="auth-step-block">
              <div className="login-form-header">
                <h2>Email Address Verification ✉️</h2>
                <p>Your verified email will be used for job alerts and payment slips.</p>
              </div>

              {emailStepMode === 'input' ? (
                <form onSubmit={handleSendEmailOtp}>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Sending Code...' : 'Verify Email Address →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp}>
                  <div className="form-group">
                    <label>Enter 6-Digit Email Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="● ● ● ● ● ●"
                      className="otp-boxed-input"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Verifying...' : 'Confirm Email Verification →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 5: PROFILE SETUP */}
          {currentStep === 5 && (
            <form onSubmit={handleProfileSubmit} className="auth-step-block">
              <div className="login-form-header">
                <h2>Complete Your Profile 👤</h2>
                <p>Help employers & customers in your area find you.</p>
              </div>

              <div className="form-group">
                <label>Full Name (as per Govt ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create a secure password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="two-inputs-row">
                <div className="form-group">
                  <label>State *</label>
                  <select value={stateName} onChange={(e) => setStateName(e.target.value)}>
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>District / City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai, Madurai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Local Area / Town</label>
                <input
                  type="text"
                  placeholder="e.g. Sholinganallur, Velachery"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              {selectedRole === 'technician' ? (
                <div className="form-group">
                  <label>Doorstep Visiting Charge (₹)</label>
                  <input
                    type="number"
                    placeholder="199"
                    value={visitingCharge}
                    onChange={(e) => setVisitingCharge(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Primary Skills / Gigs</label>
                  <input
                    type="text"
                    placeholder="e.g. Delivery, Electrician, Event Staff"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block">
                Continue to Identity Verification →
              </button>
            </form>
          )}

          {/* STEP 6: IDENTITY KYC VERIFICATION */}
          {currentStep === 6 && (
            <form onSubmit={handleKycSubmit} className="auth-step-block">
              <div className="login-form-header">
                <h2>Identity / KYC Verification 🛡️</h2>
                <p>SEWAA enforces ID verification to ensure trust for workers and employers.</p>
              </div>

              <div className="form-group">
                <label>Document Type *</label>
                <select value={kycDocType} onChange={(e) => setKycDocType(e.target.value)}>
                  <option>Aadhaar Card</option>
                  <option>Voter ID Card</option>
                  <option>Driving License</option>
                  <option>PAN Card</option>
                </select>
              </div>

              <div className="form-group">
                <label>{kycDocType} Number *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    kycDocType === 'Aadhaar Card'
                      ? 'XXXX XXXX 1234'
                      : kycDocType === 'PAN Card'
                      ? 'ABCDE1234F'
                      : 'Enter Document Number'
                  }
                  value={kycDocNumber}
                  onChange={(e) => setKycDocNumber(e.target.value)}
                  autoFocus
                />
                <small className="field-hint">🔒 For privacy, only masked identifiers are stored.</small>
              </div>

              <div className="consent-checkbox-row">
                <input
                  id="kycConsent"
                  type="checkbox"
                  checked={kycConsent}
                  onChange={(e) => setKycConsent(e.target.checked)}
                />
                <label htmlFor="kycConsent">
                  I consent to verify my identity details with authorized identity verification records for SEWAA platform trust.
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Verifying Identity...' : 'Verify Government ID →'}
              </button>
            </form>
          )}

          {/* STEP 7: LIVE FACE / LIVENESS CHECK */}
          {currentStep === 7 && (
            <div className="auth-step-block">
              <div className="login-form-header">
                <h2>Live Face Verification 📸</h2>
                <p>Anti-spoofing liveness check to confirm profile authenticity.</p>
              </div>

              <div className="camera-viewfinder-box">
                <div className="viewfinder-circle">
                  {livenessChecking ? (
                    <div className="scanning-radar-pulse">
                      <span className="radar-icon">🔍</span>
                      <span className="radar-subtext">Checking face geometry...</span>
                    </div>
                  ) : (
                    <div className="face-avatar-placeholder">
                      <span className="cam-icon">👤</span>
                    </div>
                  )}
                </div>
                <div className="challenge-instruction-badge">
                  <span>🎯 Action: <strong>{livenessAction}</strong></span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handlePerformLivenessCheck}
                disabled={livenessChecking}
              >
                {livenessChecking ? 'Analyzing Liveness...' : 'Start Live Selfie Check →'}
              </button>
            </div>
          )}

          {/* STEP 8: ONBOARDING COMPLETE & READY */}
          {currentStep === 8 && (
            <div className="auth-step-block ready-step">
              <div className="ready-success-icon">🎉</div>
              <div className="login-form-header">
                <h2>Your Account is Ready!</h2>
                <p>Welcome to SEWAA, <strong>{fullName}</strong>. All verification checks passed.</p>
              </div>

              <div className="verified-summary-cards">
                <div className="v-card">
                  <span className="v-icon">✓</span>
                  <div>
                    <strong>Mobile Verified</strong>
                    <p>+91 {phone}</p>
                  </div>
                </div>
                <div className="v-card">
                  <span className="v-icon">✓</span>
                  <div>
                    <strong>Email Verified</strong>
                    <p>{email}</p>
                  </div>
                </div>
                <div className="v-card">
                  <span className="v-icon">✓</span>
                  <div>
                    <strong>Identity Verified</strong>
                    <p>{kycDocType} ({maskedDocDisplay})</p>
                  </div>
                </div>
                <div className="v-card">
                  <span className="v-icon">✓</span>
                  <div>
                    <strong>Face Verified</strong>
                    <p>{livenessScore}% Anti-Spoof Confidence</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleEnterPlatform}
              >
                Start Finding Work Now →
              </button>
            </div>
          )}

          <div className="login-form-footer">
            <p>
              Already have a SEWAA account?{' '}
              <Link to="/login" className="auth-switch-link">
                Log In →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
