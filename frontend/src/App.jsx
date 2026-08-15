import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
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
  const token = useAuthStore((state) => state.token);
  const userType = useAuthStore((state) => state.userType);
  const isLoggedIn = Boolean(token);
  const { isDarkMode, toggleTheme } = useTheme();

  // Protected route wrapper to keep Routes children pure Route elements
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
          userType={userType}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
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

          {/* Catch-all fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
