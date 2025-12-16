import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader, User, Calendar, MapPin, Instagram, Globe, Linkedin, Users, CheckCircle } from 'lucide-react';
import ChillButton from '../components/ChillButton';
import EventCard3D from '../components/EventCard3D'; // Reuse card? Or simpler list?
// Localizer imports matching StudentDashboard
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const PublicProfile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [relatedData, setRelatedData] = useState([]); // Events or History
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    useEffect(() => {
        const fetchProfile = async () => {
            // Pass token if available to allow "private view" of own profile
            const config = currentUser ? { headers: { 'x-auth-token': currentUser.token } } : {};

            try {
                const res = await axios.get(`/api/users/${id}`, config);
                setProfile(res.data.user);
                setRelatedData(res.data.relatedData.events || res.data.relatedData.history || []);
                setFollowerCount(res.data.user.followers.length || 0);

                // Check if following
                if (currentUser && res.data.user.followers.includes(currentUser.id)) {
                    setIsFollowing(true);
                }
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    setProfile({ isPrivate: true }); // Special state for private
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) return alert("Login to follow!");
        try {
            const config = { headers: { 'x-auth-token': currentUser.token } };
            const res = await axios.put(`/api/users/follow/${id}`, {}, config);
            setIsFollowing(res.data.isFollowing);
            setFollowerCount(prev => res.data.isFollowing ? prev + 1 : prev - 1);
        } catch (err) {
            console.error(err);
            alert("Action failed");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white"><Loader className="animate-spin" /></div>;

    // Privacy / Not Found Views
    if (profile?.isPrivate) {
        return (
            <div className="min-h-screen pt-32 text-center text-white flex flex-col items-center">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md">
                    <User className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Private Profile</h2>
                    <p className="text-slate-400">This user's profile is only visible to them.</p>
                </div>
            </div>
        );
    }

    if (!profile) return <div className="min-h-screen pt-32 text-center text-white">User not found</div>;

    // Transform events for Calendar
    const calendarEvents = relatedData.map(event => ({
        id: event._id,
        title: event.title,
        start: new Date(event.date), // Simplified for brevity. ideally date+startTime
        end: new Date(event.date), // ideally date+endTime
        resource: event
    }));

    return (
        <div className="min-h-screen pt-32 pb-12 px-4 max-w-5xl mx-auto text-white">
            {/* Header */}
            <div className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center gap-8 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 -z-10"></div>

                <div className="w-32 h-32 rounded-full border-4 border-surface bg-slate-800 flex items-center justify-center text-4xl font-bold shadow-2xl z-10">
                    {profile.avatar ? <img src={profile.avatar} className="w-full h-full rounded-full object-cover" /> : profile.name.charAt(0)}
                </div>

                <div className="text-center md:text-left flex-1 z-10">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                        <h1 className="text-4xl font-black font-heading tracking-tight">{profile.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile.role === 'organizer' ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                            {profile.role}
                        </span>
                    </div>

                    {profile.bio && <p className="text-slate-300 mb-4 max-w-2xl">{profile.bio}</p>}

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-slate-400">
                        {/* FOLLOWERS ONLY FOR ORGANIZERS */}
                        {profile.role === 'organizer' && (
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {followerCount} Followers</span>
                        )}
                        {profile.socials?.instagram && <a href={profile.socials.instagram} target="_blank" className="hover:text-pink-400 flex items-center gap-1"><Instagram className="w-4 h-4" /> Instagram</a>}
                        {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" className="hover:text-blue-400 flex items-center gap-1"><Linkedin className="w-4 h-4" /> LinkedIn</a>}
                        {profile.socials?.website && <a href={profile.socials.website} target="_blank" className="hover:text-emerald-400 flex items-center gap-1"><Globe className="w-4 h-4" /> Website</a>}
                    </div>
                </div>

                <div className="z-10">
                    {/* FOLLOW BUTTON ONLY FOR ORGANIZERS */}
                    {currentUser && currentUser.id !== profile._id && profile.role === 'organizer' && (
                        <ChillButton
                            onClick={handleFollow}
                            variant={isFollowing ? "secondary" : "primary"}
                            className={isFollowing ? "border-slate-500 text-slate-300" : ""}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </ChillButton>
                    )}
                </div>
            </div>

            {/* Content Tabs / Toggle */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    {profile.role === 'organizer' ? <Calendar className="w-6 h-6 text-primary" /> : <CheckCircle className="w-6 h-6 text-green-400" />}
                    {profile.role === 'organizer' ? 'Hosted Events' : 'Event History & Plans'}
                </h2>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded text-sm transition ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>List</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 rounded text-sm transition ${viewMode === 'calendar' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>Calendar</button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedData.length > 0 ? (
                        relatedData.map(event => (
                            // reusing card or simple view
                            <div key={event._id} className="glass-panel p-4 hover:bg-white/5 transition group">
                                <div className="h-40 w-full rounded-xl bg-slate-800 mb-4 overflow-hidden relative">
                                    <img
                                        src={event.galleryImages?.[0] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold">
                                        {format(new Date(event.date), 'MMM d')}
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2">{event.description}</p>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{event.location}</span>
                                    <span className={`px-2 py-0.5 rounded ${event.status === 'completed' ? 'bg-slate-700' : 'bg-primary/20 text-primary'}`}>
                                        {event.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic col-span-full text-center py-12">No events found.</p>
                    )}
                </div>
            ) : (
                <div className="glass-panel p-6 bg-slate-800/50">
                    <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500, fontFamily: 'Outfit, sans-serif' }}
                        eventPropGetter={() => ({
                            className: 'bg-primary text-white rounded border-0 text-xs font-bold',
                        })}
                    />
                </div>
            )}
        </div>
    );
};

export default PublicProfile;

