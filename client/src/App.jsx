import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login'; // Placeholder for now

import OrganizerScanner from './pages/OrganizerScanner';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';

// Protected Route Component (Simple)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Simple check
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <div className="pt-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
              <Route path="/events/:id" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
              <Route path="/scanner" element={<PrivateRoute><OrganizerScanner /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><OrganizerDashboard /></PrivateRoute>} />
              {/* Add more routes as needed */}
            </Routes>
          </div>
          <ToastContainer position="bottom-right" theme="dark" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
