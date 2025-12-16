import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChillButton from '../components/ChillButton';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(email, password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.msg);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex w-full max-w-6xl flex-col lg:flex-row items-center gap-12 lg:gap-24">

                {/* Left Side: Hero Text */}
                <div className="flex-1 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                    >
                        <h1 className="text-6xl lg:text-8xl font-heading font-black text-slate-800 leading-tight mb-6">
                            CAMPUS <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">VIBES</span>
                        </h1>
                        <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto lg:mx-0 mb-8">
                            Join the most electric student community. Discover events, rsvp with style, and never miss out on the fun.
                        </p>
                    </motion.div>
                </div>

                {/* Right Side: Glass Login Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
                        {/* Decorative circle */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>

                        <h2 className="text-3xl font-heading font-bold mb-2 text-slate-800 relative z-10">Welcome In</h2>
                        <p className="text-slate-500 mb-8 relative z-10">Enter your credentials to access the festival.</p>

                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Student Email</label>
                                <input
                                    type="email"
                                    className="input-chill"
                                    placeholder="student@campus.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
                                <input
                                    type="password"
                                    className="input-chill"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <ChillButton type="submit" className="w-full" variant="primary">
                                Let's Go
                            </ChillButton>
                        </form>

                        <div className="mt-6 text-center text-xs font-medium text-slate-400">
                            <p>Try: student1@college.edu / password123</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
