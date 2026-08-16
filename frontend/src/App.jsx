import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ActivityPage from './pages/ActivityPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobDetailsPage from './pages/JobDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import LocationSelectorModal from './components/LocationSelectorModal';
import SOSModal from './components/SOSModal';

// Theme
import { useTheme } from './hooks/useTheme';

// Auth store
import { useAuthStore } from './store';

function App() {
  const token = useAuthStore((state) => state.token);
  const userType = useAuthStore((state) => state.userType);
  const setUserType = useAuthStore((state) => state.setUserType);
  const { isDarkMode, toggleTheme } = useTheme();

  const isLoggedIn = !!token;
  const setIsLoggedIn = () => {};

  // Protected route helper
  const PrivateRoute = ({ children, role }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (role && userType !== role) return <Navigate to="/" replace />;
    return children;
  };

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

        {/* Global Pan-India Location Selector Modal */}
        <LocationSelectorModal />

        {/* Global 24x7 Safety & Emergency SOS Modal */}
        <SOSModal />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/profile" element={<ProfilePage userType={userType} />} />

          {/* Role Dashboard Routes */}
          <Route
            path="/student-dashboard"
            element={
              <PrivateRoute role="student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employer-dashboard"
            element={
              <PrivateRoute role="employer">
                <EmployerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />

        {/* Mobile First Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
