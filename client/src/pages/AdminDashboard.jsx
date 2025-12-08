import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, TrendingUp, AlertTriangle, BadgeCheck, XSquare } from 'lucide-react';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/events');
                setEvents(res.data);

                const pendingRes = await axios.get('http://localhost:5001/api/events/pending');
                setPendingEvents(pendingRes.data);
                if (pendingRes.data.length > 0) setActiveTab('governance');
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const approveEvent = async (id) => {
        try {
            await axios.put(`http://localhost:5001/api/events/${id}/approve`);
            toast.success("Event Approved & Published!");
            // Refresh
            const pendingRes = await axios.get('http://localhost:5001/api/events/pending');
            setPendingEvents(pendingRes.data);
            const res = await axios.get('http://localhost:5001/api/events');
            setEvents(res.data);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Approval Failed");
        }
    };

    const rejectEvent = async (id, reason) => {
        try {
            await axios.put(`http://localhost:5001/api/events/${id}/reject`, { reason });
            toast.info("Event Rejected.");
            // Refresh
            const pendingRes = await axios.get('http://localhost:5001/api/events/pending');
            setPendingEvents(pendingRes.data);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Rejection Failed");
        }
    };

    // Chart Data
    const barData = events.map(event => ({
        name: event.title.length > 10 ? event.title.slice(0, 10) + '...' : event.title,
        RSVP: event.attendees.length,
        Actual: event.attendees.filter(a => a.markedPresent).length
    }));

    // Calculate Stats
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const pendingCount = pendingEvents.length;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-24 min-h-screen text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <TrendingUp className="text-violet-500 w-8 h-8" /> Admin Command Center
                    </h1>
                    <p className="text-slate-400 mt-1">System wide governance and analytics.</p>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                        onClick={() => setActiveTab('governance')}
                        className={`px-6 py-2 rounded-md font-bold transition flex items-center gap-2 ${activeTab === 'governance' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <AlertTriangle className="w-4 h-4" /> Governance
                        {pendingCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{pendingCount}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-2 rounded-md font-bold transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Analytics
                    </button>
                </div>
            </div>

            {activeTab === 'governance' && (
                <div className="animate-fade-in-up">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" /> Pending Approvals
                    </h2>

                    {pendingEvents.length === 0 ? (
                        <div className="glass-card p-12 text-center text-slate-500">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/20" />
                            <p className="text-lg">All caught up! No events pending review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingEvents.map(event => (
                                <div key={event._id} className="glass-card p-6 border-l-4 border-yellow-500 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-yellow-500/10 p-20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-white mb-1">{event.title}</h3>
                                            <div className="text-sm text-slate-400 space-y-1 mb-4">
                                                <p>By: <span className="text-violet-400">{event.organizer?.name}</span></p>
                                                <p>{new Date(event.date).toLocaleDateString()} at {event.location}</p>
                                                <p>{event.startTime} - {event.endTime}</p>
                                                {/* Discontinuous Dates Badge */}
                                                {event.eventDates && event.eventDates.length > 1 && (
                                                    <p className="text-xs text-violet-400 font-bold bg-violet-500/10 inline-block px-2 py-1 rounded mt-1">
                                                        Multi-day ({event.eventDates.length} sessions)
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mb-3">
                                                "{event.description}"
                                            </p>

                                            {/* REQUEST NOTE */}
                                            {event.requestNote && (
                                                <div className="text-xs bg-blue-500/10 border border-blue-500/20 p-2 rounded text-blue-300 mb-2">
                                                    <strong>Note from Organizer:</strong> {event.requestNote}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-center gap-3 md:min-w-[140px]">
                                            <button
                                                onClick={() => approveEvent(event._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition"
                                            >
                                                <BadgeCheck className="w-5 h-5" /> Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt("Enter rejection reason:");
                                                    if (reason) rejectEvent(event._id, reason);
                                                }}
                                                className="bg-slate-700 hover:bg-red-900/50 hover:text-red-200 text-slate-300 px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                            >
                                                <XSquare className="w-5 h-5" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-violet-600/20 rounded-lg text-violet-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Total Events</p>
                                <h3 className="text-3xl font-bold text-white">{totalEvents}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-600/20 rounded-lg text-green-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Completed</p>
                                <h3 className="text-3xl font-bold text-white">{completedEvents}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex items-center gap-4">
                            <div className="p-3 bg-yellow-600/20 rounded-lg text-yellow-400">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm uppercase">Pending Action</p>
                                <h3 className="text-3xl font-bold text-white">{pendingCount}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6 md:p-8">
                            <h2 className="text-xl font-bold text-white mb-6">Attendance Efficiency</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis allowDecimals={false} stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="RSVP" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card p-6 md:p-8 flex flex-col justify-center items-center text-center">
                            <h2 className="text-xl font-bold text-white mb-2">Platform Growth</h2>
                            <p className="text-slate-400 mb-8">Events vs Participation</p>
                            <div className="relative w-48 h-48 rounded-full border-4 border-violet-500/20 flex items-center justify-center animate-pulse">
                                <div className="absolute inset-0 border-4 border-t-violet-500 rounded-full animate-spin"></div>
                                <div>
                                    <span className="text-3xl font-bold text-white">{events.reduce((acc, curr) => acc + curr.attendees.length, 0)}</span>
                                    <p className="text-xs text-slate-400 uppercase">Total RSVPs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
