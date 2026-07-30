import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarRange, Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
const LeaveTypeModal = ({ leaveType, onClose, onSaved }) => {
    const isEdit = !!leaveType;
    const [form, setForm] = useState({
        name:        leaveType?.name        || '',
        quota:       leaveType?.quota       || '',
        description: leaveType?.description || '',
    });
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.name.trim()) return setError('Leave type name is required.');
        if (form.quota === '' || form.quota === null || form.quota === undefined) {
            return setError('Quota (days per year) is required.');
        }
        const numQuota = Number(form.quota);
        if (isNaN(numQuota) || numQuota < 0 || numQuota > 365) {
            return setError('Quota must be between 0 and 365 days.');
        }

        setError('');
        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                quota: numQuota,
                description: form.description
            };

            if (isEdit) {
                await apiClient.put(`/leaves/types/${leaveType._id}`, payload);
            } else {
                await apiClient.post('/leaves/types', payload);
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

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
                        {isEdit ? 'Edit Leave Type' : 'Add New Leave Type'}
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
                        <label className="input-label">
                            Leave Type Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Sick Leave"
                            className="input-field"
                        />
                    </div>

                    {/* Quota */}
                    <div>
                        <label className="input-label">
                            Annual Quota (Days) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="quota"
                            value={form.quota}
                            onChange={handleChange}
                            placeholder="e.g. 10"
                            min="0"
                            className="input-field"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="input-label">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief details about who can request or constraints..."
                            className="input-field resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary flex-1"
                    >
                        <Check size={16} />
                        {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Type'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const HRLeaveTypeManagement = ({ leaveTypes, fetchLeaveTypes }) => {
    const [showModal,        setShowModal]        = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState(null);
    const [deletingId,       setDeletingId]       = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) return;
        try {
            setDeletingId(id);
            await apiClient.delete(`/leaves/types/${id}`);
            fetchLeaveTypes();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete leave type.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaved = () => {
        setShowModal(false);
        setEditingLeaveType(null);
        fetchLeaveTypes();
    };

    const openAdd  = ()  => { setEditingLeaveType(null); setShowModal(true); };
    const openEdit = (lt) => { setEditingLeaveType(lt);    setShowModal(true); };

    return (
        <>
            <motion.div
                key="leave-types"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Leave Type Configurations</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Configure standard categories and set annual day allocations.
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="btn-primary"
                    >
                        <Plus size={16} />
                        Add Leave Type
                    </button>
                </div>

                {/* Leave Types List */}
                {leaveTypes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center">
                        <div className="p-4 bg-indigo-50 rounded-2xl mb-4">
                            <CalendarRange size={32} className="text-indigo-400" />
                        </div>
                        <p className="text-slate-700 font-bold text-lg">No leave types defined</p>
                        <p className="text-slate-400 text-sm mt-1">Click "Add Leave Type" to set up your first category.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="table-container min-w-[768px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 px-6 py-3 table-header border-b-0">
                                <span className="col-span-1">#</span>
                                <span className="col-span-3">Leave Type</span>
                                <span className="col-span-2 text-center">Annual Quota</span>
                                <span className="col-span-4">Description</span>
                                <span className="col-span-2 text-right">Actions</span>
                            </div>

                            {/* Rows */}
                            <AnimatePresence>
                                {leaveTypes.map((lt, index) => (
                                    <motion.div
                                        key={lt._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="grid grid-cols-12 px-6 py-4 border-b border-slate-50 hover:bg-slate-50/70 transition-colors items-center group table-body"
                                    >
                                        <span className="col-span-1 text-sm text-slate-400 font-bold">{index + 1}</span>

                                        <div className="col-span-3">
                                            <p className="text-sm font-bold text-slate-800">{lt.name}</p>
                                        </div>

                                        <div className="col-span-2 text-center">
                                            <span className="badge-primary px-3 py-1 text-sm inline-block mx-auto">
                                                {lt.quota} Days
                                            </span>
                                        </div>

                                        <span className="col-span-4 text-xs text-slate-500 font-medium line-clamp-2 pr-4">
                                            {lt.description || '—'}
                                        </span>

                                        <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(lt)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                title="Edit Config"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lt._id)}
                                                disabled={deletingId === lt._id}
                                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-40"
                                                title="Delete Config"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <LeaveTypeModal
                        leaveType={editingLeaveType}
                        onClose={() => { setShowModal(false); setEditingLeaveType(null); }}
                        onSaved={handleSaved}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default HRLeaveTypeManagement;
