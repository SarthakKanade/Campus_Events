import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import { Loader } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Background3D from './components/Background3D';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy Loaded Pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const OrganizerScanner = lazy(() => import('./pages/OrganizerScanner'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen relative overflow-hidden">
                    <Background3D />
                    <Navbar />
                    {/* Increased padding to prevent Navbar overlap (Navbar is fixed ~top-6 + height) */}
                    <div className="pt-32 pb-12 px-4 max-w-7xl mx-auto">
                        <ErrorBoundary>
                            <Suspense
                                fallback={
                                    <div className="min-h-[60vh] flex items-center justify-center">
                                        <Loader className="w-10 h-10 text-primary animate-spin" />
                                    </div>
                                }
                            >
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
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                    <ToastContainer position="bottom-right" theme="dark" />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
