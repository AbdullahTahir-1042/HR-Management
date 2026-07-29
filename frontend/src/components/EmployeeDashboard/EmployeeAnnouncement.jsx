import { useState, useEffect, useContext } from 'react';
import apiClient from '../../api/axiosClient';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, User, Loader2, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AnnouncementPage = ({ initialAnnouncements, onRefreshAnnouncements }) => {
    const { user } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState(initialAnnouncements || []);
    const [loading, setLoading] = useState(!initialAnnouncements);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (initialAnnouncements) {
            setAnnouncements(initialAnnouncements);
        }
    }, [initialAnnouncements]);

    useEffect(() => {
        if (!initialAnnouncements) {
            fetchAnnouncements();
        }
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/announcements');
            setAnnouncements(res.data);
            if (onRefreshAnnouncements) onRefreshAnnouncements();
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatDateLong = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-PK', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    if (selected) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
            >
                <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Announcements
                </button>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Megaphone size={20} />
                        </span>
                        <h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-medium text-slate-400 border-y border-slate-100 py-4">
                        <span className="flex items-center gap-1.5">
                            <User size={13} />
                            {selected.createdBy?.name || 'HR'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            {formatDateLong(selected.createdAt)}
                        </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {selected.message}
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                        {announcements.length} Announcement{announcements.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400">
                            <Loader2 size={32} className="mx-auto mb-4 animate-spin opacity-40" />
                            <p className="font-medium">Loading announcements...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No announcements yet.</p>
                        </div>
                    ) : (
                        announcements.map(entry => (
                            <div
                                key={entry._id}
                                onClick={() => setSelected(entry)}
                                className="px-6 py-5 hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                <Megaphone size={15} />
                                            </span>
                                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                {entry.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed pl-10 truncate">
                                            {entry.message}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 pl-10">
                                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                                <User size={12} />
                                                {entry.createdBy?.name || 'HR'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                                <Calendar size={12} />
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity">→</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AnnouncementPage;