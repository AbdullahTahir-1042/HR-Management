import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
const HolidayModal = ({ holiday, onClose, onSaved }) => {
    const isEdit = !!holiday;
    const [form, setForm] = useState({
        name:        holiday?.name        || '',
        startDate:   holiday?.startDate   || '',
        endDate:     holiday?.endDate     || '',
        description: holiday?.description || '',
        type:        holiday?.type        || 'public',
    });
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Calculate number of days between two dates
    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startD = new Date(start);
        const endD   = new Date(end);
        const diff   = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    const handleSubmit = async () => {
        if (!form.name.trim())            return setError('Holiday name is required.');
        if (!form.startDate)              return setError('Start date is required.');
        if (!form.endDate)                return setError('End date is required.');
        if (form.endDate < form.startDate) return setError('End date cannot be before start date.');
        setError('');
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put(`${import.meta.env.VITE_API_URL}/holidays/${holiday._id}`, form);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/holidays`, form);
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const TYPE_OPTIONS = ['public', 'optional', 'restricted'];
    const totalDays = calculateDays(form.startDate, form.endDate);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{ opacity: 0, scale: 0.95,    y: 16 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">
                        {isEdit ? 'Edit Holiday' : 'Add New Holiday'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1,  y:  0 }}
                            exit={{ opacity: 0,    y: -8 }}
                            className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 mb-4"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Fields */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Holiday Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Eid ul Fitr"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                    </div>

                    {/* Start & End Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                From <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                To <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                min={form.startDate}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Days Counter */}
                    {totalDays > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1,  y:  0 }}
                            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm rounded-xl px-4 py-2.5"
                        >
                            <Calendar size={15} />
                            <span className="font-bold">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                            <span className="text-indigo-400">of holiday</span>
                        </motion.div>
                    )}

                    {/* Type */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Type
                        </label>
                        <div className="flex gap-2">
                            {TYPE_OPTIONS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                                        form.type === t
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Optional note about this holiday..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                    >
                        <Check size={16} />
                        {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Holiday'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Type Badge ──────────────────────────────────────────────────────────────
const TYPE_STYLES = {
    public:     'bg-emerald-50 text-emerald-600 border-emerald-200',
    optional:   'bg-amber-50   text-amber-600   border-amber-200',
    restricted: 'bg-rose-50    text-rose-600    border-rose-200',
};

// ─── Main Component ──────────────────────────────────────────────────────────
const HRHolidayManagement = ({ holidays, fetchHolidays }) => {
    const [showModal,      setShowModal]      = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [deletingId,     setDeletingId]     = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const [year, month, day] = dateStr.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
    };

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startD = new Date(start);
        const endD   = new Date(end);
        const diff   = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        try {
            setDeletingId(id);
            await axios.delete(`${import.meta.env.VITE_API_URL}/holidays/${id}`);
            fetchHolidays();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete holiday.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaved = () => {
        setShowModal(false);
        setEditingHoliday(null);
        fetchHolidays();
    };

    const openAdd  = ()  => { setEditingHoliday(null); setShowModal(true); };
    const openEdit = (h) => { setEditingHoliday(h);    setShowModal(true); };

    return (
        <>
            <motion.div
                key="holidays"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Company Holidays</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} on the calendar
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                    >
                        <Plus size={16} />
                        Add Holiday
                    </button>
                </div>

                {/* Holiday List */}
                {holidays.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center">
                        <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
                            <Calendar size={32} className="text-indigo-400" />
                        </div>
                        <p className="text-slate-700 font-bold text-lg">No holidays added yet</p>
                        <p className="text-slate-400 text-sm mt-1">Click "Add Holiday" to create your first entry.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100">
                            <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">#</span>
                            <span className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Holiday</span>
                            <span className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">From</span>
                            <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">To</span>
                            <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Days</span>
                            <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</span>
                        </div>

                        {/* Rows */}
                        <AnimatePresence>
                            {holidays.map((h, index) => (
                                <motion.div
                                    key={h._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="grid grid-cols-12 px-6 py-4 border-b border-slate-50 hover:bg-slate-50/70 transition-colors items-center group"
                                >
                                    <span className="col-span-1 text-sm text-slate-400 font-bold">{index + 1}</span>

                                    <div className="col-span-3">
                                        <p className="text-sm font-bold text-slate-800">{h.name}</p>
                                        <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-lg border ${TYPE_STYLES[h.type] || TYPE_STYLES.public}`}>
                                            {h.type}
                                        </span>
                                    </div>

                                    <span className="col-span-3 text-sm text-slate-600 font-medium">
                                        {formatDate(h.startDate)}
                                    </span>

                                    <span className="col-span-2 text-sm text-slate-600 font-medium">
                                        {formatDate(h.endDate)}
                                    </span>

                                    <span className="col-span-1 text-sm font-bold text-indigo-600">
                                        {calculateDays(h.startDate, h.endDate)}d
                                    </span>

                                    <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(h)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(h._id)}
                                            disabled={deletingId === h._id}
                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <HolidayModal
                        holiday={editingHoliday}
                        onClose={() => { setShowModal(false); setEditingHoliday(null); }}
                        onSaved={handleSaved}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default HRHolidayManagement;