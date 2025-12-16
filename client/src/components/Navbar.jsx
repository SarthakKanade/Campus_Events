import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, PlusCircle, LogOut, Menu, X, User, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import ChillButton from './ChillButton';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Strict Role-Based Navigation
    // Student: Home Only
    // Organizer: Home, Dashboard
    // Admin: Home, Admin Control (Dashboard)
    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        ...(user?.role === 'organizer' ? [{ path: '/dashboard', label: 'Dashboard', icon: Calendar }] : []),
        ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin Control', icon: User }] : [])
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-panel px-6 py-3 flex items-center justify-between shadow-2xl shadow-primary/10"
            >
                {/* Logo */}
                <Link to="/" className="text-2xl font-heading font-black text-primary tracking-tighter hover:scale-105 transition-transform">
                    CAMPUS<span className="text-secondary">CHILL</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-2 bg-surface/50 p-1.5 rounded-full border border-white/40">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path} className="relative px-4 py-2 rounded-full transition-colors group">
                                {active && (
                                    <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white shadow-sm rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                <span className={`relative z-10 flex items-center gap-2 text-sm font-bold ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}`}>
                                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}`} />
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-surface hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link to={`/profile/${user.id || user._id}`} className="hidden md:flex flex-col items-end leading-tight group">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{user.name}</span>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{user.role}</span>
                            </Link>
                            <ChillButton onClick={handleLogout} variant="secondary" className="!px-3 !py-2">
                                <LogOut className="w-4 h-4" />
                            </ChillButton>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link to="/login">
                                <ChillButton variant="primary" className="text-sm px-5 py-2">Login</ChillButton>
                            </Link>
                            <Link to="/signup">
                                <ChillButton variant="secondary" className="text-sm px-5 py-2">Sign Up</ChillButton>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-slate-600 hover:text-primary transition">
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </motion.div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute top-20 left-0 w-full glass-panel p-4 flex flex-col gap-2 md:hidden"
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`p-4 rounded-xl font-bold flex items-center gap-3 ${isActive(item.path) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/50 text-slate-600'}`}
                            >
                                <item.icon className="w-5 h-5" /> {item.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
