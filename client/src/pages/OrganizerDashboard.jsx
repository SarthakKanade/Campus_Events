import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, List, Clock, CheckCircle, XCircle, Users, Calendar, MapPin, AlertCircle, RefreshCcw, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const OrganizerDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'my-events'

    const [editingEventId, setEditingEventId] = useState(null); // If set, we are in EDIT mode

    // FORM STATE
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: 'Auditorium',
        capacity: 100,
        requestNote: ''
    });

    // EVENT DATES (Discontinuous or Range)
    // We will maintain a list of dates. 
    // If "Single Day", list has 1 item.
    // If "Multi-day", user adds items.
    const [eventDates, setEventDates] = useState([
        { date: '', startTime: '', endTime: '' }
    ]);

    // AGENDA
    const [agendaItems, setAgendaItems] = useState([]);
    const [currentAgendaItem, setCurrentAgendaItem] = useState({
        title: '', startTime: '', endTime: '', description: '', date: '' // Date will be one of the eventDates
    });

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                // Fetch public events to filter approved
                // NOTE: The current backend GET /api/events only returns 'approved' events.
                // To properly support 'Edit Pending' or 'Fix & Resubmit' for 'rejected' events,
                // the backend would ideally need a dedicated endpoint like '/api/events/my-events'
                // that returns all events for the authenticated organizer, regardless of status.
                // For this frontend implementation, we'll proceed assuming such events can be fetched
                // or that the list will be refreshed after an optimistic update/backend change.
                // If the backend doesn't provide pending/rejected events, the 'Edit' button
                // will only work for events that are already visible (e.g., approved, or if the API changes).
                const res = await axios.get('http://localhost:5001/api/events');
                let myEvents = res.data.filter(e => e.organizer._id === user.id || e.organizer === user.id);
                setEvents(myEvents);
            } catch (err) { console.log(err); } finally { setLoading(false); }
        };
        fetchMyEvents();
    }, [user.id]);


    // --- HANDLERS ---

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Date/Time Handlers
    const updateEventDate = (index, field, value) => {
        const newDates = [...eventDates];
        newDates[index][field] = value;
        setEventDates(newDates);
    };

    const addEventDate = () => {
        setEventDates([...eventDates, { date: '', startTime: '', endTime: '' }]);
    };

    const removeEventDate = (index) => {
        if (eventDates.length > 1) {
            setEventDates(eventDates.filter((_, i) => i !== index));
        }
    };

    // Agenda Handlers
    const addAgendaItem = () => {
        if (!currentAgendaItem.title || !currentAgendaItem.startTime) return;
        setAgendaItems([...agendaItems, { ...currentAgendaItem, id: Date.now() }]);
        setCurrentAgendaItem({ title: '', startTime: '', endTime: '', description: '', date: '' });
    };

    const removeAgendaItem = (id) => {
        setAgendaItems(agendaItems.filter(item => item.id !== id));
    };

    // EDIT HANDLER
    const startEdit = (event) => {
        setEditingEventId(event._id);
        setActiveTab('create');

        // Populate Form
        setFormData({
            title: event.title,
            description: event.description,
            location: event.location,
            capacity: event.capacity,
            requestNote: event.requestNote || ''
        });

        // Populate Dates
        // If legacy event (no eventDates), convert date/time/endDate
        if (event.eventDates && event.eventDates.length > 0) {
            setEventDates(event.eventDates.map(d => ({
                date: d.date.split('T')[0],
                startTime: d.startTime,
                endTime: d.endTime
            })));
        } else {
            // Legacy conversion
            const d = event.date.split('T')[0];
            const endD = event.endDate ? event.endDate.split('T')[0] : d;
            // If range, we can't easily make discrete blocks without logic
            // Just make one block for the start
            setEventDates([{ date: d, startTime: event.startTime, endTime: event.endTime }]);
        }

        setAgendaItems(event.agenda || []);
    };

    const cancelEdit = () => {
        setEditingEventId(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', location: 'Auditorium', capacity: 100, requestNote: '' });
        setEventDates([{ date: '', startTime: '', endTime: '' }]);
        setAgendaItems([]);
        setEditingEventId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // BACKWARD COMPAT: Set root 'date', 'startTime', 'endTime' to the FIRST block
            // so legacy logic (Calendar, Cards) still works for the "Main" time.
            const primaryDate = eventDates[0];

            const payload = {
                ...formData,
                eventDates,
                agenda: agendaItems,
                date: primaryDate.date,
                startTime: primaryDate.startTime,
                endTime: primaryDate.endTime,
                // If multiple dates, endDate is last date
                endDate: eventDates.length > 1 ? eventDates[eventDates.length - 1].date : null
            };

            if (editingEventId) {
                // UPDATE
                await axios.put(`http://localhost:5001/api/events/${editingEventId}`, payload);
                toast.success("Event Updated Successfully!");
            } else {
                // CREATE
                await axios.post('http://localhost:5001/api/events', payload);
                toast.success("Event Proposed! Awaiting Admin Approval.");
            }

            setActiveTab('my-events');
            resetForm();

            // Refresh logic omitted for brevity, but ideally re-fetch.
            // setEvents(...) update handled by re-fetch or reload
            setTimeout(() => window.location.reload(), 1000); // Simple reload to refresh list

        } catch (error) {
            if (error.response?.data?.conflicts) {
                toast.error(`Venue Conflict! ${error.response.data.msg}`);
            } else {
                toast.error(error.response?.data?.msg || "Action Failed");
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-24 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="text-violet-500" /> Organizer Dashboard
            </h1>
            <p className="text-slate-400 mb-8">Manage your events and track approvals.</p>

            <div className="flex gap-4 mb-8 border-b border-slate-700">
                <button onClick={() => setActiveTab('create')} className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'create' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Plus className="inline w-4 h-4 mr-2" /> {editingEventId ? 'Edit Event' : 'Host New Event'}
                </button>
                <button onClick={() => { setActiveTab('my-events'); cancelEdit(); }} className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'my-events' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <List className="inline w-4 h-4 mr-2" /> My Events
                </button>
                <button onClick={() => { setActiveTab('analytics'); cancelEdit(); }} className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'analytics' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <TrendingUp className="inline w-4 h-4 mr-2" /> Analytics
                </button>
            </div>

            {activeTab === 'create' ? (
                <div className="max-w-3xl mx-auto">
                    <div className="glass-card p-8 relative">
                        {editingEventId && (
                            <button onClick={cancelEdit} className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-300 underline">Cancel Edit</button>
                        )}
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            {editingEventId ? 'Update Event Proposal' : 'Create Event Proposal'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title & Basics */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Event Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleFormChange} required
                                    className="input-dark w-full" placeholder="e.g. Annual Tech Hackathon" />
                            </div>

                            {/* DATES BUILDER */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-400 flex justify-between items-center">
                                    Event Dates & Times
                                    <button type="button" onClick={addEventDate} className="text-xs text-violet-400 hover:text-violet-300 font-bold">
                                        + Add Another Date
                                    </button>
                                </label>

                                {eventDates.map((item, idx) => (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 bg-white/5 p-3 rounded-xl border border-white/5 items-end animate-fade-in">
                                        <div className="w-full md:w-auto flex-1">
                                            <label className="text-xs text-slate-500 mb-1 block">Date</label>
                                            <input type="date" value={item.date} onChange={e => updateEventDate(idx, 'date', e.target.value)} required
                                                className="input-dark w-full text-sm py-2" />
                                        </div>
                                        <div className="w-1/3 md:w-auto">
                                            <label className="text-xs text-slate-500 mb-1 block">Start</label>
                                            <input type="time" value={item.startTime} onChange={e => updateEventDate(idx, 'startTime', e.target.value)} required
                                                className="input-dark w-full text-sm py-2" />
                                        </div>
                                        <div className="w-1/3 md:w-auto">
                                            <label className="text-xs text-slate-500 mb-1 block">End</label>
                                            <input type="time" value={item.endTime} onChange={e => updateEventDate(idx, 'endTime', e.target.value)} required
                                                className="input-dark w-full text-sm py-2" />
                                        </div>
                                        {eventDates.length > 1 && (
                                            <button type="button" onClick={() => removeEventDate(idx)} className="text-red-500 hover:text-red-400 p-2">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Location</label>
                                    <select name="location" value={formData.location} onChange={handleFormChange}
                                        className="input-dark w-full cursor-pointer">
                                        <option value="Auditorium">Auditorium</option>
                                        <option value="Lab A">Lab A</option>
                                        <option value="Sports Ground">Sports Ground</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Capacity</label>
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleFormChange} required min="1"
                                        className="input-dark w-full" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleFormChange} required rows="3"
                                    className="input-dark w-full" placeholder="Describe the agenda, prerequisites, etc."></textarea>
                            </div>

                            {/* AGENDA BUILDER */}
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <List className="w-4 h-4" /> Agenda / Timetable
                                </h3>

                                <div className="space-y-3 mb-4">
                                    {agendaItems.map((item, idx) => (
                                        <div key={item.id || idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg text-sm">
                                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
                                                {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBD'}
                                            </span>
                                            <span className="text-slate-400 font-mono text-xs">{item.startTime}</span>
                                            <span className="font-bold text-white flex-1">{item.title}</span>
                                            <button type="button" onClick={() => removeAgendaItem(item.id)} className="text-red-400 hover:text-red-300">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {agendaItems.length === 0 && <p className="text-slate-600 text-xs italic">No sessions added yet.</p>}
                                </div>

                                <div className="grid grid-cols-12 gap-2 bg-slate-800/50 p-3 rounded-lg">
                                    <div className="col-span-12 md:col-span-4">
                                        <select
                                            value={currentAgendaItem.date}
                                            onChange={e => setCurrentAgendaItem({ ...currentAgendaItem, date: e.target.value })}
                                            className="input-dark w-full text-xs py-2 h-full"
                                        >
                                            <option value="">Select Date...</option>
                                            {eventDates.map((d, i) => d.date && (
                                                <option key={i} value={d.date}>{new Date(d.date).toLocaleDateString()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-8 md:col-span-5">
                                        <input type="text" placeholder="Session Title"
                                            value={currentAgendaItem.title}
                                            onChange={e => setCurrentAgendaItem({ ...currentAgendaItem, title: e.target.value })}
                                            className="input-dark w-full text-xs py-2" />
                                    </div>
                                    <div className="col-span-4 md:col-span-3">
                                        <input type="time"
                                            value={currentAgendaItem.startTime}
                                            onChange={e => setCurrentAgendaItem({ ...currentAgendaItem, startTime: e.target.value })}
                                            className="input-dark w-full text-xs py-2" />
                                    </div>
                                    <div className="col-span-12">
                                        <button type="button" onClick={addAgendaItem} className="w-full btn-secondary text-xs py-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-violet-500">
                                            + Add to Agenda
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* REQUEST NOTE */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Note to Admin (Optional)</label>
                                <textarea name="requestNote" value={formData.requestNote} onChange={handleFormChange} rows="2"
                                    className="input-dark w-full text-sm" placeholder="Any special requests or context for approval..."></textarea>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Submitting checks for time & location compliance.
                                </p>
                                <button type="submit" className="btn-primary">
                                    {editingEventId ? 'Update Proposal' : 'Submit Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : activeTab === 'analytics' ? (
                <div className="space-y-6 animate-fade-in">
                    {/* STATS OVERVIEW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-violet-600/20 rounded-lg text-violet-400"><Calendar className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Hosted Events</p>
                                <h3 className="text-3xl font-bold text-white">{events.length}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-600/20 rounded-lg text-green-400"><Users className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Total Attendees</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {events.reduce((acc, curr) => acc + (curr.attendees?.length || 0), 0)}
                                </h3>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400"><CheckCircle className="w-8 h-8" /></div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Completed</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {events.filter(e => e.status === 'completed').length}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* CHART SECTION */}
                    {events.length > 0 ? (
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold text-white mb-6">Attendance Overview</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={events.map(e => ({
                                        name: e.title.length > 15 ? e.title.slice(0, 15) + '...' : e.title,
                                        Capacity: e.capacity,
                                        RSVP: e.attendees?.length || 0
                                    }))}>
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="Capacity" fill="#475569" radius={[4, 4, 0, 0]} name="Capacity" />
                                        <Bar dataKey="RSVP" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="RSVP Count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-card">
                            <p className="text-slate-500">No events data available for analysis yet.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Event List */}
                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {events.map(event => (
                                <div key={event._id} className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-violet-500/30 transition">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-lg text-white group-hover:text-violet-400 transition">{event.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${event.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                event.status === 'completed' ? 'bg-slate-600/50 text-slate-400' :
                                                    event.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div className="flex text-sm text-slate-400 gap-4 mb-2">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.startTime}</span>
                                        </div>
                                        {/* REJECTION REASON */}
                                        {event.status === 'rejected' && event.rejectionReason && (
                                            <div className="text-xs bg-red-500/10 border border-red-500/20 p-2 rounded text-red-300">
                                                <strong>Rejected:</strong> {event.rejectionReason}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden md:block">
                                            <span className="block text-xl font-bold text-white">{event.attendees?.length || 0}</span>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Attendees</span>
                                        </div>

                                        <div className="flex gap-2">
                                            {event.status === 'approved' || event.status === 'completed' ? (
                                                <Link to={`/events/${event._id}`} className="btn-secondary text-sm">
                                                    Manage Event
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(event)}
                                                    className="btn-secondary text-sm bg-slate-800 border-slate-600 hover:bg-slate-700"
                                                >
                                                    {event.status === 'rejected' ? 'Fix & Resubmit' : 'Edit Request'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-card">
                            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white">No Events Yet</h3>
                            <p className="text-slate-400 mb-6">Start by hosting your first event on campus.</p>
                            <button onClick={() => setActiveTab('create')} className="btn-primary">Create Event</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;

