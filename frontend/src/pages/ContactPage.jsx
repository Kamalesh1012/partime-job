import React, { useState } from 'react';
import './ContactPage.css';

export default function ContactPage() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@sewaa.in';

  const [activeTab, setActiveTab] = useState('contact'); // 'contact' | 'terms' | 'privacy' | 'community'
  const [formData, setFormData] = useState({
    fullName: '',
    phoneOrEmail: '',
    inquiryType: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ fullName: '', phoneOrEmail: '', inquiryType: 'general', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-page-container">
      <div className="contact-card">
        {/* Header */}
        <div className="contact-header">
          <img src="/sewaa-logo.png" alt="SEWAA Logo" className="contact-logo" />
          <h1>SEWAA Help & Legal Center</h1>
          <p>Assistance, platform policies, user protection, and compliance standards across India.</p>
        </div>

        {/* Legal & Help Tabs */}
        <div className="contact-tabs-row">
          <button
            className={`c-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            ✉️ Contact Support
          </button>
          <button
            className={`c-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            📄 Terms of Service
          </button>
          <button
            className={`c-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            🛡️ Privacy Policy (DPDP)
          </button>
          <button
            className={`c-tab-btn ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            🤝 Community Guidelines
          </button>
        </div>

        {activeTab === 'contact' && (
          <div className="contact-grid-body">
            {/* Info Column */}
            <div className="contact-info-col">
              <div className="info-block">
                <span className="info-icon">📍</span>
                <div>
                  <strong>Pan-India Platform</strong>
                  <p>Serving all 28 States & 8 Union Territories</p>
                </div>
              </div>

              <div className="info-block">
                <span className="info-icon">✉️</span>
                <div>
                  <strong>Official Support Desk</strong>
                  <p><a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
                </div>
              </div>

              <div className="info-block">
                <span className="info-icon">⏱️</span>
                <div>
                  <strong>Assistance Hours</strong>
                  <p>Monday - Sunday (8:00 AM - 9:00 PM IST)</p>
                </div>
              </div>

              <div className="info-block">
                <span className="info-icon">🔧</span>
                <div>
                  <strong>Technician Verification</strong>
                  <p>Partner onboarding and credential verification</p>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="contact-form-col">
              {submitted ? (
                <div className="contact-success-banner">
                  <span className="chk-icon">✅</span>
                  <h3>Thank you for reaching out!</h3>
                  <p>Our team has received your message and will respond within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-actual-form">
                  <label>
                    <span>Your Full Name:</span>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Mobile Number or Email:</span>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210 or name@example.com"
                      value={formData.phoneOrEmail}
                      onChange={(e) => setFormData({ ...formData, phoneOrEmail: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Inquiry Category:</span>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    >
                      <option value="general">General Support / Inquiry</option>
                      <option value="worker">Worker & Gig Shift Help</option>
                      <option value="technician">Technician Verification & Onboarding</option>
                      <option value="employer">Employer / Job Posting Inquiry</option>
                      <option value="customer">Doorstep Service Booking Query</option>
                      <option value="privacy">Data Privacy & Account Request</option>
                    </select>
                  </label>

                  <label>
                    <span>Your Message:</span>
                    <textarea
                      required
                      rows="4"
                      placeholder="How can we assist you?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </label>

                  <button type="submit" className="contact-submit-btn">
                    Send Message to SEWAA →
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="legal-doc-container">
            <h2>SEWAA Terms of Service</h2>
            <p className="effective-date">Last Updated: August 2026</p>
            <section className="legal-section">
              <h3>1. Platform Purpose</h3>
              <p>
                SEWAA provides a digital marketplace connecting part-time workers, technicians, and local service professionals with employers and customers across India. SEWAA operates as an intermediary facilitator.
              </p>
            </section>
            <section className="legal-section">
              <h3>2. Fair Work & Transparent Pay</h3>
              <p>
                Employers agree to fulfill committed wages on time. Workers agree to perform scheduled shifts with punctuality, professional conduct, and adherence to safety protocols.
              </p>
            </section>
            <section className="legal-section">
              <h3>3. Doorstep Service Bookings</h3>
              <p>
                Service rates and inspection charges must be transparently communicated before work initiation. Cancellations must be made at least 1 hour prior to scheduled arrival.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="legal-doc-container">
            <h2>SEWAA Privacy Policy & DPDP Standards</h2>
            <p className="effective-date">Last Updated: August 2026</p>
            <section className="legal-section">
              <h3>1. Data Minimization & Consent</h3>
              <p>
                In compliance with Indian Digital Personal Data Protection (DPDP) principles, SEWAA collects only information strictly necessary for job matching, safety tracking, and communication.
              </p>
            </section>
            <section className="legal-section">
              <h3>2. Identity Verification & Masked Aadhaar</h3>
              <p>
                SEWAA does not store raw 12-digit Aadhaar numbers, biometric data, or sensitive government credentials on public servers. Masked identification numbers (e.g. XXXX-XXXX-1234) are used solely with explicit user consent.
              </p>
            </section>
            <section className="legal-section">
              <h3>3. Right to Erasure</h3>
              <p>
                Users have the full right to delete their accounts and request complete erasure of all profile data, applications, and logs from our records via the Profile &gt; Privacy section.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="legal-doc-container">
            <h2>Community Guidelines & Safety Standard</h2>
            <p className="effective-date">Last Updated: August 2026</p>
            <section className="legal-section">
              <h3>1. Mutual Respect & Zero Tolerance for Discrimination</h3>
              <p>
                SEWAA promotes equal opportunity regardless of gender, caste, religion, or background. Harassment, abuse, or unsafe work environments will result in permanent account suspension.
              </p>
            </section>
            <section className="legal-section">
              <h3>2. Anti-Fraud & Authentic Postings</h3>
              <p>
                Posting fake jobs, demanding upfront fees from job seekers, or misrepresenting credentials is strictly prohibited and reported to local authorities.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
