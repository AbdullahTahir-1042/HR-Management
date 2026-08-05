import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoPlayer = ({ fileId, youtubeId, title, thumbnail }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // Prefer youtubeId if available, fallback to Google Drive fileId
    const videoUrl = youtubeId 
        ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`
        : `https://drive.google.com/file/d/${fileId}/preview`;

    const extractYouTubeId = (url) => {
        if (!url) return null;
        try {
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        } catch (e) {
            return null;
        }
    };

    let finalThumbnailUrl = null;
    if (thumbnail) {
        const thumbYtId = extractYouTubeId(thumbnail);
        if (thumbYtId) {
            finalThumbnailUrl = `https://img.youtube.com/vi/${thumbYtId}/hqdefault.jpg`;
        } else {
            finalThumbnailUrl = thumbnail;
        }
    } else if (youtubeId) {
        finalThumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }


    return (
        <>
            <div 
                onClick={() => setIsPlaying(true)}
                className="group relative w-full overflow-hidden rounded-xl bg-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                style={{ paddingTop: '56.25%' }}
            >
                {finalThumbnailUrl ? (
                    <img 
                        src={finalThumbnailUrl} 
                        alt={title} 
                        className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            // Fallback if hqdefault is not available
                            if (e.target.src.includes('hqdefault.jpg')) {
                                const yId = extractYouTubeId(thumbnail) || youtubeId;
                                if (yId) {
                                    e.target.src = `https://img.youtube.com/vi/${yId}/mqdefault.jpg`;
                                }
                            }
                        }}
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80" />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors duration-300 flex items-center justify-center">
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg"
                    >
                        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isPlaying && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 md:p-12"
                    >
                        <div className="w-full max-w-6xl flex justify-between items-center mb-4 sm:mb-6 px-2">
                            <h2 className="text-white text-lg sm:text-xl font-medium tracking-wide truncate pr-4">{title}</h2>
                            <button 
                                onClick={() => setIsPlaying(false)}
                                className="p-2.5 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all duration-300 backdrop-blur-md z-50 group shrink-0 shadow-lg"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative ring-1 ring-white/5"
                        >
                            <iframe
                                className="absolute top-0 left-0 w-full h-full border-0"
                                src={videoUrl}
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                title={title}
                                allowFullScreen
                            ></iframe>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VideoPlayer;
