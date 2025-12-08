import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { Loader, MapPin, Search, Calendar as CalendarIcon, List as ListIcon, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

// --- CUSTOM TOOLBAR COMPONENTS ---
const CustomToolbar = (toolbar) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = toolbar.date;
        return (
            <span className="text-2xl font-heading font-bold text-white capitalize">
                {format(date, 'MMMM yyyy')}
            </span>
        );
    };

    return (
        <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-4">
                {label()}
            </div>

            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                <button onClick={goToBack} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goToCurrent} className="px-4 py-2 text-xs font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest border-x border-white/10">
                    Today
                </button>
                <button onClick={goToNext} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/events');
                setEvents(res.data);
            } catch (error) {
                console.error("Error fetching events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleEventSelect = (event) => {
        navigate(`/events/${event._id}`);
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    const onNavigate = (newDate) => {
        setCurrentDate(newDate);
    };

    // Calendar Events
    // Calendar Events Logic
    // Maps discontinuous dates (eventDates array) to separate calendar blocks
    // This ensures "Hackathon Day 1", "Hackathon Day 2" appear as distinct blocks name repeated.
    const calendarEvents = events.flatMap(event => {
        if (event.eventDates && event.eventDates.length > 0) {
            return event.eventDates.map((dateObj, idx) => ({
                ...event,
                id: `${event._id}-${idx}`, // Unique ID for calendar key
                title: event.title,
                start: new Date(new Date(dateObj.date).toISOString().split('T')[0] + 'T' + dateObj.startTime),
                end: new Date(new Date(dateObj.date).toISOString().split('T')[0] + 'T' + dateObj.endTime),
                allDay: false,
            }));
        }

        // Fallback for Legacy Events (Date + EndDate Range)
        const startDateStr = format(new Date(event.date), 'yyyy-MM-dd');
        const endDateStr = event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : startDateStr;

        return [{
            ...event,
            title: event.title,
            start: new Date(startDateStr + 'T' + event.startTime),
            end: new Date(endDateStr + 'T' + event.endTime),
            allDay: false,
        }];
    });

    // Filter Logic
    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="w-10 h-10 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-24 min-h-screen">

            {/* HERO / HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
                        Discovery
                    </h1>
                    <p className="text-slate-400 text-lg">Curated events for the campus community.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-violet-500 transition" />
                        <input
                            type="text"
                            placeholder="Find your vibe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 input-dark w-full sm:w-72"
                        />
                    </div>
                    {/* Toggle View */}
                    <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-violet-600 shadow-lg shadow-violet-500/25 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <CalendarIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 shadow-lg shadow-violet-500/25 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            {viewMode === 'calendar' ? (
                <div className="glass-card p-1 md:p-4 h-[650px] animate-fade-in-up border border-white/10 shadow-2xl shadow-violet-900/10">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleEventSelect}
                        views={['month']}
                        defaultView='month'
                        date={currentDate}
                        onNavigate={onNavigate}
                        components={{
                            toolbar: CustomToolbar
                        }}
                        popup
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    {filteredEvents.map(event => (
                        <div
                            key={event._id}
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="glass-card group cursor-pointer overflow-hidden transform hover:-translate-y-1 transition duration-300"
                        >
                            {/* Card Image */}
                            <div className="h-48 bg-gradient-to-br from-violet-900/50 to-indigo-900/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition"></div>
                                {/* Date Badge */}
                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl text-center min-w-[60px]">
                                    <span className="block text-xs font-bold text-violet-300 uppercase">{format(new Date(event.date), 'MMM')}</span>
                                    <span className="block text-xl font-bold text-white">{format(new Date(event.date), 'dd')}</span>
                                </div>
                                <span className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
                                    {event.status === 'completed' ? 'Legacy' : 'Upcoming'}
                                </span>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors line-clamp-1">
                                    {event.title}
                                </h3>
                                <div className="space-y-2.5 text-sm text-slate-400">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-violet-500/70" />
                                        <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-violet-500/70" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                                <Search className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
                            <p className="text-slate-500">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
