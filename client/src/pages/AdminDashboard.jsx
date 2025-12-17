import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, TrendingUp, AlertTriangle, BadgeCheck, XSquare, Plus, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import ChillButton from '../components/ChillButton';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');

    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [selectedEventToReject, setSelectedEventToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // NOTICE FORM STATE
    const [noticeForm, setNoticeForm] = useState({ title: '', description: '', date: '', location: 'Campus-wide' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/events');
                setEvents(res.data);

                const pendingRes = await axios.get('/api/events/pending');
                setPendingEvents(pendingRes.data);
                if (pendingRes.data.length > 0 && activeTab !== 'governance') setActiveTab('governance');
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateNotice = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...noticeForm,
                eventType: 'notice',
                status: 'approved',
                category: 'Other', // or 'Notice' if we add it to enum, keeping generic for now
                startTime: '00:00',
                endTime: '23:59',
                capacity: 0 // Irrelevant for notices
            }
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/events/notice', payload, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Notice Posted!");
            setEvents([...events, res.data]);
            setShowNoticeModal(false);
            setNoticeForm({ title: '', description: '', date: '', location: 'Campus-wide' });
        } catch (error) {
            toast.error("Failed to post notice");
        }
    };

    const approveEvent = async (id) => {
        try {
            await axios.put(`/api/events/${id}/approve`);
            toast.success("Event Approved & Published!");
            // Refresh
            const pendingRes = await axios.get('/api/events/pending');
            setPendingEvents(pendingRes.data);
            const res = await axios.get('/api/events');
            setEvents(res.data);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Approval Failed");
        }
    };

    const handleUpdateStatus = async (id, status, reason = null) => {
        try {
            // For admin approval, we set it to 'admin_approved' so organizer can have final say/publish
            // Or 'approved' if we want to skip that step for legacy support, but tasks said 'admin_approved' flow.
            // Let's stick to 'admin_approved' which allows organizer to publish.
            // Wait, if I change it to 'admin_approved', existing frontend logic in StudentDashboard might hide it?
            // StudentDashboard fetches default? It fetches 'approved'.
            // So 'admin_approved' events won't show up for students yet. This is correct.
            // OrganizerDashboard shows 'admin_approved' and offers 'Publish' button which sets to 'approved'.

            const targetStatus = status === 'approved' ? 'admin_approved' : status;

            const payload = { status: targetStatus };
            if (reason) payload.rejectionReason = reason;

            const res = await axios.put(`/api/events/${id}`, payload);

            setEvents(events.map(event => event._id === id ? res.data : event));
            toast.success(`Event ${status === 'rejected' ? 'Rejected' : 'Approved'}`);
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedEventToReject(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const initiateRejection = (event) => {
        setSelectedEventToReject(event);
        setShowRejectModal(true);
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-primary">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-24 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <h1 className="text-3xl font-heading font-black text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-primary w-8 h-8" /> Command Center
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">System governance and pulse.</p>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex bg-white/50 p-1.5 rounded-2xl border border-white/40 shadow-sm"
                >
                    <button
                        onClick={() => setActiveTab('governance')}
                        className={`px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'governance' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <AlertTriangle className="w-4 h-4" /> Governance
                        {pendingCount > 0 && (
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1"
                            >
                                {pendingCount}
                            </motion.span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Analytics
                    </button>
                    <button
                        onClick={() => setShowNoticeModal(true)}
                        className={`px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-white/50 border-l border-slate-200 ml-2 pl-6`}
                    >
                        <Megaphone className="w-4 h-4 text-orange-400" /> Post Notice
                    </button>
                    <button
                        onClick={() => setActiveTab('notices')}
                        className={`px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'notices' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        <Megaphone className="w-4 h-4" /> Notices
                    </button>
                </motion.div>
            </div>

            {activeTab === 'governance' && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" /> Pending Approvals
                    </h2>

                    {pendingEvents.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-slate-400">
                            <motion.div
                                animate={{ scale: [0.9, 1.1, 0.9] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="inline-block"
                            >
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
                            </motion.div>
                            <p className="text-lg font-medium">All caught up! The queue is clear.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingEvents.map(event => (
                                <motion.div key={event._id} variants={itemVariants} className="glass-panel p-6 border-l-4 border-yellow-500 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-yellow-500/10 p-20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-heading font-bold text-xl text-slate-800 mb-1">{event.title}</h3>
                                            <div className="text-sm text-slate-500 space-y-1 mb-4 font-medium">
                                                <p>By: <span className="text-primary">{event.organizer?.name}</span></p>
                                                <p>{new Date(event.date).toLocaleDateString()} at {event.location}</p>
                                                <p>{event.startTime} - {event.endTime}</p>
                                            </div>

                                            <p className="text-slate-600 text-sm bg-white/50 p-3 rounded-xl border border-white/40 mb-3 italic">
                                                "{event.description}"
                                            </p>
                                        </div>

                                        <div className="flex flex-col justify-center gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleUpdateStatus(event._id, 'approved')}
                                                className="bg-green-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                                            >
                                                <BadgeCheck className="w-5 h-5" /> Approve
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => initiateRejection(event)}
                                                className="bg-white text-slate-500 border-2 border-slate-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                            >
                                                <XSquare className="w-5 h-5" /> Reject
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* REJECTION MODAL */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Reject Event</h2>
                        <p className="text-slate-500 mb-6">Please provide a reason for rejection to help the organizer.</p>

                        <textarea
                            className="input-chill min-h-[120px] mb-6"
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition">Cancel</button>
                            <ChillButton onClick={() => handleUpdateStatus(selectedEventToReject._id, 'rejected', rejectionReason)} variant="primary" className="px-6 bg-red-500 hover:bg-red-600 shadow-red-500/30">Reject Event</ChillButton>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* NOTICE MODAL */}
            {showNoticeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-hidden relative"
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-yellow-400"></div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Megaphone className="text-orange-400" /> Create Public Notice</h2>

                        <form onSubmit={handleCreateNotice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Notice Title</label>
                                <input
                                    type="text"
                                    className="input-chill w-full bg-slate-50 border-slate-200 text-slate-800"
                                    placeholder="e.g. Campus Closed for Holiday"
                                    required
                                    value={noticeForm.title}
                                    onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="input-chill w-full bg-slate-50 border-slate-200 text-slate-800"
                                        required
                                        value={noticeForm.date}
                                        onChange={e => setNoticeForm({ ...noticeForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Location / Scope</label>
                                    <input
                                        type="text"
                                        className="input-chill w-full bg-slate-50 border-slate-200 text-slate-800"
                                        value={noticeForm.location}
                                        onChange={e => setNoticeForm({ ...noticeForm, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Details</label>
                                <textarea
                                    className="input-chill w-full bg-slate-50 border-slate-200 text-slate-800 min-h-[100px]"
                                    placeholder="Enter detailed information..."
                                    required
                                    value={noticeForm.description}
                                    onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowNoticeModal(false)} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition">Cancel</button>
                                <ChillButton type="submit" variant="primary" className="px-8 bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 text-white">Post Notice</ChillButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div variants={itemVariants} className="glass-panel p-6 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Events</p>
                                <h3 className="text-3xl font-heading font-black text-slate-800">{totalEvents}</h3>
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="glass-panel p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</p>
                                <h3 className="text-3xl font-heading font-black text-slate-800">{completedEvents}</h3>
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="glass-panel p-6 flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</p>
                                <h3 className="text-3xl font-heading font-black text-slate-800">{pendingCount}</h3>
                            </div>
                        </motion.div>
                    </div>

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div variants={itemVariants} className="glass-panel p-6 md:p-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Engagement Overview</h2>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="RSVP" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                        <Bar dataKey="Actual" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-panel p-6 md:p-8 flex flex-col justify-center items-center text-center">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Total RSVP's</h2>
                            <p className="text-slate-400 mb-8 font-medium">Growth Monitor</p>
                            <div className="relative w-48 h-48 rounded-full border-4 border-primary/10 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-t-primary rounded-full"
                                ></motion.div>
                                <div>
                                    <span className="text-4xl font-heading font-black text-slate-800">{events.reduce((acc, curr) => acc + curr.attendees.length, 0)}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {
                activeTab === 'notices' && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <Megaphone className="text-orange-500" /> Public Notices
                        </h2>

                        {events.filter(e => e.eventType === 'notice').length === 0 ? (
                            <div className="glass-panel p-12 text-center text-slate-400">
                                <p className="text-lg font-medium">No active notices.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.filter(e => e.eventType === 'notice').map(notice => (
                                    <motion.div key={notice._id} variants={itemVariants} className="glass-panel p-6 border-l-4 border-orange-500 relative group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{notice.title}</h3>
                                                <p className="text-xs text-slate-500">{new Date(notice.date).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete this notice?')) {
                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            await axios.delete(`/api/events/${notice._id}`, { headers: { 'x-auth-token': token } });
                                                            toast.success('Notice Deleted');
                                                            setEvents(events.filter(e => e._id !== notice._id));
                                                        } catch (e) {
                                                            toast.error('Failed to delete');
                                                        }
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                                title="Delete Notice"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100">
                                                    <XSquare className="w-5 h-5" />
                                                </div>
                                            </button>
                                        </div>
                                        <p className="text-slate-600 text-sm">{notice.description}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                            <span className="uppercase tracking-wider">Scope:</span> {notice.location || 'Campus-wide'}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
