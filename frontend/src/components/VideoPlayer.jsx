import React, { useState, useRef, useEffect } from 'react';
import { Play, X, Maximize, Minimize, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoPlayer = ({ fileId, youtubeId, title, thumbnail }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

    // Build a secure embed URL with branding/info hidden
    const buildSecureVideoUrl = () => {
        if (youtubeId) {
            const params = new URLSearchParams({
                autoplay: '1',
                rel: '0',              // Don't show related videos
                modestbranding: '1',   // Minimal YouTube branding
                iv_load_policy: '3',   // Hide annotations
                fs: '1',              // Allow fullscreen
                controls: '1',         // Show player controls
                playsinline: '1',      // Play inline on mobile
            });
            return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
        }
        return `https://drive.google.com/file/d/${fileId}/preview`;
    };

    const extractYouTubeId = (url) => {
        if (!url) return null;
        try {
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
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

    // Handle native fullscreen toggle
    const toggleFullscreen = async () => {
        if (!playerContainerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await playerContainerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            // Fullscreen not supported or blocked
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Close player on Escape
    useEffect(() => {
        if (!isPlaying) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !document.fullscreenElement) {
                setIsPlaying(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]);

    // Block right-click on the player area
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

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
                        onContextMenu={handleContextMenu}
                    >
                        {/* Header bar */}
                        <div className="w-full max-w-6xl flex justify-between items-center mb-4 sm:mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h2 className="text-white text-lg sm:text-xl font-medium tracking-wide truncate pr-4">{title}</h2>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={toggleFullscreen}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-md group shadow-lg"
                                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                >
                                    {isFullscreen ? (
                                        <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                                <button 
                                    onClick={() => setIsPlaying(false)}
                                    className="p-2.5 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all duration-300 backdrop-blur-md z-50 group shrink-0 shadow-lg"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Video container with protective overlay */}
                        <motion.div 
                            ref={playerContainerRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative ring-1 ring-white/5"
                            onContextMenu={handleContextMenu}
                        >
                            <iframe
                                className="absolute top-0 left-0 w-full h-full border-0"
                                src={buildSecureVideoUrl()}
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                title={title}
                                allowFullScreen
                            ></iframe>

                            {/* 
                                Protective overlays to block YouTube's clickable UI elements:
                                - Top: Video title link + channel name link
                                - Bottom-left: Share button + Watch Later
                                - Bottom-right: "More videos" + channel thumb + YouTube logo
                                Core controls (play/pause, progress bar, volume, fullscreen) 
                                remain fully accessible in the center-bottom area.
                            */}
                            {youtubeId && (
                                <>
                                    {/* Top overlay — blocks title & channel links */}
                                    <div 
                                        className="absolute top-0 left-0 w-full z-10 cursor-default"
                                        style={{ height: '68px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
                                        onClick={(e) => e.stopPropagation()}
                                        onContextMenu={handleContextMenu}
                                    />
                                    {/* Bottom-left overlay — blocks Share & Watch Later */}
                                    <div 
                                        className="absolute bottom-0 left-0 z-10 cursor-default"
                                        style={{ height: '46px', width: '120px', background: 'transparent' }}
                                        onClick={(e) => e.stopPropagation()}
                                        onContextMenu={handleContextMenu}
                                    />
                                    {/* Bottom-right overlay — blocks YouTube logo, More videos, channel thumb */}
                                    <div 
                                        className="absolute bottom-0 right-0 z-10 cursor-default"
                                        style={{ height: '46px', width: '280px', background: 'transparent' }}
                                        onClick={(e) => e.stopPropagation()}
                                        onContextMenu={handleContextMenu}
                                    />
                                </>
                            )}
                        </motion.div>

                        {/* Security badge */}
                        <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Protected content • For internal training use only</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VideoPlayer;
