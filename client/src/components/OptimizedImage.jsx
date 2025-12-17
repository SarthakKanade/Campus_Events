import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

const OptimizedImage = ({ src, alt, className = '', fallbackSrc }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Loading Skeleton */}
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse z-10" />
            )}

            {/* Error State */}
            {hasError ? (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 z-20">
                    <ImageOff className="w-1/3 h-1/3" />
                </div>
            ) : (
                <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoading ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`w-full h-full object-cover`}
                />
            )}
        </div>
    );
};

export default OptimizedImage;
