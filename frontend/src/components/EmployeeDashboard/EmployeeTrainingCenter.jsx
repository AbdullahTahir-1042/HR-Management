import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { motion } from 'framer-motion';
import { MonitorPlay, Loader2, Video, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from '../VideoPlayer';
import DocumentViewer from '../DocumentViewer';

const EmployeeTrainingCenter = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredVideos = videos.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MonitorPlay className="w-6 h-6 text-indigo-600" />
                        Training Center
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Browse and watch training materials assigned to your department.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search videos by title..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                            {video.resourceType === 'Document' ? (
                                <DocumentViewer documentUrl={video.documentUrl} title={video.title} />
                            ) : (
                                <VideoPlayer 
                                    fileId={video.fileId} 
                                    youtubeId={video.youtubeId}
                                    title={video.title} 
                                    thumbnail={video.thumbnail} 
                                />
                            )}
                            
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
