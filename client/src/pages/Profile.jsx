import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { User, Mail, Edit3, Save, Linkedin, Instagram, Globe } from 'lucide-react';
import ChillButton from '../components/ChillButton';

const Profile = () => {
    const { user: authUser } = useAuth(); // Basic info from token
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/auth/me', {
                    headers: { 'x-auth-token': token }
                });
                setProfile(res.data);
                setFormData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        if (e.target.name.startsWith('socials.')) {
            const platform = e.target.name.split('.')[1];
            setFormData({
                ...formData,
                socials: { ...formData.socials, [platform]: e.target.value }
            });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/api/auth/profile', formData, {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
            setIsEditing(false);
            toast.success("Profile updated!");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    if (loading) return <div className="text-center pt-32 text-primary">Loading Profile...</div>;
    if (!profile) return null;

    return (
        <div className="min-h-screen pt-32 px-4 max-w-4xl mx-auto pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12"
            >
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Avatar Side */}
                    <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shadow-xl">
                            <div className="w-full h-full rounded-full bg-surface overflow-hidden flex items-center justify-center">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-slate-300">{profile.name?.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                        {isEditing && (
                            <input
                                className="input-chill text-sm py-2"
                                placeholder="Avatar URL"
                                name="avatar"
                                value={formData.avatar || ''}
                                onChange={handleChange}
                            />
                        )}

                        <div className="text-center mt-2">
                            <h2 className="text-2xl font-heading font-bold text-text">{profile.name}</h2>
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mt-1">{profile.role}</span>
                        </div>
                    </div>

                    {/* Details Side */}
                    <div className="flex-1 w-full space-y-6">
                        <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                            <h3 className="text-xl font-bold text-text">About Me</h3>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-surface text-slate-500 hover:text-primary transition">
                                    <Edit3 className="w-5 h-5" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                    <ChillButton onClick={handleSave} variant="primary" className="!py-2 !px-4 text-sm flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save
                                    </ChillButton>
                                </div>
                            )}
                        </div>

                        {/* Form/View */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text/50 uppercase tracking-widest block mb-1">Bio</label>
                                {isEditing ? (
                                    <textarea
                                        className="input-chill min-h-[100px]"
                                        name="bio"
                                        value={formData.bio || ''}
                                        onChange={handleChange}
                                        placeholder="Tell us about your vibe..."
                                    ></textarea>
                                ) : (
                                    <p className="text-text/80 leading-relaxed italic">"{profile.bio || 'No bio yet.'}"</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text/50 uppercase tracking-widest block mb-1">Interests</label>
                                {isEditing ? (
                                    <input
                                        className="input-chill"
                                        name="interests"
                                        value={Array.isArray(formData.interests) ? formData.interests.join(', ') : formData.interests || ''}
                                        onChange={handleChange} // Needs handling for array splitting
                                        placeholder="Music, Coding, Gaming (comma separated)"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests?.map((tag, idx) => (
                                            <span key={idx} className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-bold">{tag}</span>
                                        ))}
                                        {!profile.interests?.length && <span className="text-slate-400 text-sm">No interests listed.</span>}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                <div className="relative">
                                    <Linkedin className="absolute left-3 top-3.5 w-5 h-5 text-text/40" />
                                    {isEditing ? (
                                        <input className="input-chill pl-10 text-sm" name="socials.linkedin" value={formData.socials?.linkedin || ''} onChange={handleChange} placeholder="LinkedIn" />
                                    ) : (
                                        profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition p-3 bg-surface rounded-xl border border-primary/5"><Linkedin className="w-5 h-5" /> LinkedIn</a>
                                    )}
                                </div>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-3.5 w-5 h-5 text-text/40" />
                                    {isEditing ? (
                                        <input className="input-chill pl-10 text-sm" name="socials.instagram" value={formData.socials?.instagram || ''} onChange={handleChange} placeholder="Instagram" />
                                    ) : (
                                        profile.socials?.instagram && <a href={profile.socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-pink-500 font-bold transition p-3 bg-surface rounded-xl border border-primary/5"><Instagram className="w-5 h-5" /> Instagram</a>
                                    )}
                                </div>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 w-5 h-5 text-text/40" />
                                    {isEditing ? (
                                        <input className="input-chill pl-10 text-sm" name="socials.website" value={formData.socials?.website || ''} onChange={handleChange} placeholder="Website" />
                                    ) : (
                                        profile.socials?.website && <a href={profile.socials.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition p-3 bg-surface rounded-xl border border-primary/5"><Globe className="w-5 h-5" /> Website</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
