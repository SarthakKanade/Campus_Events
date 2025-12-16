import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, ArrowLeft, Zap, CheckCircle, List } from 'lucide-react';
import format from 'date-fns/format';
import { QRCodeCanvas } from 'qrcode.react';
import ReactStars from "react-rating-stars-component";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { motion, useScroll, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import ChillButton from '../components/ChillButton';
import SocialProof from '../components/SocialProof';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);
    const [attendeeStatus, setAttendeeStatus] = useState(null); // 'pending', 'accepted', 'rejected'

    // Parallax Scroll
    const { scrollY } = useScroll();
    const yRange = useTransform(scrollY, [0, 300], [0, 150]);
    const opacityRange = useTransform(scrollY, [0, 300], [1, 0]);

    // UI State
    const [timeLeft, setTimeLeft] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRSVPModal, setShowRSVPModal] = useState(false);
    const [rsvpNote, setRsvpNote] = useState('');

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

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${id}`);
                setEvent(res.data);
                const myAttendance = res.data.attendees.find(attendee =>
                    (typeof attendee.user === 'object' ? attendee.user._id : attendee.user) === user.id
                );

                if (myAttendance) {
                    setIsAttending(true);
                    setAttendeeStatus(myAttendance.status); // 'pending' or 'accepted'
                } else {
                    setIsAttending(false);
                    setAttendeeStatus(null);
                }
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

    const handleRSVP = async (note = '') => {
        try {
            const config = { headers: { 'x-auth-token': user.token } };
            const res = await axios.post(`/api/events/${id}/rsvp`, { note }, config);

            if (res.data.status === 'not_attending') {
                setIsAttending(false);
                setAttendeeStatus(null);
                toast.info("RSVP Cancelled");
            } else {
                setIsAttending(true);
                setAttendeeStatus(res.data.status);

                if (res.data.status === 'pending') {
                    toast.info("Request sent! Awaiting approval.");
                } else {
                    toast.success("RSVP Confirmed!");
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#6366f1', '#fb7185', '#34d399']
                    });
                }
            }

            setEvent(prev => ({ ...prev, attendees: res.data.attendees }));
            setShowRSVPModal(false);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Action failed");
        }
    };

    const updateEventStatus = async (status) => {
        try {
            const config = { headers: { 'x-auth-token': user.token } };
            await axios.put(`/api/events/${id}`, { status }, config);
            toast.success(`Event marked as ${status}`);
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Status Update Failed"); }
    };

    const updateGallery = async (urlsString) => {
        try {
            const galleryImages = urlsString.split(',').map(s => s.trim()).filter(s => s);
            const config = { headers: { 'x-auth-token': user.token } };
            await axios.put(`/api/events/${id}`, { galleryImages }, config);
            toast.success("Gallery Updated");
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Gallery Update Failed"); }
    };

    const createPoll = async () => {
        try {
            const optionsArray = newPollOptions.split(',').map(s => s.trim());
            const config = { headers: { 'x-auth-token': user.token } };
            await axios.post(`/api/events/${id}/polls`, { question: newPollQ, options: optionsArray }, config);
            toast.success("Poll Created!");
            setNewPollQ(''); setNewPollOptions('');
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error("Poll Failed"); }
    };

    const votePoll = async (pollId, optionIndex) => {
        try {
            const config = { headers: { 'x-auth-token': user.token } };
            await axios.post(`/api/events/${id}/vote`, { pollId, optionIndex }, config);
            toast.success("Voted!");
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (e) { toast.error(e.response?.data?.msg || "Vote Failed"); }
    }

    const submitFeedback = async (newRating) => {
        try {
            const config = { headers: { 'x-auth-token': user.token } };
            await axios.post(`/api/events/${id}/feedback`, { rating: newRating, comment: "User Rating" }, config);
            toast.success("Thanks for your feedback!");
            const res = await axios.get(`/api/events/${id}`);
            setEvent(res.data);
        } catch (error) { toast.error(error.response?.data?.msg || "Failed to submit"); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-primary">Loading...</div>;
    if (!event) return null;

    const seatsLeft = event.capacity - event.attendees.length;
    const isFull = seatsLeft <= 0;

    // Check RSVP Deadline
    const isPastDeadline = event.rsvpDeadline ? new Date() > new Date(`${format(new Date(event.rsvpDeadline), 'yyyy-MM-dd')}T${event.rsvpDeadlineTime || '23:59'}`) : false;

    return (
        <div className="min-h-screen pb-12">

            {/* PARALLAX HERO SECTION */}
            <div className="relative h-[50vh] w-full overflow-hidden">
                <motion.div
                    style={{ y: yRange, opacity: opacityRange }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src={'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2000'} // Placeholder
                        alt="Event Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background"></div>
                </motion.div>

                <div className="absolute top-8 left-4 z-20">
                    <button onClick={() => navigate('/')} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full z-10 max-w-7xl mx-auto px-6 pb-12">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest bg-white text-slate-900 shadow-lg`}>
                            {event.status === 'completed' ? 'Completed' : 'Upcoming Experience'}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-heading font-black text-slate-800 mb-2 drop-shadow-sm">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-slate-700 font-medium text-lg">
                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {event.location}</span>
                            <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> {format(new Date(event.date), 'MMM do')} • {event.startTime}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 -mt-8 relative z-20">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Description */}
                    <div className="glass-panel p-8">
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-4">The Vibe</h3>
                        <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    {/* AGENDA */}
                    {event.agenda && event.agenda.length > 0 && (
                        <div className="glass-panel p-8">
                            <h3 className="text-2xl font-heading font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <List className="w-6 h-6 text-primary" /> Lineup
                            </h3>
                            <div className="space-y-6 pl-4 border-l-2 border-slate-200">
                                {event.agenda.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((item, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute -left-[21px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-primary"></div>
                                        <h4 className="text-lg font-bold text-slate-800">{item.title}</h4>
                                        <span className="text-sm font-bold text-primary block mb-1">
                                            {item.startTime} - {item.endTime}
                                        </span>
                                        <p className="text-slate-500">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* POLLS */}
                    {event.status !== 'completed' && (
                        <div className="glass-panel p-8 bg-gradient-to-br from-white to-primary/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-heading font-bold text-slate-800 flex items-center gap-2"><Zap className="text-yellow-500 w-6 h-6" /> Live Pulse</h3>
                            </div>

                            {/* Creator Tools */}
                            {(user.role === 'organizer' || user.role === 'admin') && (
                                <div className="bg-white/50 p-4 rounded-xl mb-6 border-2 border-dashed border-slate-300">
                                    <input className="input-chill mb-2" placeholder="Ask the crowd..." value={newPollQ} onChange={e => setNewPollQ(e.target.value)} />
                                    <div className="flex gap-2">
                                        <input className="input-chill" placeholder="Options (comma sep)" value={newPollOptions} onChange={e => setNewPollOptions(e.target.value)} />
                                        <ChillButton onClick={createPoll} variant="secondary" className="py-2 text-sm">Post</ChillButton>
                                    </div>
                                </div>
                            )}

                            {event.polls && event.polls.length > 0 ? (
                                <div className="space-y-4">
                                    {event.polls.map(poll => (
                                        <div key={poll._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="font-bold text-slate-800 mb-4 text-lg">{poll.question}</h4>
                                            <div className="space-y-3">
                                                {poll.options.map((opt, idx) => (
                                                    <div key={idx} className="relative h-10 group cursor-pointer rounded-lg bg-slate-100 overflow-hidden" onClick={() => !poll.voters.includes(user.id) && votePoll(poll._id, idx)}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(opt.votes / (poll.voters.length || 1)) * 100}%` }}
                                                            className="absolute inset-y-0 left-0 bg-primary/20"
                                                        />
                                                        <div className="absolute inset-0 flex justify-between items-center px-4">
                                                            <span className="font-medium text-slate-700 z-10">{opt.text}</span>
                                                            <span className="font-bold text-primary">{opt.votes}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">{poll.voters.length} votes</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic text-center">No active polls yet.</p>
                            )}
                        </div>
                    )}

                    {/* QR TICKET: Only if accepted */}
                    {isAttending && attendeeStatus === 'accepted' && event.status !== 'completed' && (
                        <div className="glass-panel p-8 flex flex-col items-center text-center border-2 border-dashed border-primary/30">
                            <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 transform rotate-2">
                                <QRCodeCanvas value={JSON.stringify({ eventId: event._id, userId: user.id })} size={180} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Gate Pass</h3>
                            <p className="text-slate-500 mb-4">Scan this to enter the venue.</p>
                            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">ID: {user.id.slice(-6)}</span>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 space-y-6">

                        {/* RSVP Card */}
                        <div className="glass-panel p-6 border-t-8 border-primary relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock className="w-24 h-24 text-primary" />
                            </div>

                            {event.status !== 'completed' && timeLeft && (
                                <div className="text-center mb-8 relative z-10">
                                    <p className="text-xs uppercase text-slate-400 tracking-widest font-bold mb-2">Happening In</p>
                                    <p className="text-3xl font-heading font-black text-slate-800">{timeLeft}</p>
                                </div>
                            )}

                            <div className="mb-8 relative z-10">
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-slate-500">Occupancy</span>
                                    <span className={isFull ? "text-red-500" : "text-primary"}>
                                        {isFull ? "SOLD OUT" : `${seatsLeft} spots left`}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(event.attendees.length / event.capacity) * 100}%` }}
                                        className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                                    ></motion.div>
                                </div>
                            </div>

                            <ChillButton
                                onClick={() => {
                                    if (isAttending) {
                                        handleRSVP(); // Cancel
                                    } else {
                                        if (event.requiresApproval) {
                                            setShowRSVPModal(true);
                                        } else {
                                            handleRSVP();
                                        }
                                    }
                                }}

                                disabled={event.status === 'completed' || (isFull && !isAttending) || (isPastDeadline && !isAttending)}
                                variant={event.status === 'completed' || (isPastDeadline && !isAttending) || isFull ? 'secondary' : isAttending ? 'accent' : 'primary'}
                                className="w-full"
                            >
                                {event.status === 'completed' ? 'Event Ended'
                                    : (isPastDeadline && !isAttending) ? 'RSVP Closed'
                                        : isAttending ? (
                                            attendeeStatus === 'pending' ? <><Clock className="w-5 h-5" /> Pending...</>
                                                : <><CheckCircle className="w-5 h-5" /> Going!</>
                                        )
                                            : isFull ? 'Waitlist Full'
                                                : event.requiresApproval ? 'Request to Join'
                                                    : 'RSVP Now'}
                            </ChillButton>
                        </div>

                        {/* Social Proof */}
                        <div className="glass-panel p-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Who's Coming</h4>
                            <SocialProof attendees={event.attendees} max={5} />
                        </div>

                        {/* Organizer Admin */}
                        {(user.role === 'organizer' || user.role === 'admin') && (
                            <div className="glass-panel p-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Control Deck</h4>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="w-full py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                >
                                    Update Status
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* EDIT MODAL */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Manage Event</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1">Status</label>
                                    <select
                                        className="input-chill"
                                        defaultValue={event.status}
                                        onChange={(e) => updateEventStatus(e.target.value)}
                                    >
                                        <option value="approved">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1">Gallery URLs</label>
                                    <textarea
                                        className="input-chill min-h-[100px]"
                                        placeholder="https://img1.jpg, https://img2.jpg"
                                        defaultValue={event.galleryImages?.join(', ')}
                                        onBlur={(e) => updateGallery(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setShowEditModal(false)} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* RSVP NOTE MODAL */}
            {
                showRSVPModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request to Join</h2>
                            <p className="text-slate-500 mb-6">The organizer needs to approve your request. Add a note?</p>

                            <textarea
                                className="input-chill min-h-[100px] mb-6"
                                placeholder="I'm super interested because..."
                                value={rsvpNote}
                                onChange={(e) => setRsvpNote(e.target.value)}
                            ></textarea>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowRSVPModal(false)} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800 transition">Cancel</button>
                                <ChillButton onClick={() => handleRSVP(rsvpNote)} variant="primary" className="px-6">Send Request</ChillButton>
                            </div>
                        </motion.div>
                    </div>
                )
            }

        </div >
    );
};

export default EventDetails;
