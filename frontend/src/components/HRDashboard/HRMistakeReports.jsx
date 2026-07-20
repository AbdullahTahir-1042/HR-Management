import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, Search, Calendar, Building2, 
    UserCheck, X, ShieldAlert, ChevronDown, ChevronUp,
    CheckCircle, Clock, Eye, RotateCcw, Filter, ChevronLeft, ChevronRight,
    TrendingUp, FileText, User, Sparkles, Download
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

// ─── Info Chip (used in expanded detail grid) ────────────────────────────────
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

// ─── Main Component ──────────────────────────────────────────────────────────
const HRMistakeReports = () => {
    const [reports, setReports] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Sorting
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        fetchReports();
        fetchDepartments();
    }, []);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedDeptId, statusFilter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/mistake-reports');
            setReports(res.data);
        } catch (err) {
            console.error('Failed to fetch mistake reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await apiClient.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    };

    const handleUpdateStatus = async (id, statusVal) => {
        setUpdatingStatus(id);
        try {
            await apiClient.put(`/mistake-reports/${id}/status`, { status: statusVal });
            setReports(prev => prev.map(r => r._id === id ? { ...r, status: statusVal } : r));
        } catch (err) {
            console.error('Failed to update report status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getDeptName = (report) => {
        if (!report) return 'Unassigned';
        const submitterDept = report.submittedBy?.departmentId;
        if (submitterDept && typeof submitterDept === 'object' && submitterDept.name) return submitterDept.name;
        const deptIdStr = (submitterDept && typeof submitterDept === 'object') ? submitterDept._id?.toString() : submitterDept?.toString();
        const found = (departments || []).find(d => d && (d._id?.toString() === deptIdStr || (report.teamName && d.name?.toLowerCase() === report.teamName?.toLowerCase()) || (report.teamName && d._id?.toString() === report.teamName?.toString())));
        return found ? found.name : (report.teamName || 'Unassigned');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // ── Stats ────────────────────────────────────────────
    const totalReports = reports.length;
    const pendingCount = reports.filter(r => r.status === 'pending').length;
    const resolvedCount = reports.filter(r => r.status === 'resolved').length;
    const resolvedPct = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    // ── Filtering ────────────────────────────────────────
    const filteredReports = useMemo(() => reports.filter(report => {
        const term = searchTerm.toLowerCase();
        const deptName = getDeptName(report)?.toLowerCase() || '';
        const matchesSearch = !term ||
            report.agentName?.toLowerCase().includes(term) ||
            report.clinicName?.toLowerCase().includes(term) ||
            report.patientName?.toLowerCase().includes(term) ||
            report.submittedBy?.name?.toLowerCase().includes(term) ||
            deptName.includes(term);

        const submitterDeptId = (typeof report.submittedBy?.departmentId === 'object' 
            ? report.submittedBy?.departmentId?._id?.toString() 
            : report.submittedBy?.departmentId?.toString()) || report.teamName;

        const selectedDeptObj = (departments || []).find(d => d && d._id?.toString() === selectedDeptId?.toString());

        const matchesDept = !selectedDeptId || 
            submitterDeptId === selectedDeptId?.toString() ||
            (selectedDeptObj && deptName === selectedDeptObj.name?.toLowerCase());

        const matchesStatus = !statusFilter || report.status === statusFilter;

        return matchesSearch && matchesDept && matchesStatus;
    }), [reports, searchTerm, selectedDeptId, statusFilter, departments]);

    // ── Sorting ──────────────────────────────────────────
    const sorted = useMemo(() => [...filteredReports].sort((a, b) => {
        let valA, valB;
        switch (sortField) {
            case 'agentName':      valA = a.agentName?.toLowerCase() || ''; valB = b.agentName?.toLowerCase() || ''; break;
            case 'department':     valA = getDeptName(a)?.toLowerCase() || ''; valB = getDeptName(b)?.toLowerCase() || ''; break;
            case 'clinicName':     valA = a.clinicName?.toLowerCase() || ''; valB = b.clinicName?.toLowerCase() || ''; break;
            case 'patientName':    valA = a.patientName?.toLowerCase() || ''; valB = b.patientName?.toLowerCase() || ''; break;
            case 'dateOfMistake':  valA = new Date(a.dateOfMistake || 0); valB = new Date(b.dateOfMistake || 0); break;
            case 'submittedBy':    valA = a.submittedBy?.name?.toLowerCase() || ''; valB = b.submittedBy?.name?.toLowerCase() || ''; break;
            case 'status':         valA = a.status || ''; valB = b.status || ''; break;
            default:               valA = new Date(a.createdAt || 0); valB = new Date(b.createdAt || 0); break;
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    }), [filteredReports, sortField, sortDir, departments]);

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

    const hasActiveFilters = searchTerm || selectedDeptId || statusFilter;

    const handleDownloadCSV = () => {
        if (!filteredReports || filteredReports.length === 0) return;

        const headers = [
            "Agent Name",
            "Clinic Name",
            "Patient Name",
            "Date of Mistake",
            "Department",
            "Submitted By",
            "Status",
            "Mistake Description",
            "Learning Outcomes",
            "Improvement Plan",
            "Date Submitted"
        ];

        const rows = filteredReports.map(r => [
            `"${(r.agentName || '').replace(/"/g, '""')}"`,
            `"${(r.clinicName || '').replace(/"/g, '""')}"`,
            `"${(r.patientName || '').replace(/"/g, '""')}"`,
            `"${formatDate(r.dateOfMistake)}"`,
            `"${(getDeptName(r) || '').replace(/"/g, '""')}"`,
            `"${(r.submittedBy?.name || 'Unknown').replace(/"/g, '""')}"`,
            `"${(r.status || 'pending').replace(/"/g, '""')}"`,
            `"${(r.mistakeDescription || '').replace(/"/g, '""')}"`,
            `"${(r.learning || '').replace(/"/g, '""')}"`,
            `"${(r.improvement || '').replace(/"/g, '""')}"`,
            `"${formatDateTime(r.createdAt)}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Mistake_Reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 p-3 rounded-2xl text-white shadow-xl shadow-rose-200/50">
                            <AlertTriangle size={26} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Sparkles size={8} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mistake Reports</h1>
                        <p className="text-[13px] text-slate-400 mt-0.5">Review training issues and mistake reports submitted by Team Leads</p>
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownloadCSV}
                    disabled={filteredReports.length === 0}
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-rose-100 hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start sm:self-auto"
                >
                    <Download size={15} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* ── Stats Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/80 to-transparent rounded-bl-[60px] -mr-2 -mt-2" />
                    <div className="relative flex items-center gap-4">
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200/60 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                            <ShieldAlert size={22} className="text-slate-600" />
                        </div>
                        <div>
                            <p className="text-[28px] font-extrabold text-slate-800 leading-none"><AnimatedNumber value={totalReports} /></p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Total Reports</p>
                        </div>
                    </div>
                </motion.div>

                {/* Pending */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="relative overflow-hidden bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-[60px] -mr-2 -mt-2" />
                    <div className="relative flex items-center gap-4">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100/60 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={22} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[28px] font-extrabold text-amber-700 leading-none"><AnimatedNumber value={pendingCount} /></p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Pending Review</p>
                        </div>
                    </div>
                </motion.div>

                {/* Resolved */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="relative overflow-hidden bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-[60px] -mr-2 -mt-2" />
                    <div className="relative flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100/60 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                            <CheckCircle size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[28px] font-extrabold text-emerald-700 leading-none"><AnimatedNumber value={resolvedCount} /></p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Resolved</p>
                        </div>
                    </div>
                </motion.div>

                {/* Resolution Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="relative overflow-hidden bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-[60px] -mr-2 -mt-2" />
                    <div className="relative flex items-center gap-4">
                        <div className="bg-gradient-to-br from-indigo-100 to-violet-100/60 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={22} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[28px] font-extrabold text-indigo-700 leading-none"><AnimatedNumber value={`${resolvedPct}%`} /></p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Resolution Rate</p>
                        </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-100/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${resolvedPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-r-full"
                        />
                    </div>
                </motion.div>
            </div>

            {/* ── Filters Bar ───────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm"
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Search agent, patient, clinic..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all text-sm placeholder:text-slate-400"
                        />
                    </div>

                    {/* Department */}
                    <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={selectedDeptId}
                            onChange={e => setSelectedDeptId(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="relative">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 justify-end">
                        <AnimatePresence>
                            {hasActiveFilters && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => { setSearchTerm(''); setSelectedDeptId(''); setStatusFilter(''); }}
                                    className="text-xs text-rose-500 font-bold hover:text-rose-600 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50"
                                >
                                    <X size={14} /> Clear
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <span className="text-[11px] text-slate-400 font-semibold tabular-nums">
                            {filteredReports.length} of {totalReports}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* ── Table ─────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center gap-4 py-20">
                    <div className="relative">
                        <div className="w-12 h-12 border-[3px] border-rose-200 rounded-full" />
                        <div className="w-12 h-12 border-[3px] border-rose-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">Loading mistake reports...</span>
                </div>
            ) : filteredReports.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm"
                >
                    <div className="inline-flex p-4 rounded-2xl bg-slate-50 mb-4">
                        <ShieldAlert size={40} className="text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-500">No mistake reports found</p>
                    <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                        {hasActiveFilters
                            ? 'Try adjusting your filters to see more results'
                            : 'Reports submitted by team leads will appear here'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedDeptId(''); setStatusFilter(''); }}
                            className="mt-4 text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                        >
                            Clear all filters
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                    {/* Row number */}
                                    <th className="px-4 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
                                    {[
                                        { key: 'agentName',     label: 'Agent / Employee', minW: 'min-w-[150px]', tooltip: 'Sort by Agent Name' },
                                        { key: 'department',    label: 'Department',       minW: 'min-w-[130px]', tooltip: 'Sort by Department' },
                                        { key: 'clinicName',    label: 'Clinic',           minW: 'min-w-[120px]', tooltip: 'Sort by Clinic' },
                                        { key: 'patientName',   label: 'Patient',          minW: 'min-w-[120px]', tooltip: 'Sort by Patient' },
                                        { key: 'dateOfMistake', label: 'Date',             minW: 'min-w-[120px]', tooltip: 'Sort by Mistake Date' },
                                        { key: 'submittedBy',   label: 'Reported By',      minW: 'min-w-[130px]', tooltip: 'Sort by Submitter Name' },
                                        { key: 'status',        label: 'Status',           minW: 'min-w-[100px]', tooltip: 'Sort by Status' },
                                    ].map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => toggleSort(col.key)}
                                            title={col.tooltip}
                                            className={`group px-5 py-3.5 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 hover:text-indigo-600 transition-all rounded-lg ${col.minW}`}
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
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => setExpandedId(isExpanded ? null : report._id)}
                                                className={`
                                                    cursor-pointer transition-all duration-200 border-b
                                                    ${isExpanded
                                                        ? 'bg-indigo-50/50 border-indigo-100'
                                                        : 'hover:bg-slate-50/70 border-slate-100 even:bg-slate-50/30'}
                                                `}
                                            >
                                                {/* Row # */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 w-7 h-7 rounded-lg inline-flex items-center justify-center">
                                                        {globalIndex}
                                                    </span>
                                                </td>

                                                {/* Agent */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                                            <User size={16} className="text-rose-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 text-[13px] truncate">{report.agentName}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Department */}
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs font-bold capitalize">
                                                        <Building2 size={12} />
                                                        {getDeptName(report)}
                                                    </span>
                                                </td>

                                                {/* Clinic */}
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-700 font-medium text-[13px]">{report.clinicName}</span>
                                                </td>

                                                {/* Patient */}
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-700 font-medium text-[13px]">{report.patientName}</span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-slate-500 text-[13px]">
                                                        <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                                                        {formatDate(report.dateOfMistake)}
                                                    </span>
                                                </td>

                                                {/* Submitted By */}
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium text-[13px]">
                                                        <UserCheck size={13} className="text-slate-400 flex-shrink-0" />
                                                        {report.submittedBy?.name || 'Unknown'}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={report.status || 'pending'} />
                                                </td>

                                                {/* Expand toggle */}
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        className={`p-2 rounded-xl transition-all duration-200 ${
                                                            isExpanded
                                                                ? 'bg-indigo-100 text-indigo-600 shadow-sm shadow-indigo-100 rotate-0'
                                                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                        onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : report._id); }}
                                                        title="View Details"
                                                    >
                                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                            <ChevronDown size={16} />
                                                        </motion.div>
                                                    </button>
                                                </td>
                                            </motion.tr>

                                            {/* ── Expanded Detail Panel ─────────────── */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={9} className="p-0">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="relative px-8 py-6 bg-gradient-to-br from-slate-50/80 via-indigo-50/20 to-slate-50/80">
                                                                    {/* Decorative accent line */}
                                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-400 rounded-r-full" />

                                                                    {/* Info Grid */}
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                                                        <InfoChip icon={User} label="Agent / Employee" value={report.agentName} />
                                                                        <InfoChip icon={Building2} label="Clinic" value={report.clinicName} />
                                                                        <InfoChip icon={UserCheck} label="Patient" value={report.patientName} />
                                                                        <InfoChip icon={Calendar} label="Submitted On" value={formatDateTime(report.createdAt)} />
                                                                    </div>

                                                                    {/* Description Blocks */}
                                                                    <div className="space-y-3">
                                                                        <DetailBlock icon={AlertTriangle} label="Mistake Description" value={report.mistakeDescription} accentColor="rose" />
                                                                        <DetailBlock icon={FileText} label="Learning Outcomes" value={report.learning} accentColor="indigo" />
                                                                        <DetailBlock icon={TrendingUp} label="Improvement Plan" value={report.improvement} accentColor="emerald" />
                                                                    </div>

                                                                    {/* Footer Actions */}
                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 pt-4 border-t border-slate-200/60 gap-3">
                                                                        <div className="text-[11px] text-slate-400">
                                                                            Department: <span className="font-bold text-slate-600">{getDeptName(report)}</span>
                                                                            <span className="mx-1.5 text-slate-300">·</span>
                                                                            Lead: <span className="font-bold text-slate-600">{report.submittedBy?.name || 'Unknown'}</span>
                                                                            <span className="mx-1.5 text-slate-300">·</span>
                                                                            Reported: <span className="font-bold text-slate-600">{formatDate(report.dateOfMistake)}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {report.status !== 'resolved' ? (
                                                                                <button 
                                                                                    onClick={e => { e.stopPropagation(); handleUpdateStatus(report._id, 'resolved'); }}
                                                                                    disabled={updatingStatus === report._id}
                                                                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/60"
                                                                                >
                                                                                    <CheckCircle size={14} />
                                                                                    {updatingStatus === report._id ? 'Updating...' : 'Mark Resolved'}
                                                                                </button>
                                                                            ) : (
                                                                                <button 
                                                                                    onClick={e => { e.stopPropagation(); handleUpdateStatus(report._id, 'pending'); }}
                                                                                    disabled={updatingStatus === report._id}
                                                                                    className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                                                                >
                                                                                    <RotateCcw size={14} />
                                                                                    {updatingStatus === report._id ? 'Updating...' : 'Re-open Report'}
                                                                                </button>
                                                                            )}
                                                                            <button 
                                                                                onClick={e => { e.stopPropagation(); setExpandedId(null); }}
                                                                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                                                                            >
                                                                                Collapse
                                                                            </button>
                                                                        </div>
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

                    {/* ── Pagination ─────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                            <p className="text-[11px] text-slate-400 font-semibold">
                                Showing{' '}
                                <span className="font-bold text-slate-600">{(currentPage - 1) * rowsPerPage + 1}</span>
                                {' – '}
                                <span className="font-bold text-slate-600">{Math.min(currentPage * rowsPerPage, sorted.length)}</span>
                                {' of '}
                                <span className="font-bold text-slate-600">{sorted.length}</span>
                                {' reports'}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                                >
                                    <ChevronLeft size={15} className="text-slate-500" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        p === '...' ? (
                                            <span key={`dots-${idx}`} className="px-2 text-xs text-slate-300 font-bold">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`min-w-[34px] h-[34px] rounded-xl text-xs font-bold transition-all ${
                                                    currentPage === p
                                                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                )}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                                >
                                    <ChevronRight size={15} className="text-slate-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default HRMistakeReports;
