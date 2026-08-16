import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || '';

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section footer-about-col">
          <div className="footer-brand-row">
            <img src="/sewaa-logo.png" alt="SEWAA Logo" className="footer-sewaa-logo" />
            <div>
              <h3 className="footer-brand-title">SEWAA</h3>
              <span className="footer-brand-sub">Part-Time Jobs & Local Services</span>
            </div>
          </div>
          <p className="footer-about-text">
            SEWAA connects workers, technicians, customers, and local businesses across India through flexible work opportunities and trusted local services. Find part-time work, temporary opportunities, event jobs, daily wage work, and skilled technicians near you.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">in</a>
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">📸</a>
            ) : (
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📸</a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/events">Events & Gigs</Link></li>
            <li><Link to="/services">Local Services</Link></li>
            <li><Link to="/activity">Live Activity</Link></li>
            <li><Link to="/login">Sign In</Link></li>
          </ul>
        </div>

        {/* For Workers */}
        <div className="footer-section">
          <h3>For Workers</h3>
          <ul>
            <li><Link to="/events">Find Jobs</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* For Customers */}
        <div className="footer-section">
          <h3>For Customers</h3>
          <ul>
            <li><Link to="/employer-dashboard">Post a Job</Link></li>
            <li><Link to="/services">Find Technician</Link></li>
            <li><Link to="/contact">Support</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3>Support & Legal</h3>
          <ul>
            <li><Link to="/contact">Help & Contact</Link></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} SEWAA. All rights reserved.</p>
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
