import React, { useState, useEffect, useContext, useMemo } from 'react';
import apiClient from '../../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import {
    Users, Crown, AlertTriangle, BookOpen, TrendingUp,
    Calendar, UserCircle, Building2, CheckCircle,
    Loader2, X, RotateCcw, ChevronDown, ChevronUp, FileText, Search,
    Sparkles, Eye, ChevronLeft, ChevronRight, User, Clock, UserCheck
} from 'lucide-react';

// ─── Animated Number ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => (
    <motion.span
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
        {value}
    </motion.span>
);

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = 'sm' }) => {
    const config = {
        resolved: {
            gradient: 'bg-gradient-to-r from-emerald-50 to-teal-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200/80',
            dot: 'bg-emerald-500',
            label: 'Resolved'
        },
        pending: {
            gradient: 'bg-gradient-to-r from-amber-50 to-orange-50',
            text: 'text-amber-700',
            border: 'border-amber-200/80',
            dot: 'bg-amber-500',
            label: 'Pending'
        },
    };
    const c = config[status] || config.pending;
    const sizeClasses = size === 'lg'
        ? 'text-xs px-3.5 py-1.5 gap-2'
        : 'text-[10.5px] px-2.5 py-1 gap-1.5';
    return (
        <span className={`inline-flex items-center font-bold rounded-full uppercase tracking-wider border ${c.gradient} ${c.text} ${c.border} ${sizeClasses}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'pending' ? 'animate-pulse' : ''}`} />
            {c.label}
        </span>
    );
};

// ─── Info Chip ────────────────────────────────────────────────────────────────
const InfoChip = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/70 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100/80">
            <Icon size={14} className="text-slate-500" />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-[13px] font-bold text-slate-800 mt-0.5 truncate">{value || '—'}</p>
        </div>
    </div>
);

// ─── Detail Description Block ────────────────────────────────────────────────
const DetailBlock = ({ icon: Icon, label, value, accentColor }) => {
    if (!value) return null;
    const styles = {
        rose:    { bg: 'bg-rose-50/70',    border: 'border-rose-100',    iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',    labelColor: 'text-rose-600' },
        indigo:  { bg: 'bg-indigo-50/70',  border: 'border-indigo-100',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  labelColor: 'text-indigo-600' },
        emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', labelColor: 'text-emerald-600' },
    };
    const s = styles[accentColor] || styles.rose;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}
        >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/60">
                <div className={`p-1 rounded-md ${s.iconBg}`}>
                    <Icon size={12} className={s.iconColor} />
                </div>
                <p className={`text-[10.5px] font-bold uppercase tracking-wider ${s.labelColor}`}>{label}</p>
            </div>
            <div className="px-4 py-3 text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                {value}
            </div>
        </motion.div>
    );
};

// ─── Member Card ─────────────────────────────────────────────────────────────

const MemberCard = ({ member, isLead, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
            ${isLead ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
            {member.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                {isLead && (
                    <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                        <Crown size={9} /> Team Lead
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-400 capitalize">{member.status || 'Employee'}</p>
        </div>
    </motion.div>
);

// ─── Submit Report Modal ──────────────────────────────────────────────────────

const EMPTY_FORM = {
    agentName: '',
    patientName: '',
    clinicName: '',
    dateOfMistake: '',
    mistakeDescription: '',
    learning: '',
    improvement: '',
};

const ReportModal = ({ members, onClose, onSuccess }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/mistake-reports', form);
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        <h3 className="font-bold text-slate-800">Submit Team Report</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {submitted ? (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={28} className="text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg">Report Submitted!</h4>
                        <p className="text-sm text-slate-500">The report has been saved and HR has been notified.</p>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); }}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                <RotateCcw size={15} /> New Report
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">

                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertTriangle size={15} /> {error}
                            </div>
                        )}

                        {/* Section 1 — Who */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Team & Patient Info</p>

                            {/* Agent Name — dropdown from members */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                    Agent Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <UserCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <select
                                        name="agentName"
                                        value={form.agentName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white appearance-none transition-all"
                                    >
                                        <option value="">— Select team member —</option>
                                        {members.map(m => (
                                            <option key={m._id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Clinic */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Clinic / Team <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            name="clinicName"
                                            value={form.clinicName}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. The Grand Family"
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Patient */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Patient Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <UserCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            name="patientName"
                                            value={form.patientName}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Tyler Sanders"
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                    Date of Mistake <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        name="dateOfMistake"
                                        type="date"
                                        value={form.dateOfMistake}
                                        onChange={handleChange}
                                        required
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2 — What */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mistake Details</p>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                    Mistake Description <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <AlertTriangle size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                                    <textarea
                                        name="mistakeDescription"
                                        value={form.mistakeDescription}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        placeholder="Describe exactly what mistake was made..."
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3 — Learning (optional) */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Learning & Improvement <span className="font-normal text-slate-400">(optional)</span>
                            </p>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">What should be learned?</label>
                                <div className="relative">
                                    <BookOpen size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                                    <textarea
                                        name="learning"
                                        value={form.learning}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="What should the agent learn from this?"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">How to improve?</label>
                                <div className="relative">
                                    <TrendingUp size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                                    <textarea
                                        name="improvement"
                                        value={form.improvement}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Steps to prevent this mistake in the future..."
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm transition-all"
                        >
                            {loading
                                ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                : <><CheckCircle size={16} /> Submit Report</>
                            }
                        </motion.button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MyTeamSection = () => {
    const { user } = useContext(AuthContext);
    const [dept, setDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportCount, setReportCount] = useState(0);
    const [history, setHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    // Table States
    const [expandedId, setExpandedId] = useState(null);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    // Reset pagination when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchMyDept();
    }, []);

    useEffect(() => {
        if (dept) {
            const leadId = dept.teamLead?._id || dept.teamLead;
            const isLead = user?._id === leadId || user?.id === leadId || user?.role === 'hr';
            fetchHistory(isLead);
        }
    }, [dept, user]);

    const fetchMyDept = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/departments/my-department');
            setDept(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Could not load your department.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (isLeadOfTeam) => {
        try {
            const url = isLeadOfTeam
                ? '/mistake-reports/my-team'
                : `/mistake-reports/agent/${encodeURIComponent(user?.name || '')}`;
            const res = await apiClient.get(url);
            setHistory(res.data);
            setReportCount(res.data.length);
        } catch (err) {
            console.error('Failed to load report history:', err);
        }
    };

    const teamLeadId = dept?.teamLead?._id || dept?.teamLead;
    const isTeamLead = user?._id === teamLeadId || user?.id === teamLeadId || user?.role === 'hr';

    // ── Filtering ────────────────────────────────────────
    const filteredReports = useMemo(() => history.filter(report => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term ||
            report.agentName?.toLowerCase().includes(term) ||
            report.clinicName?.toLowerCase().includes(term) ||
            report.patientName?.toLowerCase().includes(term);

        const matchesStatus = !statusFilter || report.status === statusFilter;

        return matchesSearch && matchesStatus;
    }), [history, searchTerm, statusFilter]);

    // ── Sorting ──────────────────────────────────────────
    const sorted = useMemo(() => [...filteredReports].sort((a, b) => {
        let valA, valB;
        switch (sortField) {
            case 'agentName':      valA = a.agentName?.toLowerCase() || ''; valB = b.agentName?.toLowerCase() || ''; break;
            case 'clinicName':     valA = a.clinicName?.toLowerCase() || ''; valB = b.clinicName?.toLowerCase() || ''; break;
            case 'patientName':    valA = a.patientName?.toLowerCase() || ''; valB = b.patientName?.toLowerCase() || ''; break;
            case 'dateOfMistake':  valA = new Date(a.dateOfMistake || 0); valB = new Date(b.dateOfMistake || 0); break;
            case 'status':         valA = a.status || ''; valB = b.status || ''; break;
            default:               valA = new Date(a.createdAt || 0); valB = new Date(b.createdAt || 0); break;
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    }), [filteredReports, sortField, sortDir]);

    // ── Pagination ───────────────────────────────────────
    const totalPages = Math.ceil(sorted.length / rowsPerPage);
    const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronDown size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />;
        return sortDir === 'asc'
            ? <ChevronUp size={13} className="text-indigo-500" />
            : <ChevronDown size={13} className="text-indigo-500" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Loading your team...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-8 text-center">
                <AlertTriangle size={28} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold">{error}</p>
                <p className="text-xs text-rose-400 mt-1">Ask HR to assign you to a department first.</p>
            </div>
        );
    }

    const members = dept?.employees || [];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* ── Header Banner ── */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white flex items-center justify-between">
                <div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">Your Department</p>
                    <h2 className="text-2xl font-bold capitalize">{dept?.name}</h2>
                    {dept?.description && (
                        <p className="text-indigo-200 text-sm mt-1">{dept.description}</p>
                    )}
                </div>
                <div className="hidden sm:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-semibold">
                        <Users size={15} />
                        {members.length} Member{members.length !== 1 ? 's' : ''}
                    </div>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                        <AlertTriangle size={13} />
                        Submit Report
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{members.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Members</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center flex flex-col justify-center items-center">
                    <p className="text-lg font-bold text-amber-500 truncate max-w-full leading-7">
                        {dept?.teamLead ? dept.teamLead.name : '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Team Lead</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-emerald-600">{reportCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Reports Submitted</p>
                </div>
            </div>

            {/* ── Team Members ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">Team Members</h3>
                    {/* Mobile report button */}
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="sm:hidden flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                        <AlertTriangle size={13} />
                        Report
                    </button>
                </div>

                {members.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 flex flex-col items-center gap-3 text-slate-400">
                        <Users size={32} className="opacity-30" />
                        <p className="text-sm">No team members assigned yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member, i) => (
                            <MemberCard
                                key={member._id}
                                member={member}
                                isLead={member._id === teamLeadId || member._id?.toString() === teamLeadId?.toString()}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Report History ── */}
            <div className="border-t border-slate-100 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Report History</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isTeamLead 
                                ? "Manage and track reports submitted for your team members"
                                : "Track feedback, learning outcomes, and improvement plans submitted by your Team Lead"}
                        </p>
                    </div>
                    
                    {/* Inline filter bar */}
                    {history.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text"
                                        placeholder="Search agent, patient..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-xs transition-all w-48"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-xs cursor-pointer"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                                {(searchTerm || statusFilter) && (
                                    <button 
                                        onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                                        className="text-xs text-rose-500 font-bold hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 flex flex-col items-center gap-3 text-slate-400">
                            <FileText size={32} className="opacity-30" />
                            <p className="text-sm">No mistake reports submitted yet.</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 shadow-sm">
                            <p className="text-sm font-semibold">No reports match your filters.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200">
                                            <th className="px-4 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
                                            {[
                                                { key: 'agentName',     label: 'Agent / Employee', minW: 'min-w-[150px]' },
                                                { key: 'clinicName',    label: 'Clinic',           minW: 'min-w-[110px]' },
                                                { key: 'patientName',   label: 'Patient',          minW: 'min-w-[110px]' },
                                                { key: 'dateOfMistake', label: 'Date',             minW: 'min-w-[110px]' },
                                                { key: 'status',        label: 'Status',           minW: 'min-w-[100px]' },
                                            ].map(col => (
                                                <th
                                                    key={col.key}
                                                    onClick={() => toggleSort(col.key)}
                                                    className="group px-4 py-3.5 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-600 transition-all rounded-lg"
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        {col.label}
                                                        <SortIcon field={col.key} />
                                                    </span>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3.5 text-center text-[10.5px] font-bold text-slate-400 uppercase tracking-wider w-16">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((report, i) => {
                                            const isExpanded = expandedId === report._id;
                                            const globalIndex = (currentPage - 1) * rowsPerPage + i + 1;
                                            return (
                                                <React.Fragment key={report._id}>
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        onClick={() => setExpandedId(isExpanded ? null : report._id)}
                                                        className={`cursor-pointer transition-all border-b ${
                                                            isExpanded 
                                                                ? 'bg-indigo-50/50 border-indigo-100' 
                                                                : 'hover:bg-slate-50/60 border-slate-100 even:bg-slate-50/20'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 w-6 h-6 rounded-lg inline-flex items-center justify-center">
                                                                {globalIndex}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-xs font-bold text-rose-600">
                                                                    {report.agentName?.[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="font-bold text-slate-800 text-[13px]">{report.agentName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 font-medium text-[13px]">{report.clinicName}</td>
                                                        <td className="px-4 py-3 text-slate-600 font-medium text-[13px]">{report.patientName}</td>
                                                        <td className="px-4 py-3 text-slate-500 text-[13px]">
                                                            {new Date(report.dateOfMistake).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={report.status || 'pending'} />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                className={`p-1.5 rounded-lg transition-all ${
                                                                    isExpanded ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'
                                                                }`}
                                                                onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : report._id); }}
                                                            >
                                                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                                    <ChevronDown size={14} />
                                                                </motion.div>
                                                            </button>
                                                        </td>
                                                    </motion.tr>

                                                    {/* Expandable row */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={7} className="p-0">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="relative px-6 py-5 bg-gradient-to-br from-slate-50 to-indigo-50/20 border-t border-b border-indigo-100/50">
                                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full" />
                                                                            
                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                                                <InfoChip icon={User} label="Agent Name" value={report.agentName} />
                                                                                <InfoChip icon={Building2} label="Clinic Name" value={report.clinicName} />
                                                                                <InfoChip icon={UserCheck} label="Patient Name" value={report.patientName} />
                                                                                <InfoChip icon={Calendar} label="Date Submitted" value={new Date(report.createdAt).toLocaleDateString()} />
                                                                            </div>

                                                                            <div className="space-y-3">
                                                                                <DetailBlock icon={AlertTriangle} label="Mistake Description" value={report.mistakeDescription} accentColor="rose" />
                                                                                <DetailBlock icon={FileText} label="Learning Outcomes" value={report.learning} accentColor="indigo" />
                                                                                <DetailBlock icon={TrendingUp} label="Improvement Plan" value={report.improvement} accentColor="emerald" />
                                                                            </div>

                                                                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/60">
                                                                                <button 
                                                                                    onClick={e => { e.stopPropagation(); setExpandedId(null); }}
                                                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                                                                                >
                                                                                    Collapse Details
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-[11px] text-slate-400 font-semibold">
                                        Showing {(currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, sorted.length)} of {sorted.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => p - 1)}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                                    currentPage === p 
                                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            {/* ── Report Modal ── */}
            <AnimatePresence>
                {showReportModal && (
                    <ReportModal
                        members={members}
                        onClose={() => setShowReportModal(false)}
                        onSuccess={() => {
                            fetchHistory();
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MyTeamSection;
