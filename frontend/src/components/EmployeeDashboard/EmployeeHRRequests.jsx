import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Send, Clock, CheckCircle,
    XCircle, AlertCircle, ChevronDown, FileText
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const REQUEST_TYPES = [
    'Attendance Correction',
    'Experience Letter',
    'Salary Slip',
    'Work From Home',
    'Other'
];

const STATUS_STYLES = {
    'Pending':   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   icon: Clock,         label: 'Pending'   },
    'In Review': { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    icon: AlertCircle,   label: 'In Review' },
    'Resolved':  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle,   label: 'Resolved'  },
    'Rejected':  { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    icon: XCircle,       label: 'Rejected'  },
};

const TYPE_COLORS = {
    'Attendance Correction': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'Experience Letter':     'bg-violet-50 text-violet-600 border-violet-200',
    'Salary Slip':           'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Work From Home':        'bg-amber-50 text-amber-600 border-amber-200',
    'Other':                 'bg-slate-50 text-slate-600 border-slate-200',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES['Pending'];
    const Icon = style.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            <Icon size={11} />
            {style.label}
        </span>
    );
};

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
    >
        <div className="bg-indigo-50 p-5 rounded-full mb-4">
            <ClipboardList size={30} className="text-indigo-300" />
        </div>
        <p className="text-slate-700 font-semibold">No requests submitted yet</p>
        <p className="text-slate-400 text-sm mt-1">Use the form above to submit your first HR request.</p>
    </motion.div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const EmployeeHRRequests = ({ requests = [], onSubmit, submitting }) => {
    const [form, setForm] = useState({ type: '', description: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.type) {
            return setError('Please select a request type.');
        }
        if (!form.description.trim()) {
            return setError('Please enter a description.');
        }

        const success = await onSubmit(form);
        if (success) {
            setForm({ type: '', description: '' });
        }
    };

    return (
        <motion.div
            key="hr-requests"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* ── Page Title ── */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
                    <ClipboardList size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">HR Requests</h1>
                    <p className="text-sm text-slate-400">Submit a request to the HR department</p>
                </div>
            </div>

            {/* ── Request Form ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-500" />
                    New Request
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Request Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Request Type
                        </label>
                        <div className="relative">
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
                            >
                                <option value="">Select a request type...</option>
                                {REQUEST_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe your request in detail..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-300"
                        />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-rose-500 text-xs font-semibold flex items-center gap-1.5"
                            >
                                <XCircle size={13} /> {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 hover:scale-105 disabled:scale-100"
                    >
                        <Send size={15} />
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* ── Request History ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <ClipboardList size={16} className="text-indigo-500" />
                    My Requests
                    {requests.length > 0 && (
                        <span className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                            {requests.length} total
                        </span>
                    )}
                </h2>

                {requests.length === 0 ? (
                    <EmptyState />
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                    >
                        {requests.map((req) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-100 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[req.type] || TYPE_COLORS['Other']}`}>
                                            {req.type}
                                        </span>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {formatDate(req.createdAt)}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                    {req.description}
                                </p>

                                {/* HR Note */}
                                {req.hrNote && (
                                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">HR Note</p>
                                        <p className="text-xs text-indigo-700 font-medium">{req.hrNote}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default EmployeeHRRequests;