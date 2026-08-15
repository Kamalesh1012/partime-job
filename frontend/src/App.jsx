import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
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

// Theme
import { useTheme } from './hooks/useTheme';

// Auth store — single source of truth
import { useAuthStore } from './store';

function App() {
  const token = useAuthStore((state) => state.token);
  const userType = useAuthStore((state) => state.userType);
  const setUserType = useAuthStore((state) => state.setUserType);
  const { isDarkMode, toggleTheme } = useTheme();

  const isLoggedIn = !!token;

  // Helper: set login state from child pages
  const setIsLoggedIn = () => {}; // no-op, store handles it

  // Protected route
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

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/profile" element={<ProfilePage userType={userType} />} />

          {/* Student Routes */}
          <Route
            path="/student-dashboard"
            element={
              <PrivateRoute role="student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />

          {/* Employer Routes */}
          <Route
            path="/employer-dashboard"
            element={
              <PrivateRoute role="employer">
                <EmployerDashboard />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
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
      </div>
    </BrowserRouter>
  );
}

export default App;
