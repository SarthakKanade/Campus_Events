import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import SocialProof from './SocialProof';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

const EventCard3D = ({ title, date, location, image, attendees, onClick, eventType }) => {
    const { theme } = useTheme();
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useMotionTemplate`calc(${mouseYSpring} * -0.5deg)`;
    const rotateY = useMotionTemplate`calc(${mouseXSpring} * 0.5deg)`;

    const handleMouseMove = (e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct * 20); // Sensitivity
        y.set(yPct * 20);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Visual handling for notice events
    const isNotice = eventType === 'notice';
    const cardBg = isNotice ?
        (theme === 'dark' ? 'bg-slate-800 border-yellow-500/50' : 'bg-white border-yellow-500') :
        (theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white/20');

    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-800';

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
                x, // Added x for translation
                y, // Added y for translation
                z: 100, // Added z for initial depth
            }}
            whileHover={{ scale: 1.05, z: 150 }} // Added whileHover for interaction
            className={`relative w-80 h-96 rounded-3xl p-6 ${cardBg} backdrop-blur-md border shadow-xl flex flex-col justify-between overflow-hidden group ${isNotice ? 'cursor-default' : 'cursor-pointer'}`} // Updated className
            onClick={onClick}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            {/* NOTICE STRIP */}
            {isNotice && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-xs font-bold text-center py-1 uppercase tracking-widest z-20">
                    Important Notice
                </div>
            )}

            {/* NOTICE CONTENT OVERRIDE */}
            {isNotice ? (
                <div className="absolute inset-4 z-10 flex flex-col justify-center items-center text-center">
                    <div className="bg-yellow-500/10 p-4 rounded-full mb-4 ring-4 ring-yellow-500/20">
                        {/* We can import Megaphone or use text, let's keep it simple text or assume Megaphone is available if we imported it. 
                            Actually, simpler: just a big "NOTICE" text or similar. 
                            Wait, the user wants "just notice with dates and details".
                         */}
                        <span className="text-4xl">📢</span>
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>{date}</p>
                    <div className="w-12 h-1 bg-yellow-500/50 my-4 rounded-full"></div>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                        Click for details not available.
                        {/* Actually user said "just details". The card is small. 
                            Usually notices might be long. 
                            But for the card view, we just show title/date.
                         */}
                    </p>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            transform: "translateZ(50px)",
                            transformStyle: "preserve-3d",
                        }}
                        className="absolute inset-4 flex flex-col justify-end z-10"
                    >
                        <div className="bg-surface/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-black/5 dark:border-white/10">
                            <h3 className="text-xl font-heading font-bold text-text mb-1">{title}</h3>
                            <div className="flex justify-between items-center text-sm font-medium text-text/60">
                                <span>{date}</span>
                                <span>{location}</span>
                            </div>
                            <SocialProof attendees={attendees} />
                        </div>
                    </div>

                    <div className="absolute inset-0 z-0">
                        <OptimizedImage
                            src={image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'}
                            alt={title}
                            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </>
            )}

        </motion.div>
    );
};

export default EventCard3D;
