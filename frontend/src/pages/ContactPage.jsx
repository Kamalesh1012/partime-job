import React, { useState } from 'react';
import './ContactPage.css';

export default function ContactPage() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@sewaa.in';

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
          <h1>Contact SEWAA India</h1>
          <p>We're here to help workers, technicians, employers, and customers across India.</p>
        </div>

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
                <strong>Support Email</strong>
                <p><a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
              </div>
            </div>

            <div className="info-block">
              <span className="info-icon">⏱️</span>
              <div>
                <strong>Customer Assistance</strong>
                <p>Monday - Sunday (8:00 AM - 9:00 PM IST)</p>
              </div>
            </div>

            <div className="info-block">
              <span className="info-icon">🔧</span>
              <div>
                <strong>Technician Onboarding</strong>
                <p>Register as a certified service professional</p>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="contact-form-col">
            {submitted ? (
              <div className="contact-success-banner">
                <span className="chk-icon">✅</span>
                <h3>Thank you for contacting SEWAA!</h3>
                <p>Our team has received your message and will get back to you within 24 hours.</p>
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
                  <span>Inquiry Type:</span>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  >
                    <option value="general">General Support / Help</option>
                    <option value="worker">Worker & Gig Assistance</option>
                    <option value="technician">Technician Verification & Onboarding</option>
                    <option value="employer">Hire Workers / Post Job</option>
                    <option value="customer">Home Service Request Query</option>
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
      </div>
    </div>
  );
}
