import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobDetailsPage from './pages/JobDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Theme
import { useTheme } from './hooks/useTheme';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    if (token) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
    }
  }, []);

  return (
    <BrowserRouter>
      <div className={isDarkMode ? 'dark' : 'light'}>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn}
          userType={userType}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/profile" element={<ProfilePage userType={userType} />} />
          
          {/* Student Routes */}
          {isLoggedIn && userType === 'student' && (
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          )}
          
          {/* Employer Routes */}
          {isLoggedIn && userType === 'employer' && (
            <Route path="/employer-dashboard" element={<EmployerDashboard />} />
          )}
          
          {/* Admin Routes */}
          {isLoggedIn && userType === 'admin' && (
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          )}
        </Routes>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
