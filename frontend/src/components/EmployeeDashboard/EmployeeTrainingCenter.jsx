import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { motion } from 'framer-motion';
import { MonitorPlay, Loader2, Video, Search, FileText, Image as ImageIcon, File } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from '../VideoPlayer';
import DocumentViewer from '../DocumentViewer';

const EmployeeTrainingCenter = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/training');
            setVideos(res.data);
        } catch (err) {
            toast.error('Failed to load training materials');
        } finally {
            setLoading(false);
        }
    };

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'All' || v.resourceType === filterType;
        return matchesSearch && matchesFilter;
    });

    const filterOptions = [
        { id: 'All', label: 'All', icon: MonitorPlay },
        { id: 'Video', label: 'Videos', icon: Video },
        { id: 'Document', label: 'Docs', icon: FileText },
        { id: 'PDF', label: 'PDFs', icon: File },
        { id: 'Image', label: 'Images', icon: ImageIcon },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen space-y-6">
            {/* Header */}
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Browse and watch training materials assigned to your department.
                </p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search materials by title..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                    {filterOptions.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = filterType === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => setFilterType(filter.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                    <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No training resources found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">You are all caught up! Check back later for new materials.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video, index) => (
                        <motion.div
                            key={video._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            <div className="relative">
                                {['Document', 'PDF', 'Image'].includes(video.resourceType) ? (
                                    <DocumentViewer documentUrl={video.documentUrl} title={video.title} type={video.resourceType} />
                                ) : (
                                    <VideoPlayer 
                                        fileId={video.fileId} 
                                        youtubeId={video.youtubeId}
                                        title={video.title} 
                                        thumbnail={video.thumbnail} 
                                    />
                                )}
                                <div className="absolute top-2 left-2 flex gap-1 z-10 pointer-events-none">
                                    <span className="pointer-events-auto px-2 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-indigo-700 dark:text-indigo-300 rounded-md shadow-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-indigo-100 dark:border-indigo-500/20">
                                        {video.resourceType === 'Video' && <Video className="w-3 h-3" />}
                                        {video.resourceType === 'Document' && <FileText className="w-3 h-3" />}
                                        {video.resourceType === 'PDF' && <File className="w-3 h-3" />}
                                        {video.resourceType === 'Image' && <ImageIcon className="w-3 h-3" />}
                                        {video.resourceType}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2" title={video.title}>{video.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
                                    {video.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeTrainingCenter;
