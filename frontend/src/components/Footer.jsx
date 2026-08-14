import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>About WorkMate</h3>
          <p>
            WorkMate Chennai connects students, freshers, and job seekers with verified
            part-time, weekend, internship, freelance, and temporary job opportunities in Chennai.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="Instagram">📷</a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/">Browse Jobs</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>

        {/* For Students */}
        <div className="footer-section">
          <h3>For Students</h3>
          <ul>
            <li><a href="#find-jobs">Find Jobs</a></li>
            <li><a href="#apply">Apply to Jobs</a></li>
            <li><a href="#profile">Build Profile</a></li>
            <li><a href="#tips">Interview Tips</a></li>
          </ul>
        </div>

        {/* For Employers */}
        <div className="footer-section">
          <h3>For Employers</h3>
          <ul>
            <li><a href="#post-job">Post a Job</a></li>
            <li><a href="#manage">Manage Applicants</a></li>
            <li><a href="#hire">Hiring Tools</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3>Support</h3>
          <ul>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} WorkMate Chennai. All rights reserved.</p>
        <div className="footer-links">
          <a href="#terms">Terms of Service</a>
          <span> | </span>
          <a href="#privacy">Privacy Policy</a>
          <span> | </span>
          <a href="#cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
