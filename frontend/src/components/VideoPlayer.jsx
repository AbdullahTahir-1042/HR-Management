import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Maximize, Minimize, Shield, Lock, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '00:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
        return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
};

const VideoPlayer = ({ fileId, youtubeId, title, thumbnail }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [hasStarted, setHasStarted] = useState(false);
    
    const playerContainerRef = useRef(null);
    const iframeRef = useRef(null);
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const playbackRateRef = useRef(1);

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

    const parsedYoutubeId = youtubeId && youtubeId.includes('http') ? extractYouTubeId(youtubeId) : youtubeId;

    // Controls=0 completely removes YouTube's native control bar, logo, and "More videos" shelf
    const buildVideoUrl = () => {
        if (parsedYoutubeId) {
            const params = new URLSearchParams({
                enablejsapi: '1',
                autoplay: '0',
                rel: '0',
                modestbranding: '1',
                iv_load_policy: '3',
                fs: '0',
                controls: '0', // Zero YouTube controls — custom HR controls only
                disablekb: '1',
                playsinline: '1',
                origin: window.location.origin,
            });
            return `https://www.youtube.com/embed/${parsedYoutubeId}?${params.toString()}`;
        }
        return `https://drive.google.com/file/d/${fileId}/preview`;
    };

    let finalThumbnailUrl = null;
    if (thumbnail) {
        const thumbYtId = extractYouTubeId(thumbnail);
        if (thumbYtId) {
            finalThumbnailUrl = `https://img.youtube.com/vi/${thumbYtId}/maxresdefault.jpg`;
        } else {
            finalThumbnailUrl = thumbnail;
        }
    } else if (parsedYoutubeId) {
        finalThumbnailUrl = `https://img.youtube.com/vi/${parsedYoutubeId}/maxresdefault.jpg`;
    }

    // Timer loop for real-time smooth progress tracking while playing
    useEffect(() => {
        if (!isPlaying || isSeeking) return;
        const interval = setInterval(() => {
            if (currentTimeRef.current < (durationRef.current || 99999)) {
                const nextTime = currentTimeRef.current + 0.25 * playbackRateRef.current;
                currentTimeRef.current = nextTime;
                setCurrentTime(nextTime);
            }
        }, 250);

        return () => clearInterval(interval);
    }, [isPlaying, isSeeking]);

    // Listen to YouTube API postMessage events for playback state and time updates
    useEffect(() => {
        const handleMessage = (event) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data) return;

                // Time and state updates from YouTube API
                if ((data.event === 'infoDelivery' || data.event === 'initialDelivery') && data.info) {
                    if (data.info.currentTime !== undefined && !isSeeking) {
                        currentTimeRef.current = data.info.currentTime;
                        setCurrentTime(data.info.currentTime);
                    }
                    if (data.info.duration !== undefined && data.info.duration > 0) {
                        durationRef.current = data.info.duration;
                        setDuration(data.info.duration);
                    }
                    if (data.info.playerState !== undefined) {
                        // 1 = playing, 2 = paused, 0 = ended
                        if (data.info.playerState === 1) {
                            setIsPlaying(true);
                        } else if (data.info.playerState === 2) {
                            setIsPlaying(false);
                        } else if (data.info.playerState === 0) {
                            setIsPlaying(false);
                            currentTimeRef.current = 0;
                            setCurrentTime(0);
                        }
                    }
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isSeeking]);

    // Send postMessage command to YouTube iframe
    const sendIframeCommand = (func, args = []) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func, args }),
                '*'
            );
        }
    };

    const handlePlayPauseToggle = () => {
        if (isPlaying) {
            setIsPlaying(false);
            sendIframeCommand('pauseVideo');
        } else {
            setIsPlaying(true);
            sendIframeCommand('playVideo');
        }
    };

    const handleSeekChange = (e) => {
        const newTime = parseFloat(e.target.value);
        currentTimeRef.current = newTime;
        setCurrentTime(newTime);
    };

    const handleSeekMouseUp = (e) => {
        const newTime = parseFloat(e.target.value);
        currentTimeRef.current = newTime;
        setCurrentTime(newTime);
        setIsSeeking(false);
        sendIframeCommand('seekTo', [newTime, true]);
    };

    const handleSeekMouseDown = () => {
        setIsSeeking(true);
    };

    const handleSkip = (seconds) => {
        const maxDur = durationRef.current || duration || 3600;
        const newTime = Math.max(0, Math.min(maxDur, currentTimeRef.current + seconds));
        currentTimeRef.current = newTime;
        setCurrentTime(newTime);
        sendIframeCommand('seekTo', [newTime, true]);
    };

    const togglePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        playbackRateRef.current = nextRate;
        sendIframeCommand('setPlaybackRate', [nextRate]);
    };

    const handleMuteToggle = () => {
        if (isMuted) {
            setIsMuted(false);
            sendIframeCommand('unMute');
        } else {
            setIsMuted(true);
            sendIframeCommand('mute');
        }
    };





    const toggleFullscreen = async () => {
        if (!playerContainerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await playerContainerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {}
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (!isModalOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !document.fullscreenElement) {
                handleCloseModal();
            } else if (e.key === ' ') {
                e.preventDefault();
                handlePlayPauseToggle();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleSkip(10);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleSkip(-10);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, isPlaying]);

    const handleCloseModal = () => {
        setIsPlaying(false);
        setHasStarted(false);
        sendIframeCommand('pauseVideo');
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Thumbnail Card */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="group relative w-full overflow-hidden rounded-xl bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 border border-slate-800"
                style={{ paddingTop: '56.25%' }}
            >
                {finalThumbnailUrl ? (
                    <img
                        src={finalThumbnailUrl}
                        alt={title}
                        loading="lazy"
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            if (e.target.src.includes('maxresdefault.jpg')) {
                                e.target.src = e.target.src.replace('maxresdefault', 'hqdefault');
                            }
                        }}
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/60 transition-colors duration-300 flex items-center justify-center">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-indigo-600/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/30"
                    >
                        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </motion.div>
                </div>
            </div>

            {/* Modal Player */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-3 sm:p-6 md:p-10"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Modal Top Navigation Bar */}
                        <div className="w-full max-w-5xl flex justify-between items-center mb-3 sm:mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                    <Shield className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-white text-base sm:text-lg font-semibold tracking-wide truncate max-w-xl">{title}</h2>
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <Lock className="w-3 h-3 text-emerald-400" /> Enterprise HR Portal • Private Employee Training
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full transition-all duration-300 border border-slate-700 shadow-md"
                                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                >
                                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2.5 bg-slate-800/80 hover:bg-rose-600 text-white rounded-full transition-all duration-300 border border-slate-700 shadow-md group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Main Custom Player Container */}
                        <motion.div
                            ref={playerContainerRef}
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-5xl aspect-video bg-slate-950 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] border border-slate-800 relative overflow-hidden flex flex-col group/player"
                        >
                            {/* HR Portal Top Header */}
                            <div className="w-full h-11 bg-slate-900 z-30 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase">HR Video Streaming Network</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-indigo-300 font-bold px-2.5 py-1 bg-indigo-950/80 rounded border border-indigo-700/50 uppercase tracking-widest">
                                        Private HR Player
                                    </span>
                                </div>
                            </div>

                            {/* Viewport Box (Strictly locked iframe with pointer-events: none) */}
                            <div className="relative flex-1 w-full overflow-hidden bg-black flex items-center justify-center">
                                {parsedYoutubeId ? (
                                    <div 
                                        className="absolute pointer-events-none"
                                        style={{
                                            top: '-15%',
                                            left: '-15%',
                                            width: '130%',
                                            height: '130%',
                                        }}
                                    >
                                        <iframe
                                            ref={iframeRef}
                                            className="absolute inset-0 w-full h-full border-0"
                                            src={buildVideoUrl()}
                                            allow="autoplay; encrypted-media; picture-in-picture"
                                            title={title}
                                            onLoad={() => {
                                                if (iframeRef.current && iframeRef.current.contentWindow) {
                                                    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
                                                }
                                            }}
                                        ></iframe>
                                    </div>
                                ) : (
                                    <iframe
                                        ref={iframeRef}
                                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                                        src={buildVideoUrl()}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        title={title}
                                        onLoad={() => {
                                            if (iframeRef.current && iframeRef.current.contentWindow) {
                                                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
                                            }
                                        }}
                                    ></iframe>
                                )}

                                {/* TRANSPARENT CLICK OVERLAY: Catches all video clicks so YouTube is NEVER touched directly */}
                                <div
                                    onClick={handlePlayPauseToggle}
                                    className="absolute inset-0 z-20 cursor-pointer"
                                />

                                {/* CUSTOM HR PAUSE SCREEN: Shows when paused */}
                                <AnimatePresence>
                                    {!isPlaying && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={handlePlayPauseToggle}
                                            className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
                                        >
                                            {finalThumbnailUrl && (
                                                <img
                                                    src={finalThumbnailUrl}
                                                    alt={title}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                                                />
                                            )}
                                            
                                            <div className="relative z-10 flex flex-col items-center max-w-lg">
                                                <motion.div
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="w-20 h-20 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.6)] border border-indigo-400/40 mb-5 transition-colors"
                                                >
                                                    <Play className="w-10 h-10 text-white ml-1.5" fill="currentColor" />
                                                </motion.div>

                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
                                                    HR Module Training
                                                </span>

                                                <h3 className="text-white text-xl font-bold tracking-tight mb-2">{title}</h3>
                                                <p className="text-slate-400 text-xs mb-6">
                                                    Click anywhere to watch video. Managed by HR Enterprise System.
                                                </p>

                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-300 text-xs font-medium">
                                                    <Shield className="w-4 h-4 text-emerald-400" />
                                                    <span>HR Portal Player • Secured Content</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* HR PORTAL CUSTOM CONTROL BAR (100% In-House Player Controls) */}
                            {parsedYoutubeId && (
                                <div className="w-full bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 z-30 flex flex-col gap-2 shrink-0">
                                    {/* Custom Scrub Progress Bar */}
                                    <div className="flex items-center gap-3 w-full group/slider cursor-pointer relative h-3">
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            step="0.1"
                                            value={currentTime}
                                            onMouseDown={handleSeekMouseDown}
                                            onMouseUp={handleSeekMouseUp}
                                            onChange={handleSeekChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative pointer-events-none z-10 group-hover/slider:h-2 transition-all border border-slate-700/50">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Controls Buttons Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <button
                                                onClick={handlePlayPauseToggle}
                                                className="p-1.5 text-white hover:text-indigo-400 transition-colors"
                                                title={isPlaying ? 'Pause' : 'Play'}
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                                            </button>

                                            <button
                                                onClick={() => handleSkip(-10)}
                                                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                                                title="Rewind 10s"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleSkip(10)}
                                                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                                                title="Forward 10s"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={handleMuteToggle}
                                                className="p-1.5 text-slate-300 hover:text-white transition-colors ml-1"
                                                title={isMuted ? 'Unmute' : 'Mute'}
                                            >
                                                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                                            </button>

                                            <span className="text-slate-300 text-xs font-medium tracking-wide">
                                                {formatTime(currentTime)} <span className="text-slate-600 mx-1">/</span> {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Speed Selector Button */}
                                            <button
                                                onClick={togglePlaybackRate}
                                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold text-slate-200 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
                                                title="Playback Speed"
                                            >
                                                <span>{playbackRate}x</span>
                                            </button>

                                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                                                <Shield className="w-3 h-3" /> HR Secured Stream
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="mt-3 text-slate-500 text-xs flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Enterprise HR Player • Protected Training Module</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VideoPlayer;
