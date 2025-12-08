import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, Calendar as CalendarIcon, ArrowLeft, Users, Zap, CheckCircle, List } from 'lucide-react';
import format from 'date-fns/format';
import { QRCodeCanvas } from 'qrcode.react';
import ReactStars from "react-rating-stars-component";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);

    // UI State
    const [timeLeft, setTimeLeft] = useState('');
    const [showEditModal, setShowEditModal] = useState(false); // Restored

    // Polls
    const [newPollQ, setNewPollQ] = useState('');
    const [newPollOptions, setNewPollOptions] = useState('');

    const calculateTimeLeft = (eventDate, startTime) => {
        const eventDateTime = new Date(`${format(new Date(eventDate), 'yyyy-MM-dd')}T${startTime}`);
        const difference = +eventDateTime - +new Date();
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        return null;
    };

    useEffect(() => {
        if (event) {
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft(event.date, event.startTime));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [event]);

    // Data Fetching & Sync
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/events/${id}`);
                setEvent(res.data);
                const attending = res.data.attendees.some(attendee =>
                    (typeof attendee === 'object' ? attendee._id : attendee) === user.id
                );
                setIsAttending(attending);
            } catch (error) {
                console.error("Error fetching event", error);
                toast.error("Failed to load event details");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchEvent();
    }, [id, user, navigate]);


    // --- ACTION HANDLERS ---
    const handleRSVP = async () => {
        try {
            const res = await axios.post(`http://localhost:5001/api/events/${id}/rsvp`);
            if (res.data.status === 'attending') {
                setIsAttending(true);
                toast.success("RSVP Confirmed!");
            } else {
                setIsAttending(false);
                toast.info("RSVP Cancelled");
            }
            setEvent(prev => ({ ...prev, attendees: res.data.attendees }));
        } catch (error) {
            toast.error(error.response?.data?.msg || "Action failed");
        }
    };

    const updateEventStatus = async (status) => {
        try {
            await axios.put(`http://localhost:5001/api/events/${id}`, { status });
            toast.success(`Event marked as ${status}`);
            const res = await axios.get(`http://localhost:5001/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Status Update Failed"); }
    };

    const updateGallery = async (urlsString) => {
        try {
            const galleryImages = urlsString.split(',').map(s => s.trim()).filter(s => s);
            await axios.put(`http://localhost:5001/api/events/${id}`, { galleryImages });
            toast.success("Gallery Updated");
            const res = await axios.get(`http://localhost:5001/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Gallery Update Failed"); }
    };

    const createPoll = async () => {
        try {
            const optionsArray = newPollOptions.split(',').map(s => s.trim());
            await axios.post(`http://localhost:5001/api/events/${id}/polls`, { question: newPollQ, options: optionsArray });
            toast.success("Poll Created!");
            setNewPollQ(''); setNewPollOptions('');
            const res = await axios.get(`http://localhost:5001/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Poll Failed"); }
    };

    const votePoll = async (pollId, optionIndex) => {
        try {
            await axios.post(`http://localhost:5001/api/events/${id}/vote`, { pollId, optionIndex });
            toast.success("Voted!");
            const res = await axios.get(`http://localhost:5001/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error(e.response?.data?.msg || "Vote Failed"); }
    }

    const submitFeedback = async (newRating) => {
        try {
            // Hardcoded comment for speed in this iteration
            await axios.post(`http://localhost:5001/api/events/${id}/feedback`, { rating: newRating, comment: "User Rating" });
            toast.success("Thanks for your feedback!");
            const res = await axios.get(`http://localhost:5001/api/events/${id}`);
            setEvent(res.data);
        } catch (error) { toast.error(error.response?.data?.msg || "Failed to submit"); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-violet-500">Loading...</div>;
    if (!event) return null;

    const seatsLeft = event.capacity - event.attendees.length;
    const isFull = seatsLeft <= 0;

    return (
        <div className="pt-20 min-h-screen pb-12">

            {/* HERO SECTION */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                {/* Placeholder Gradient if no image (real app would use event.image) */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 opacity-80"></div>

                <div className="absolute bottom-0 left-0 w-full z-20 max-w-7xl mx-auto px-4 pb-8">
                    <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-1 text-slate-400 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" /> Back to Calendar
                    </button>
                    <div className="flex items-end gap-6">
                        {/* Date Badge */}
                        <div className="hidden md:flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 w-24 h-24 text-center">
                            <span className="text-violet-400 font-bold uppercase text-sm">{format(new Date(event.date), 'MMM')}</span>
                            <span className="text-4xl font-bold text-white">{format(new Date(event.date), 'dd')}</span>
                        </div>

                        <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${event.status === 'completed' ? 'bg-green-900/50 text-green-400' : 'bg-violet-600/20 text-violet-400'}`}>
                                {event.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{event.title}</h1>
                            <div className="flex items-center gap-4 text-slate-300">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-violet-500" /> {event.location}</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-violet-500" /> {event.startTime} - {event.endTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Main Info */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Description */}
                    <div className="glass-card p-6 md:p-8">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">About Event</h3>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                            {event.description}
                        </p>
                    </div>

                    {/* AGENDA TIMELINE */}
                    {event.agenda && event.agenda.length > 0 && (
                        <div className="glass-card p-6 md:p-8 animate-fade-in-up delay-100">
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2 border-b border-slate-700 pb-2">
                                <List className="w-5 h-5 text-violet-500" /> Event Schedule
                            </h3>
                            <div className="relative border-l-2 border-white/10 ml-3 space-y-10 pl-8 py-2">
                                {event.agenda.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((item, idx) => (
                                    <div key={idx} className="relative group">
                                        {/* Dot */}
                                        <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-violet-500 group-hover:bg-violet-500 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>

                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                                            <span className="font-mono text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 text-sm">
                                                {item.startTime || 'Time TBD'} {item.endTime ? `- ${item.endTime}` : ''}
                                            </span>
                                            <h4 className="text-lg font-bold text-white group-hover:text-violet-300 transition">{item.title}</h4>
                                        </div>
                                        {item.date && (
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">
                                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* POLLS */}
                    {event.status !== 'completed' && (
                        <div className="glass-card p-6 md:p-8">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400 w-5 h-5" /> Live Polls</h3>
                                {user.role === 'organizer' && <span className="text-xs text-slate-500">Organizer View</span>}
                            </div>

                            {/* Create Poll (Organizer) */}
                            {(user.role === 'organizer' || user.role === 'admin') && (
                                <div className="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700 border-dashed">
                                    <input className="input-dark w-full mb-2" placeholder="Ask a question..." value={newPollQ} onChange={e => setNewPollQ(e.target.value)} />
                                    <div className="flex gap-2">
                                        <input className="input-dark w-full" placeholder="Options (comma sep)" value={newPollOptions} onChange={e => setNewPollOptions(e.target.value)} />
                                        <button onClick={createPoll} className="btn-secondary whitespace-nowrap">Launch</button>
                                    </div>
                                </div>
                            )}

                            {event.polls && event.polls.length > 0 ? (
                                <div className="space-y-4">
                                    {event.polls.map(poll => (
                                        <div key={poll._id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                                            <h4 className="font-bold text-white mb-3">{poll.question}</h4>
                                            <div className="space-y-3">
                                                {poll.options.map((opt, idx) => (
                                                    <div key={idx} className="relative group cursor-pointer" onClick={() => !poll.voters.includes(user.id) && votePoll(poll._id, idx)}>
                                                        <div className="absolute inset-0 bg-violet-600/20 rounded-lg transition-all duration-500" style={{ width: `${(opt.votes / (poll.voters.length || 1)) * 100}%` }}></div>
                                                        <div className="relative p-2 flex justify-between items-center z-10 px-3">
                                                            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition">{opt.text}</span>
                                                            <span className="text-xs font-bold text-violet-300">{opt.votes}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 text-right text-xs text-slate-500">{poll.voters.length} votes total</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No active polls yet.</p>
                            )}
                        </div>
                    )}

                    {/* QR TICKET (Attending) */}
                    {isAttending && event.status !== 'completed' && (
                        <div className="glass-card p-8 flex flex-col items-center text-center border-violet-500/30 shadow-violet-500/10">
                            <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                                <QRCodeCanvas value={JSON.stringify({ eventId: event._id, userId: user.id })} size={200} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">Your Digital Ticket</h3>
                            <p className="text-slate-400 text-sm mb-4">Show this at the entrance.</p>
                            <p className="font-mono text-xs text-slate-600 bg-slate-900 px-3 py-1 rounded">ID: {user.id}</p>
                        </div>
                    )}

                    {/* COMPLETED: Gallery & Reviews */}
                    {event.status === 'completed' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Gallery */}
                            {event.galleryImages?.length > 0 && (
                                <div className="glass-card p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Highlights Gallery</h3>
                                    <ImageGallery items={event.galleryImages.map(url => ({ original: url, thumbnail: url }))} showPlayButton={false} />
                                </div>
                            )}

                            {/* Feedback */}
                            {isAttending && (
                                <div className="glass-card p-6 text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Rate this Event</h3>
                                    <div className="flex justify-center">
                                        <ReactStars count={5} onChange={submitFeedback} size={40} activeColor="#8b5cf6" color="#334155" />
                                    </div>
                                    <div className="mt-4 flex flex-col items-center">
                                        <div className="text-4xl font-bold text-white">{event.averageRating?.toFixed(1) || "-"}</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-widest">Average Rating</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Sticky Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">

                        {/* Action Box */}
                        <div className="glass-card p-6 border-t-4 border-violet-500">
                            {/* Countdown */}
                            {event.status !== 'completed' && timeLeft && (
                                <div className="text-center mb-6 pb-6 border-b border-slate-700">
                                    <p className="text-xs uppercase text-slate-400 tracking-widest mb-1">Starts In</p>
                                    <p className="text-3xl font-mono font-bold text-white">{timeLeft}</p>
                                </div>
                            )}

                            {/* Capacity Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Capacity</span>
                                    <span className={isFull ? "text-red-400 font-bold" : "text-violet-400 font-bold"}>
                                        {isFull ? "SOLD OUT" : `${seatsLeft} seats left`}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-violet-500'}`}
                                        style={{ width: `${(event.attendees.length / event.capacity) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Main Button */}
                            <button
                                onClick={handleRSVP}
                                disabled={event.status === 'completed' || (isFull && !isAttending)}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2
                                    ${event.status === 'completed' ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : isAttending ? 'bg-slate-800 border-2 border-green-500 text-green-500 hover:bg-green-500/10'
                                            : isFull ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500'}`}
                            >
                                {event.status === 'completed' ? 'Event Ended'
                                    : isAttending ? <><CheckCircle className="w-5 h-5" /> You are Going</>
                                        : isFull ? 'Waitlist Only'
                                            : 'RSVP NOW'}
                            </button>

                            {isAttending && event.status !== 'completed' && (
                                <p className="text-xs text-center text-slate-500 mt-4">
                                    You can cancel your reservation by clicking again.
                                </p>
                            )}
                        </div>

                        {/* ORGANIZER CONTROLS */}
                        {(user.role === 'organizer' || user.role === 'admin') && (
                            <div className="glass-card p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Organizer Tools</h4>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="w-full btn-secondary mb-2 text-sm"
                                >
                                    Manage Event Status
                                </button>
                                <p className="text-xs text-slate-500 text-center">
                                    Mark as completed to unlock the gallery and feedback.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* EDIT MODAL (Simplified) */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]">
                    <div className="glass-card p-8 w-full max-w-lg relative bg-slate-900">
                        <h2 className="text-2xl font-bold text-white mb-6">Update Event</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-400 block mb-1">Status</label>
                                <select
                                    className="input-dark w-full"
                                    defaultValue={event.status}
                                    onChange={(e) => updateEventStatus(e.target.value)}
                                >
                                    <option value="approved">Active (Approved)</option>
                                    <option value="completed">Completed (End Event)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-400 block mb-1">Gallery URLs</label>
                                <textarea
                                    className="input-dark w-full h-32 text-xs font-mono"
                                    placeholder="https://img1.jpg, https://img2.jpg"
                                    defaultValue={event.galleryImages?.join(', ')}
                                    onBlur={(e) => updateGallery(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setShowEditModal(false)} className="px-6 py-2 text-slate-400 hover:text-white font-bold transition">Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventDetails;
