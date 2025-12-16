import { motion } from 'framer-motion';

const SocialProof = ({ attendees = [], max = 3 }) => {
    if (!attendees || attendees.length === 0) return null;

    const visibleAttendees = attendees.slice(0, max);
    const overflow = attendees.length - max;

    return (
        <div className="flex items-center -space-x-3 mt-3">
            {visibleAttendees.map((att, index) => (
                <div
                    key={att._id || index}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden relative z-10"
                    title={att.user?.name || 'Student'}
                >
                    {att.user?.avatar ? (
                        <img src={att.user.avatar} alt={att.user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-[10px] font-bold text-white">
                            {att.user?.name?.charAt(0) || '?'}
                        </div>
                    )}
                </div>
            ))}
            {overflow > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 relative z-20">
                    +{overflow}
                </div>
            )}
            <span className="ml-4 text-xs font-bold text-text/60">
                {visibleAttendees.length === 1 && overflow === 0 ? "is going" : "are going"}
            </span>
        </div>
    );
};

export default SocialProof;
