import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, MonitorPlay, Loader2, AlertTriangle, Video, Search, Check, Play, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import VideoPlayer from '../VideoPlayer';
import DocumentViewer from '../DocumentViewer';

const HRTrainingManagement = () => {
    const [videos, setVideos] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        youtubeUrl: '',
        thumbnail: '',
        resourceType: 'Video',
        documentUrl: '',
        visibility: 'Everyone',
        department: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [videosRes, deptsRes] = await Promise.all([
                apiClient.get('/training/hr'),
                apiClient.get('/departments')
            ]);
            setVideos(videosRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            toast.error('Failed to load training data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async (video = null) => {
        // Refetch departments to ensure list is up-to-date
        try {
            const deptsRes = await apiClient.get('/departments');
            setDepartments(deptsRes.data);
        } catch (e) {
            console.error('Failed to update departments list');
        }

        if (video) {
            setEditingVideo(video);
            setFormData({
                title: video.title,
                description: video.description,
                youtubeUrl: video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : '',
                thumbnail: video.thumbnail || '',
                resourceType: video.resourceType || 'Video',
                documentUrl: video.documentUrl || '',
                visibility: video.visibility,
                department: video.department?._id || ''
            });
        } else {
            setEditingVideo(null);
            setFormData({
                title: '',
                description: '',
                youtubeUrl: '',
                thumbnail: '',
                resourceType: 'Video',
                documentUrl: '',
                visibility: 'Everyone',
                department: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVideo(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.visibility === 'Specific Department' && !formData.department) {
            return toast.error('Please select a department');
        }

        setIsSaving(true);
        try {
            if (editingVideo) {
                await apiClient.put(`/training/${editingVideo._id}`, formData);
                toast.success('Training resource updated successfully');
            } else {
                await apiClient.post('/training', formData);
                toast.success('Training resource added successfully');
            }
            fetchData();
            handleCloseModal();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to save training video');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Are you sure you want to delete this video?</p>
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-md"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmDelete(id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const confirmDelete = async (id) => {
        try {
            await apiClient.delete(`/training/${id}`);
            toast.success('Video deleted successfully');
            setVideos(videos.filter(v => v._id !== id));
        } catch (err) {
            toast.error('Failed to delete video');
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
                        Training Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage training materials and video resources for employees.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Resource
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search resources by title..."
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
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No resources found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Get started by adding a new training resource.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                        <motion.div
                            key={video._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                        >
                            <div className="relative">
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
                                <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-none">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(video); }}
                                        className="pointer-events-auto p-1.5 bg-white dark:bg-slate-800/90 backdrop-blur text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-md shadow-sm"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(video._id); }}
                                        className="pointer-events-auto p-1.5 bg-white dark:bg-slate-800/90 backdrop-blur text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-md shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1" title={video.title}>{video.title}</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                                    {video.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-auto">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${video.visibility === 'Everyone' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {video.visibility === 'Everyone' ? 'Everyone' : video.department?.name}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {editingVideo ? 'Edit Resource' : 'Add Resource'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Resource Type *</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.resourceType}
                                            onChange={e => setFormData({ ...formData, resourceType: e.target.value })}
                                        >
                                            <option value="Video">Video</option>
                                            <option value="Document">Document (PDF, Word, etc.)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Visibility *</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.visibility}
                                            onChange={e => setFormData({ ...formData, visibility: e.target.value, department: e.target.value === 'Everyone' ? '' : formData.department })}
                                        >
                                            <option value="Everyone">Everyone</option>
                                            <option value="Specific Department">Specific Department</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description *</label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>



                                {formData.visibility === 'Specific Department' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Assign to Department *</label>
                                        <select
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option value="">Select Department...</option>
                                            {departments.map(d => (
                                                <option key={d._id} value={d._id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}

                                {formData.resourceType === 'Video' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">YouTube URL *</label>
                                            <input
                                                type="url"
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.youtubeUrl}
                                                onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Paste any valid YouTube video URL or embed link.</p>
                                            
                                            {/* Live Thumbnail Preview */}
                                            {(() => {
                                                const url = formData.youtubeUrl;
                                                if (!url && !formData.thumbnail) return null;
                                                let yId = null;
                                                try {
                                                    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
                                                    const match = url.match(regExp);
                                                    yId = (match && match[2].length === 11) ? match[2] : null;
                                                } catch (e) {}
                                                
                                                if (yId || formData.thumbnail) {
                                                    return (
                                                        <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                                                            <div className="w-24 h-16 rounded overflow-hidden bg-black flex-shrink-0 relative">
                                                                <img 
                                                                    src={(() => {
                                                                        if (!formData.thumbnail) return `https://img.youtube.com/vi/${yId}/mqdefault.jpg`;
                                                                        try {
                                                                            const match = formData.thumbnail.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/);
                                                                            const thumbYId = (match && match[2].length === 11) ? match[2] : null;
                                                                            if (thumbYId) return `https://img.youtube.com/vi/${thumbYId}/mqdefault.jpg`;
                                                                        } catch (e) {}
                                                                        return formData.thumbnail;
                                                                    })()}
                                                                    className="w-full h-full object-cover" 
                                                                    alt="Preview" 
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-6 h-6 bg-white dark:bg-slate-800/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                                                        <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                                                                <span className="font-medium text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Valid Preview</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Thumbnail URL (Optional)</label>
                                            <input
                                                type="url"
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.thumbnail}
                                                onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Document URL *</label>
                                        <input
                                            type="url"
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.documentUrl}
                                            onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                            placeholder="https://drive.google.com/..."
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Paste a link to the document (e.g., Google Drive, SharePoint).</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900/50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        {isSaving ? 'Saving...' : (editingVideo ? `Update ${formData.resourceType}` : `Add ${formData.resourceType}`)}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HRTrainingManagement;
