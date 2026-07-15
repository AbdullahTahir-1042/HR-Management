import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Calendar, User, Plus, Trash2, X, Loader2, ArrowLeft, Pencil, Check, CheckCheck, Eye } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AnnouncementPage = () => {
    const { user } = useContext(AuthContext);
    const isHR = user?.role === 'hr';

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [employees, setEmployees] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');

    const getToken = () =>
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('x-auth-token') ||
        localStorage.getItem('accessToken') ||
        null;

    const authHeaders = () => ({ headers: { 'x-auth-token': getToken() } });

    useEffect(() => {
        fetchAnnouncements();
        fetchEmployees();
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

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/users`, authHeaders());
            setEmployees(res.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const getReadByNames = (readByIds = []) => {
        return readByIds
            .map(id => {
                const emp = employees.find(e => e._id === id);
                return emp?.name || null;
            })
            .filter(Boolean);
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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) { setError('Title and message are required'); return; }
        try {
            setSubmitting(true);
            setError('');
            await axios.post(`${import.meta.env.VITE_API_URL}/announcements`, { title, message }, authHeaders());
            setTitle('');
            setMessage('');
            setShowForm(false);
            fetchAnnouncements();
        } catch (err) {
            const status = err.response?.status;
            const backendMsg = err.response?.data?.msg;
            setError(backendMsg ? `${backendMsg} (status ${status})` : 'Failed to create announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/announcements/${id}`, authHeaders());
            setAnnouncements(prev => prev.filter(a => a._id !== id));
            if (selected?._id === id) setSelected(null);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete announcement');
        }
    };

    const startEdit = () => {
        setEditTitle(selected.title);
        setEditMessage(selected.message);
        setEditError('');
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditError('');
    };

    const handleEdit = async () => {
        if (!editTitle.trim() || !editMessage.trim()) { setEditError('Title and message are required'); return; }
        try {
            setEditSubmitting(true);
            setEditError('');
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/announcements/${selected._id}`,
                { title: editTitle.trim(), message: editMessage.trim() },
                authHeaders()
            );
            const updated = res.data;
            setAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
            setSelected(updated);
            setIsEditing(false);
        } catch (err) {
            const backendMsg = err.response?.data?.msg;
            setEditError(backendMsg || 'Failed to update announcement');
        } finally {
            setEditSubmitting(false);
        }
    };

    if (selected) {
        const readByNames = getReadByNames(selected.readBy);
        const readCount = selected.readBy?.length || 0;
        const totalEmployees = employees.filter(e => e.role !== 'hr').length;

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
            >
                <button
                    onClick={() => { setSelected(null); setIsEditing(false); }}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Announcements
                </button>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                                <Megaphone size={20} />
                            </span>
                            {isEditing ? (
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-indigo-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="Announcement title"
                                    autoFocus
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>
                            )}
                        </div>

                        {isHR && (
                            <div className="flex items-center gap-2 shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
                                        >
                                            <X size={15} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleEdit}
                                            disabled={editSubmitting}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                        >
                                            {editSubmitting
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <Check size={15} />
                                            }
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={startEdit}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
                                        >
                                            <Pencil size={15} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selected._id)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={15} />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
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

                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editMessage}
                                onChange={(e) => setEditMessage(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 border border-indigo-300 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                                placeholder="Write your announcement..."
                            />
                            {editError && (
                                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {editError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {selected.message}
                        </p>
                    )}
                </div>

                {isHR && !isEditing && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Eye size={15} className="text-indigo-500" />
                                Read Receipts
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                readCount === totalEmployees && totalEmployees > 0
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500'
                            }`}>
                                {readCount} / {totalEmployees} read
                            </span>
                        </div>

                        {totalEmployees > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(readCount / totalEmployees) * 100}%` }}
                                />
                            </div>
                        )}

                        {readByNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {readByNames.map((name, idx) => (
                                    <span
                                        key={idx}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100"
                                    >
                                        <CheckCheck size={12} />
                                        {name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 font-medium">No one has read this announcement yet.</p>
                        )}

                        {totalEmployees > readCount && (
                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-400 font-medium mb-2">Haven't read yet:</p>
                                <div className="flex flex-wrap gap-2">
                                    {employees
                                        .filter(e => e.role !== 'hr' && !(selected.readBy || []).includes(e._id))
                                        .map(emp => (
                                            <span
                                                key={emp._id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200"
                                            >
                                                <User size={12} />
                                                {emp.name}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                    {announcements.length} Announcement{announcements.length !== 1 ? 's' : ''}
                </span>
                {isHR && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={16} />
                        New Announcement
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700">Create Announcement</h3>
                            <button
                                onClick={() => { setShowForm(false); setError(''); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Announcement title"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all resize-none"
                                />
                            </div>
                            {error && (
                                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setError(''); }}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-all"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    Publish
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        announcements.map(entry => {
                            const readCount = entry.readBy?.length || 0;
                            const totalEmps = employees.filter(e => e.role !== 'hr').length;
                            return (
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
                                                <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
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
                                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                                                    readCount === totalEmps && totalEmps > 0
                                                        ? 'text-emerald-500'
                                                        : 'text-slate-400'
                                                }`}>
                                                    <Eye size={12} />
                                                    {readCount}/{totalEmps} read
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isHR && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
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