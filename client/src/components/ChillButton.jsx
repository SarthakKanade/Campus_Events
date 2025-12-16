import React from 'react';
import { motion } from 'framer-motion';

const ChillButton = ({ children, onClick, variant = 'primary', className = '', type = 'button' }) => {
    const variants = {
        primary: 'bg-primary text-white shadow-[#4f46e5]',
        secondary: 'bg-white text-slate-800 border-2 border-slate-200 shadow-slate-300',
        accent: 'bg-accent text-slate-900 shadow-emerald-600',
        danger: 'bg-secondary text-white shadow-rose-600'
    };

    const baseStyle = variants[variant] || variants.primary;

    return (
        <motion.button
            type={type}
            onClick={onClick}
            className={`px-6 py-3 rounded-full font-heading font-bold text-lg tracking-wide uppercase shadow-[4px_4px_0px_0px] border-2 border-black/10 flex items-center justify-center gap-2 ${baseStyle} ${className}`}
            whileHover={{
                scale: 1.05,
                rotate: -2,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.95, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {children}
        </motion.button>
    );
};

export default ChillButton;
