import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ChillButton from '../components/ChillButton';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const { register } = useAuth(); // We need to add this to AuthContext
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(formData);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-center">

                {/* Visuals */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="hidden md:block"
                >
                    <h1 className="text-6xl font-heading font-black text-text leading-tight mb-6">
                        Join the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-orange-400">Movement.</span>
                    </h1>
                    <p className="text-xl text-text/60 font-medium max-w-md">
                        Create an account to RSVP for events, get exclusive access, and find your tribe on campus.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-panel p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <UserPlus className="w-48 h-48" />
                    </div>

                    <h2 className="text-3xl font-heading font-bold text-text mb-8 relative z-10">Sign Up</h2>

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-text/30 w-5 h-5" />
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                className="input-chill pl-12 bg-white/50 focus:bg-white transition-colors"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-text/30 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Student Email"
                                className="input-chill pl-12 bg-white/50 focus:bg-white transition-colors"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-text/30 w-5 h-5" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                className="input-chill pl-12 bg-white/50 focus:bg-white transition-colors"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Briefcase className="absolute left-4 top-3.5 text-text/30 w-5 h-5" />
                            <select
                                name="role"
                                className="input-chill pl-12 bg-white/50 focus:bg-white transition-colors appearance-none cursor-pointer"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="student">Student</option>
                                <option value="organizer">Organizer</option>
                            </select>
                        </div>

                        <div className="pt-4">
                            <ChillButton variant="primary" className="w-full py-4 text-lg">
                                Create Account
                            </ChillButton>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-text/80 relative z-10">
                        <p>Already waiting list? <Link to="/login" className="font-bold text-primary hover:underline">Log in</Link></p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
