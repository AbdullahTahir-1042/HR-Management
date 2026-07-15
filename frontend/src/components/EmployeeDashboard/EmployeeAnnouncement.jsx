import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Calendar, User, Trash2, Loader2, ArrowLeft, CheckCheck, Circle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AnnouncementPage = () => {
    const { user } = useContext(AuthContext);
    const isHR = user?.role === 'hr';

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('all');

    const getToken = () =>
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('x-auth-token') ||
        localStorage.getItem('accessToken') ||
        null;

    const authHeaders = () => ({ headers: { 'x-auth-token': getToken() } });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/announcements`, authHeaders());
            setAnnouncements(res.data);
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const isRead = (announcement) => {
        return announcement.readBy?.includes(user?.id);
    };

    const markAsRead = async (announcement) => {
        if (isRead(announcement)) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/announcements/${announcement._id}/read`,
                {},
                authHeaders()
            );
            setAnnouncements(prev =>
                prev.map(a =>
                    a._id === announcement._id
                        ? { ...a, readBy: [...(a.readBy || []), user?.id] }
                        : a
                )
            );
            if (selected?._id === announcement._id) {
                setSelected(prev => ({
                    ...prev,
                    readBy: [...(prev.readBy || []), user?.id]
                }));
            }
        } catch (err) {
            console.error('Error marking announcement as read:', err);
        }
    };

    const handleSelectAnnouncement = (entry) => {
        setSelected(entry);
        markAsRead(entry);
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

    const unreadCount = announcements.filter(a => !isRead(a)).length;

    const filteredAnnouncements = announcements.filter(a => {
        if (filter === 'unread') return !isRead(a);
        if (filter === 'read') return isRead(a);
        return true;
    });

    if (selected) {
        const selectedIsRead = isRead(selected);
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
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                                <Megaphone size={20} />
                            </span>
                            <h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                            selectedIsRead
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                            {selectedIsRead ? <CheckCheck size={13} /> : <Circle size={13} />}
                            {selectedIsRead ? 'Read' : 'Unread'}
                        </span>
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

                    {!selectedIsRead && (
                        <button
                            onClick={() => markAsRead(selected)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
                        >
                            <CheckCheck size={15} />
                            Mark as Read
                        </button>
                    )}
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
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                            {unreadCount} Unread
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {['all', 'unread', 'read'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                            filter === tab
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab}
                        {tab === 'unread' && unreadCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[10px]">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
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
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">
                                {filter === 'unread' ? 'All caught up! No unread announcements.' :
                                 filter === 'read' ? 'No read announcements yet.' :
                                 'No announcements yet.'}
                            </p>
                        </div>
                    ) : (
                        filteredAnnouncements.map(entry => {
                            const entryRead = isRead(entry);
                            return (
                                <div
                                    key={entry._id}
                                    onClick={() => handleSelectAnnouncement(entry)}
                                    className={`px-6 py-5 hover:bg-indigo-50/50 transition-colors group cursor-pointer ${
                                        !entryRead ? 'bg-blue-50/30' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                    <Megaphone size={15} />
                                                    {!entryRead && (
                                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                                                    )}
                                                </span>
                                                <h4 className={`text-sm truncate group-hover:text-indigo-600 transition-colors ${
                                                    entryRead ? 'font-semibold text-slate-600' : 'font-bold text-slate-800'
                                                }`}>
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
                                                {entryRead && (
                                                    <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                                        <CheckCheck size={12} />
                                                        Read
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity">→</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AnnouncementPage;