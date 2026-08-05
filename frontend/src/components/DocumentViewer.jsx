import React, { useState } from 'react';
import { FileText, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentViewer = ({ documentUrl, title }) => {
    const [isViewing, setIsViewing] = useState(false);

    // Some URLs (like Google Drive viewing links) might need to be converted to preview links for iframes
    let embedUrl = documentUrl;
    if (documentUrl && documentUrl.includes('drive.google.com/file/d/')) {
        const match = documentUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            embedUrl = `https://drive.google.com/file/d/${match[1]}/preview?rm=minimal`;
        }
    }

    const toggleFullscreen = () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch((err) => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <>
            {/* The Thumbnail / Trigger Card */}
            <div 
                onClick={() => setIsViewing(true)}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                style={{ paddingTop: '56.25%' }}
            >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                        <FileText className="w-8 h-8 text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium text-indigo-900 line-clamp-2 px-4">
                        Click to view document
                    </span>
                </div>
            </div>

            {/* Fullscreen Document Viewer Modal */}
            <AnimatePresence>
                {isViewing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 md:p-8"
                        onClick={() => setIsViewing(false)}
                    >
                        <div 
                            className="w-full max-w-6xl flex justify-between items-center mb-4 sm:mb-6 px-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 truncate pr-4">
                                <h2 className="text-white text-lg sm:text-xl font-medium tracking-wide truncate">{title}</h2>
                                <a 
                                    href={documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium rounded-lg transition-colors backdrop-blur-md"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open in New Tab
                                </a>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button 
                                    onClick={toggleFullscreen}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-md z-50 group shadow-lg"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsViewing(false);
                                        if (document.fullscreenElement) {
                                            document.exitFullscreen();
                                        }
                                    }}
                                    className="p-2.5 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all duration-300 backdrop-blur-md z-50 group shadow-lg"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-6xl flex-1 bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative ring-1 ring-white/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Block the native Google Drive pop-out button to prevent accidental new tabs */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-transparent z-10" title="Pop-out disabled in embedded view" />
                            
                            <iframe
                                src={embedUrl}
                                className="w-full h-full border-0 rounded-2xl"
                                title={title}
                                allow="autoplay; encrypted-media; fullscreen"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DocumentViewer;
