import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login'; // Placeholder for now
import Signup from './pages/Signup';
import Profile from './pages/Profile';

import OrganizerScanner from './pages/OrganizerScanner';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import PublicProfile from './pages/PublicProfile';
import ProtectedRoute from './components/ProtectedRoute';
import Background3D from './components/Background3D';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen relative overflow-hidden">
                    <Background3D />
                    <Navbar />
                    {/* Increased padding to prevent Navbar overlap (Navbar is fixed ~top-6 + height) */}
                    <div className="pt-32 pb-12 px-4 max-w-7xl mx-auto">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />

                            {/* Protected Routes */}
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            } />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            } />

                            <Route path="/events/:id" element={
                                <ProtectedRoute>
                                    <EventDetails />
                                </ProtectedRoute>
                            } />

                            {/* Organizer Routes */}
                            <Route path="/dashboard" element={
                                <ProtectedRoute roles={['organizer', 'admin']}>
                                    <OrganizerDashboard />
                                </ProtectedRoute>
                            } />

                            <Route path="/scanner" element={
                                <ProtectedRoute roles={['organizer', 'admin']}>
                                    <OrganizerScanner />
                                </ProtectedRoute>
                            } />

                            {/* Admin Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/profile/:id" element={<PublicProfile />} />
                        </Routes>
                    </div>
                    <ToastContainer position="bottom-right" theme="dark" />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
