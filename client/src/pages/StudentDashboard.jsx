import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Loader, Search, LayoutGrid, Calendar as CalendarIcon, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard3D from '../components/EventCard3D';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import enUS from 'date-fns/locale/en-US';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const StudentDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [myFollowing, setMyFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchScope, setSearchScope] = useState('events'); // 'events' | 'organizers'
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'

    const navigate = useNavigate();

    const categories = ['All', 'Music', 'Tech', 'Workshop', 'Social', 'Sports', 'Other'];

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Events
                const params = selectedCategory !== 'All' ? { category: selectedCategory } : {};
                const resEvents = await axios.get('/api/events', { params });
                setEvents(resEvents.data);

                // 2. Fetch My Profile (to get following list)
                if (user?.id) {
                    const resMe = await axios.get(`/api/users/${user.id}`);
                    setMyFollowing(resMe.data.user.following || []);
                }

            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, user?.id]);

    // Search Users Effect
    useEffect(() => {
        const searchUsers = async () => {
            if (searchScope === 'organizers' && searchTerm.length > 2) {
                try {
                    const res = await axios.get(`/api/users/search?q=${searchTerm}`);
                    setUsers(res.data);
                } catch (e) { console.error(e); }
            }
        };
        // Debounce simple implementation
        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchScope]);


    // Derived Data
    const filteredEvents = events.filter(e => {
        if (searchScope === 'organizers') return false; // Don't show events in organizer mode
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // Search by organizer name if populated
            (e.organizer?.name && e.organizer.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    // Calendar Events
    const calendarEvents = filteredEvents.map(event => ({
        id: event._id,
        title: event.title,
        start: new Date(`${format(new Date(event.date), 'yyyy-MM-dd')}T${event.startTime}`),
        end: new Date(`${format(new Date(event.date), 'yyyy-MM-dd')}T${event.endTime}`),
        resource: event
    }));

    // Recommended Events (From Following)
    const recommendedEvents = events.filter(e => {
        const orgId = e.organizer?._id || e.organizer;
        return myFollowing.includes(orgId) && new Date(e.date) >= new Date();
    });

    // Live/Gates Open Events Logic
    const liveEvents = events.filter(e => {
        if (e.status !== 'approved') return false;

        // Manual Gate Open Check (Priority)
        if (e.isGateOpen) return true;

        // Strict Time Window Check
        const now = new Date();
        const start = new Date(`${format(new Date(e.date), 'yyyy-MM-dd')}T${e.startTime}`);
        const end = new Date(`${format(new Date(e.date), 'yyyy-MM-dd')}T${e.endTime}`);
        return now >= start && now <= end;
    });

    // My Upcoming Events (RSVP'd)
    const myUpcomingEvents = events.filter(e =>
        e.attendees?.some(a => a.user === user?.id || a.user?._id === user?.id) &&
        e.status !== 'completed' &&
        e.status !== 'rejected'
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto">

            {/* HEADER & SEARCH */}
            <div className="text-center mb-12 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-5xl md:text-7xl font-heading font-black text-text tracking-tight mb-4">
                        What's the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">plan?</span>
                    </h1>
                </motion.div>

                {/* Search Bar Container */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto bg-surface p-2 rounded-3xl shadow-xl border border-primary/10">

                    {/* Scope Toggle */}
                    <div className="flex bg-slate-100 rounded-2xl p-1 shrink-0">
                        <button onClick={() => setSearchScope('events')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${searchScope === 'events' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Events</button>
                        <button onClick={() => setSearchScope('organizers')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${searchScope === 'organizers' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>People</button>
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3 bg-transparent outline-none font-medium text-text placeholder:text-slate-400"
                            placeholder={searchScope === 'events' ? "Search parties, workshops..." : "Find students & organizers..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* View Toggle (Only for Events) */}
                    {searchScope === 'events' && (
                        <div className="hidden md:flex bg-slate-100 rounded-2xl p-1 shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-5 h-5" /></button>
                            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><CalendarIcon className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>

                {/* Categories (Only for Events) */}
                {searchScope === 'events' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-wrap justify-center gap-2"
                    >
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${selectedCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : 'bg-surface text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-primary/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <AnimatePresence mode="wait">

                {/* ORGANIZER/PEOPLE SEARCH RESULTS */}
                {searchScope === 'organizers' && (
                    <motion.div
                        key="organizers"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {users.length > 0 ? (
                            users.map(u => (
                                <div key={u._id} onClick={() => navigate(`/profile/${u._id}`)} className="glass-card p-6 flex items-center gap-4 hover:border-primary/50 group cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-primary transition">
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-white">{u.name.charAt(0)}</span>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-primary transition">{u.name}</h3>
                                        <p className="text-sm text-slate-400 capitalize">{u.role}</p>
                                        {u.role === 'organizer' && (
                                            <p className="text-xs text-slate-500 mt-1">{u.followers?.length || 0} Followers</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                {searchTerm ? "No results found." : "Type to search for people..."}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* EVENT GRID SEARCH RESULTS */}
                {searchScope === 'events' && viewMode === 'grid' && (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-12"
                    >
                        {/* MY EVENTS SECTION (RSVP'd) */}
                        {myUpcomingEvents.length > 0 && !searchTerm && selectedCategory === 'All' && (
                            <section className="mb-12">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><User className="text-violet-400" /> Your Upcoming Events</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {myUpcomingEvents.map(event => (
                                        <div key={event._id} className="w-full relative">
                                            <EventCard3D {...event} image={event.galleryImages?.[0]} onClick={() => navigate(`/events/${event._id}`)} />
                                            {event.isGateOpen && (
                                                <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-10">
                                                    GATES OPEN
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="my-12 h-px bg-slate-800 w-full"></div>
                            </section>
                        )}

                        {/* RECOMMENDED SECTION (If Following exists) */}
                        {myFollowing.length > 0 && !searchTerm && selectedCategory === 'All' && (
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><CheckCircle className="text-green-400" /> Recommended for You</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {recommendedEvents.slice(0, 3).map(event => (
                                        <div key={event._id} className="w-full"><EventCard3D {...event} image={event.galleryImages?.[0]} onClick={() => navigate(`/events/${event._id}`)} /></div>
                                    ))}
                                    {recommendedEvents.length === 0 && <p className="text-slate-500">No upcoming events from followed organizers.</p>}
                                </div>
                                <div className="my-12 h-px bg-slate-800 w-full"></div>
                            </section>
                        )}

                        {/* LIVE EVENTS SECTION */}
                        {liveEvents.length > 0 && searchScope === 'events' && (
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">Happening Now</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {liveEvents.map(event => (
                                        <div key={event._id} className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative">
                                                <EventCard3D
                                                    title={event.title}
                                                    date={format(new Date(event.date), 'MMMM do')}
                                                    location={event.location}
                                                    image={event.galleryImages?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'}
                                                    attendees={event.attendees}
                                                    eventType={event.eventType}
                                                    onClick={() => navigate(`/events/${event._id}`)}
                                                />
                                                <div className={`absolute top-4 right-4 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 ${event.isGateOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600 animate-pulse'}`}>
                                                    {event.isGateOpen ? 'GATES OPEN' : 'LIVE'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="my-12 h-px bg-slate-800 w-full"></div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredEvents.map((event) => (
                                <div key={event._id} className="w-full">
                                    <EventCard3D
                                        title={event.title}
                                        date={format(new Date(event.date), 'MMMM do')}
                                        location={event.location}
                                        image={event.galleryImages?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'}
                                        attendees={event.attendees}
                                        eventType={event.eventType}
                                        onClick={() => navigate(`/events/${event._id}`)}
                                    />
                                </div>
                            ))}
                        </div>
                        {filteredEvents.length === 0 && (
                            <div className="text-center w-full py-12 text-slate-500">
                                <p className="text-xl font-heading font-bold">No events found matching your vibe.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* CALENDAR VIEW */}
                {searchScope === 'events' && viewMode === 'calendar' && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-6 bg-surface/90"
                    >
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 600, fontFamily: 'Outfit, sans-serif' }}
                            onSelectEvent={(event) => navigate(`/events/${event.id}`)}
                            eventPropGetter={() => ({
                                className: 'bg-primary text-white rounded-lg border-0 shadow-md !text-sm !font-bold !py-1 !px-2',
                            })}
                        />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default StudentDashboard;
