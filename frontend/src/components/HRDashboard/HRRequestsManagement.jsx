import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Clock, CheckCircle, XCircle,
    AlertCircle, ChevronDown, User, Search
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Pending', 'In Review', 'Resolved', 'Rejected'];

const STATUS_STYLES = {
    'Pending':   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   icon: Clock        },
    'In Review': { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    icon: AlertCircle  },
    'Resolved':  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle  },
    'Rejected':  { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    icon: XCircle      },
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
            {status}
        </span>
    );
};

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
    >
        <div className="bg-indigo-50 p-5 rounded-full mb-4">
            <ClipboardList size={30} className="text-indigo-300" />
        </div>
        <p className="text-slate-700 font-semibold">No HR requests found</p>
        <p className="text-slate-400 text-sm mt-1">Employee requests will appear here.</p>
    </motion.div>
);

// ── Request Card ───────────────────────────────────────────────────────────────

const RequestCard = ({ request, onUpdate }) => {
    const [status, setStatus] = useState(request.status);
    const [hrNote, setHrNote] = useState(request.hrNote || '');
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onUpdate(request._id, { status, hrNote });
        setSaving(false);
        setExpanded(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-sm transition-all"
        >
            {/* ── Top Row ── */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 border border-indigo-200 shrink-0">
                        {request.employee?.name?.[0] || <User size={14} />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">
                            {request.employee?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                            {request.employee?.department || ''} · {request.employee?.email || ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[request.type] || TYPE_COLORS['Other']}`}>
                        {request.type}
                    </span>
                    <StatusBadge status={request.status} />
                    <span className="text-[11px] text-slate-400">{formatDate(request.createdAt)}</span>
                </div>
            </div>

            {/* ── Description ── */}
            <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 rounded-xl px-4 py-3">
                {request.description}
            </p>

            {/* ── HR Note (if exists) ── */}
            {request.hrNote && !expanded && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">HR Note</p>
                    <p className="text-xs text-indigo-700 font-medium">{request.hrNote}</p>
                </div>
            )}

            {/* ── Expand/Collapse Update Panel ── */}
            <div className="mt-3">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                    <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    {expanded ? 'Cancel' : 'Update Status'}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 space-y-3">
                                {/* Status Select */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Update Status
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map((s) => {
                                            const style = STATUS_STYLES[s];
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatus(s)}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                                        status === s
                                                            ? `${style.bg} ${style.text} ${style.border} scale-105`
                                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* HR Note */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        HR Note (optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={hrNote}
                                        onChange={(e) => setHrNote(e.target.value)}
                                        placeholder="Add a note for the employee..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 hover:scale-105 disabled:scale-100"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const HRRequestsManagement = ({ requests = [], onUpdate }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = requests.filter((r) => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesSearch =
            r.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.type?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const counts = {
        all:       requests.length,
        Pending:   requests.filter(r => r.status === 'Pending').length,
        'In Review': requests.filter(r => r.status === 'In Review').length,
        Resolved:  requests.filter(r => r.status === 'Resolved').length,
        Rejected:  requests.filter(r => r.status === 'Rejected').length,
    };

    return (
        <motion.div
            key="hr-requests-management"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* ── Page Title ── */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
                    <ClipboardList size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">HR Requests</h1>
                    <p className="text-sm text-slate-400">Manage and respond to employee requests</p>
                </div>
            </div>

            {/* ── Filters Row ── */}
            <div className="flex flex-wrap items-center gap-3">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                    />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    {['all', 'Pending', 'In Review', 'Resolved', 'Rejected'].map((s) => {
                        const style = s !== 'all' ? STATUS_STYLES[s] : null;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                                    statusFilter === s
                                        ? s === 'all'
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                            : `${style.bg} ${style.text} ${style.border}`
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {s === 'all' ? 'All' : s}
                                <span className="ml-1.5 bg-white/60 px-1.5 py-0.5 rounded-full text-[10px]">
                                    {counts[s]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Request List ── */}
            {filtered.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {filtered.map((req) => (
                        <RequestCard key={req._id} request={req} onUpdate={onUpdate} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default HRRequestsManagement;