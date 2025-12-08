import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, X, Calendar, Ticket, PlusSquare, BarChart2, Scan, CheckSquare } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    // Navigation Links based on Master Plan
    const studentLinks = [
        { name: 'Calendar', path: '/', icon: <Calendar className="w-4 h-4" /> },
        // { name: 'My Tickets', path: '/my-tickets', icon: <Ticket className="w-4 h-4" /> }, // Future
    ];

    const organizerLinks = [
        // { name: 'My Events', path: '/dashboard', icon: <Calendar className="w-4 h-4" /> }, // Managed in dashboard
        { name: 'Dashboard', path: '/dashboard', icon: <Calendar className="w-4 h-4" /> },
        { name: 'Scanner', path: '/scanner', icon: <Scan className="w-4 h-4" /> },
    ];

    const adminLinks = [
        // { name: 'Approvals', path: '/admin', icon: <CheckSquare className="w-4 h-4" /> }, // Is tab inside admin
        { name: 'Command Center', path: '/admin', icon: <BarChart2 className="w-4 h-4" /> },
    ];

    const links = user.role === 'admin' ? adminLinks
        : user.role === 'organizer' ? organizerLinks
            : studentLinks;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* LEFT: Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-violet-600 p-1.5 rounded-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                CampusEvents
                            </span>
                        </Link>
                    </div>

                    {/* CENTER: Desktop Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* RIGHT: Profile & Logout */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 text-right">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{user.name}</span>
                                <span className="text-xs text-violet-400 uppercase tracking-wider">{user.role}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-violet-500 font-bold">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* MOBILE Toggle */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-300 hover:text-white"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE DRAWER */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-violet-500 font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 mt-2 text-red-400 hover:bg-slate-800 rounded-lg"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
