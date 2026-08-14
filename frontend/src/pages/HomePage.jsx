import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const locations = [
    'OMR', 'Sholinganallur', 'Velachery', 'Guindy', 'Tambaram',
    'T Nagar', 'Adyar', 'Anna Nagar', 'Porur', 'Perungudi', 'Ambattur', 'Medavakkam'
  ];

  const categories = [
    { name: 'Data Entry', icon: '📊' },
    { name: 'Customer Support', icon: '🎧' },
    { name: 'Retail Sales', icon: '🛍️' },
    { name: 'Cafe Staff', icon: '☕' },
    { name: 'Restaurant Crew', icon: '🍽️' },
    { name: 'Event Staff', icon: '🎉' },
    { name: 'Delivery Partner', icon: '🚴' },
    { name: 'Tutor', icon: '📚' },
    { name: 'Content Writer', icon: '✍️' },
    { name: 'Graphic Designer', icon: '🎨' },
    { name: 'Video Editor', icon: '🎬' },
    { name: 'Digital Marketing', icon: '📱' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobsRes = await jobsAPI.getJobs({ limit: 10 });
      const trendingRes = await jobsAPI.getTrendingJobs(5);
      setJobs(jobsRes.data.data || []);
      setTrendingJobs(trendingRes.data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery) {
      try {
        const res = await jobsAPI.searchJobs(searchQuery);
        setJobs(res.data.data || []);
      } catch (error) {
        console.error('Error searching jobs:', error);
      }
    }
  };

  const handleCategoryClick = (category) => {
    navigate('/', { state: { selectedCategory: category.name } });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Part-Time Jobs in Chennai</h1>
          <p className="hero-subtitle">
            Connect with verified part-time, weekend, internship, and freelance opportunities
          </p>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search jobs, skills, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button className="search-btn" onClick={handleSearch}>
                🔍 Search
              </button>
            </div>

            {/* Location Filter */}
            <div className="location-filter">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="location-select"
              >
                <option value="">📍 All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/login?role=student')}>
              Find Jobs
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/login?role=employer')}>
              Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2>Popular Job Categories</h2>
          <div className="categories-grid">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="category-card"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="category-icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Jobs Section */}
      <section className="trending-section">
        <div className="container">
          <h2>🔥 Trending Jobs</h2>
          <div className="jobs-grid">
            {trendingJobs.map((job) => (
              <div key={job.id} className="job-card trending">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span className="job-type-badge">{job.job_type}</span>
                </div>
                <p className="job-location">📍 {job.location}</p>
                <p className="job-salary">
                  ₹{job.salary_min} - ₹{job.salary_max} {job.salary_currency}
                </p>
                <div className="job-tags">
                  {job.skills_required?.slice(0, 2).map((skill, idx) => (
                    <span key={idx} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
                <button className="btn btn-sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className="jobs-section">
        <div className="container">
          <h2>Latest Jobs</h2>
          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : jobs.length > 0 ? (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <span className="applications-count">
                      {job.applications_count} applications
                    </span>
                  </div>
                  <p className="job-location">📍 {job.location}</p>
                  <p className="job-salary">
                    ₹{job.salary_min} - ₹{job.salary_max}
                  </p>
                  <p className="job-description">{job.description.substring(0, 100)}...</p>
                  <div className="job-footer">
                    <span className="category-badge">{job.category}</span>
                    <button className="btn btn-sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-jobs">No jobs found</div>
          )}
        </div>
      </section>

      {/* Weekend Jobs Section */}
      <section className="weekend-section">
        <div className="container">
          <h2>⏰ Weekend Jobs</h2>
          <p>Flexible opportunities for your weekends</p>
          <button className="btn btn-primary" onClick={() => navigate('/login?role=student')}>
            Explore Weekend Jobs
          </button>
        </div>
      </section>

      {/* Internship Section */}
      <section className="internship-section">
        <div className="container">
          <h2>🎓 Internship Opportunities</h2>
          <p>Build your experience with leading companies in Chennai</p>
          <button className="btn btn-primary" onClick={() => navigate('/login?role=student')}>
            Find Internships
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>10,000+</h3>
              <p>Active Jobs</p>
            </div>
            <div className="stat-card">
              <h3>50,000+</h3>
              <p>Job Seekers</p>
            </div>
            <div className="stat-card">
              <h3>1,000+</h3>
              <p>Employers</p>
            </div>
            <div className="stat-card">
              <h3>95%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="success-stories-section">
        <div className="container">
          <h2>Success Stories</h2>
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-avatar">👨‍🎓</div>
              <h3>Rahul Kumar</h3>
              <p className="story-role">CS Student</p>
              <p className="story-text">
                &quot;Found my first freelance project within a week. Great platform!&quot;
              </p>
              <div className="stars">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="story-card">
              <div className="story-avatar">👩‍💼</div>
              <h3>Priya Singh</h3>
              <p className="story-role">Fresher</p>
              <p className="story-text">
                &quot;Got hired at my dream internship through WorkMate. Highly recommended!&quot;
              </p>
              <div className="stars">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="story-card">
              <div className="story-avatar">👨‍💻</div>
              <h3>Arjun Patel</h3>
              <p className="story-role">Tech Recruiter</p>
              <p className="story-text">
                &quot;Excellent pool of candidates. WorkMate made hiring easy for us.&quot;
              </p>
              <div className="stars">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="container">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of students and professionals in Chennai finding their perfect jobs</p>
          <div className="cta-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/login?role=student')}>
              Sign Up as Student
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/login?role=employer')}>
              Sign Up as Employer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
