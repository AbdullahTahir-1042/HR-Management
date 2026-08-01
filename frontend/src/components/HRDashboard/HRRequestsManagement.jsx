import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Clock, CheckCircle, XCircle,
    AlertCircle, ChevronDown, User, Search, Coins, Eye, Check, RefreshCw, X, FileText, Info
} from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Pending', 'In Review', 'Resolved', 'Rejected'];

const STATUS_STYLES = {
    'Pending':            { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   icon: Clock        },
    'In Review':          { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    icon: AlertCircle  },
    'Revision Requested': { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  icon: Info         },
    'Approved':           { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle  },
    'Active':             { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle  },
    'Completed':          { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200',     icon: CheckCircle  },
    'Resolved':           { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle  },
    'Rejected':           { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    icon: XCircle      },
};

const TYPE_COLORS = {
    'Attendance Correction': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'Experience Letter':     'bg-violet-50 text-violet-600 border-violet-200',
    'Salary Slip':           'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Work From Home':        'bg-amber-50 text-amber-600 border-amber-200',
    'Other':                 'bg-slate-50 text-slate-600 border-slate-200',
};

const formatPKR = (amount) => `₨ ${(amount || 0).toLocaleString()}`;

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES['Pending'];
    const Icon = style.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            <Icon size={11} />
            {status}
        </span>
    );
};

const EmptyState = ({ message = "No HR requests found" }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200"
    >
        <div className="bg-indigo-50 p-5 rounded-full mb-3">
            <ClipboardList size={30} className="text-indigo-400" />
        </div>
        <p className="text-slate-700 font-bold text-sm">{message}</p>
        <p className="text-slate-400 text-xs mt-1">Employee request submissions will appear here.</p>
    </motion.div>
);

// ── General Request Card ───────────────────────────────────────────────────────

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
            className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-xs transition-all"
        >
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-600 border border-indigo-100 shrink-0">
                        {request.employee?.name?.[0] || <User size={16} />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">
                            {request.employee?.name || 'Unknown Employee'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                            {request.employee?.department || ''} · {request.employee?.email || ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TYPE_COLORS[request.type] || TYPE_COLORS['Other']}`}>
                        {request.type}
                    </span>
                    <StatusBadge status={request.status} />
                    <span className="text-[11px] text-slate-400 font-semibold">{formatDate(request.createdAt)}</span>
                </div>
            </div>

            <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed bg-slate-50/80 border border-slate-100 rounded-2xl px-4 py-3">
                {request.description}
            </p>

            {request.hrNote && !expanded && (
                <div className="mt-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl px-4 py-2.5">
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">HR Note</p>
                    <p className="text-xs text-indigo-800 font-semibold">{request.hrNote}</p>
                </div>
            )}

            <div className="mt-3">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                    <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    {expanded ? 'Cancel Review' : 'Update Status'}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 space-y-3 border-t border-slate-100 mt-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Update Status
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map((s) => {
                                            const style = STATUS_STYLES[s];
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatus(s)}
                                                    className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                                        status === s
                                                            ? `${style.bg} ${style.text} ${style.border} shadow-xs`
                                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                                        HR Note (visible to employee)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={hrNote}
                                        onChange={(e) => setHrNote(e.target.value)}
                                        placeholder="Add feedback or instructions for the employee..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-100 cursor-pointer"
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
    const [subTab, setSubTab] = useState('general'); // 'general' | 'loans'

    // General Requests state
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Loan Requests state (HR side)
    const [loans, setLoans] = useState([]);
    const [loansLoading, setLoansLoading] = useState(false);
    const [loanFilter, setLoanFilter] = useState('all');
    const [loanSearch, setLoanSearch] = useState('');
    const [reviewingLoan, setReviewingLoan] = useState(null);

    // HR Loan Terms Form
    const [reviewTerms, setReviewTerms] = useState({
        status: 'Approved',
        approvedAmount: '',
        approvedInstallments: '',
        monthlyDeduction: '',
        repaymentStartMonth: '',
        hrNotes: ''
    });
    const [reviewing, setReviewing] = useState(false);

    // Fetch all loans for HR
    const fetchAllLoans = useCallback(async () => {
        try {
            setLoansLoading(true);
            const res = await apiClient.get('/loans/all');
            setLoans(res.data);
        } catch (err) {
            console.error('Error fetching HR loans:', err);
        } finally {
            setLoansLoading(false);
        }
    }, []);

    useEffect(() => {
        if (subTab === 'loans') {
            fetchAllLoans();
        }
    }, [subTab, fetchAllLoans]);

    const openReviewModal = (loan) => {
        setReviewingLoan(loan);
        const approvedAmount = loan.approvedAmount || loan.requestedAmount;
        const approvedInstallments = loan.approvedInstallments || loan.preferredInstallments;
        const monthlyDeduction = loan.monthlyDeduction || Math.ceil(approvedAmount / approvedInstallments);

        setReviewTerms({
            status: 'Approved',
            approvedAmount: approvedAmount.toString(),
            approvedInstallments: approvedInstallments.toString(),
            monthlyDeduction: monthlyDeduction.toString(),
            repaymentStartMonth: loan.repaymentStartMonth || loan.preferredStartMonth || new Date().toISOString().slice(0, 7),
            hrNotes: loan.hrNotes || ''
        });
    };

    const handleLoanAmountChange = (val) => {
        const amt = Number(val) || 0;
        const inst = Number(reviewTerms.approvedInstallments) || 1;
        const calcMonthly = Math.ceil(amt / inst);
        setReviewTerms(p => ({
            ...p,
            approvedAmount: val,
            monthlyDeduction: calcMonthly.toString()
        }));
    };

    const handleInstallmentsChange = (val) => {
        const inst = Number(val) || 1;
        const amt = Number(reviewTerms.approvedAmount) || 0;
        const calcMonthly = Math.ceil(amt / inst);
        setReviewTerms(p => ({
            ...p,
            approvedInstallments: val,
            monthlyDeduction: calcMonthly.toString()
        }));
    };

    const handleSaveLoanReview = async (actionStatus) => {
        if (!reviewingLoan) return;
        try {
            setReviewing(true);
            const payload = {
                status: actionStatus,
                approvedAmount: Number(reviewTerms.approvedAmount),
                approvedInstallments: Number(reviewTerms.approvedInstallments),
                monthlyDeduction: Number(reviewTerms.monthlyDeduction),
                repaymentStartMonth: reviewTerms.repaymentStartMonth,
                hrNotes: reviewTerms.hrNotes
            };

            await apiClient.put(`/loans/${reviewingLoan._id}/review`, payload);
            setReviewingLoan(null);
            fetchAllLoans();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to update loan status');
        } finally {
            setReviewing(false);
        }
    };

    // Filtered General Requests
    const filteredGeneral = requests.filter((r) => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesSearch =
            r.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.type?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Filtered Loan Requests
    const filteredLoans = loans.filter((l) => {
        const matchesStatus = loanFilter === 'all' || l.status === loanFilter;
        const matchesSearch =
            l.employee?.name?.toLowerCase().includes(loanSearch.toLowerCase()) ||
            l.purpose?.toLowerCase().includes(loanSearch.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const pendingLoanCount = loans.filter(l => l.status === 'Pending').length;

    return (
        <motion.div
            key="hr-requests-management"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* ── Header & Sub-Tab Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 text-white">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Employee Requests Management</h1>
                        <p className="text-xs font-semibold text-slate-400">Review and process general inquiries and financial loan applications</p>
                    </div>
                </div>

                {/* Sub-Tab Bar */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setSubTab('general')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            subTab === 'general'
                                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <FileText size={14} /> General Requests ({requests.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTab('loans')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            subTab === 'loans'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Coins size={14} /> Loan Requests ({loans.length})
                        {pendingLoanCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-extrabold">
                                {pendingLoanCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 1: GENERAL REQUESTS                                          */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {subTab === 'general' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employee name or request type..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['all', 'Pending', 'In Review', 'Resolved', 'Rejected'].map((s) => {
                                const count = s === 'all' ? requests.length : requests.filter(r => r.status === s).length;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                            statusFilter === s
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-2xs'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {s === 'all' ? 'All' : s}
                                        <span className="ml-1.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {filteredGeneral.length === 0 ? (
                        <EmptyState message="No general HR requests match filter" />
                    ) : (
                        <div className="space-y-3">
                            {filteredGeneral.map((req) => (
                                <RequestCard key={req._id} request={req} onUpdate={onUpdate} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 2: LOAN REQUESTS (HR ADMIN SIDE)                            */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {subTab === 'loans' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search loan applicant or purpose..."
                                value={loanSearch}
                                onChange={(e) => setLoanSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['all', 'Pending', 'Active', 'Completed', 'Rejected'].map((s) => {
                                const count = s === 'all' ? loans.length : loans.filter(l => l.status === s).length;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setLoanFilter(s)}
                                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                            loanFilter === s
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {s === 'all' ? 'All Loans' : s}
                                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${loanFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {loansLoading ? (
                        <div className="py-8 text-center text-xs font-bold text-slate-400">Loading loan requests...</div>
                    ) : filteredLoans.length === 0 ? (
                        <EmptyState message="No financial loan applications found" />
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider bg-slate-50/60">
                                            <th className="py-3.5 px-4">Employee</th>
                                            <th className="py-3.5 px-4">Purpose</th>
                                            <th className="py-3.5 px-4">Requested</th>
                                            <th className="py-3.5 px-4">Approved</th>
                                            <th className="py-3.5 px-4">Monthly Deduction</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Review Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                        {filteredLoans.map((loan) => (
                                            <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0">
                                                            {loan.employee?.name?.[0] || 'E'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 leading-tight">{loan.employee?.name || 'Unknown'}</p>
                                                            <p className="text-[10px] text-slate-400">{loan.employee?.department || 'Department'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-800">{loan.purpose}</td>
                                                <td className="py-4 px-4 font-extrabold text-slate-900">{formatPKR(loan.requestedAmount)}</td>
                                                <td className="py-4 px-4 font-extrabold text-indigo-600">
                                                    {loan.approvedAmount ? formatPKR(loan.approvedAmount) : '-'}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-emerald-600">
                                                    {loan.monthlyDeduction ? `${formatPKR(loan.monthlyDeduction)} / mo` : '-'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <StatusBadge status={loan.status} />
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(loan)}
                                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                                    >
                                                        Review Application
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* HR LOAN REVIEW & TERMS ADJUSTMENT MODAL                              */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {reviewingLoan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Coins size={16} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        Review Employee Loan Application
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setReviewingLoan(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Employee Summary Card */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Applicant Name</p>
                                        <p className="font-bold text-slate-800">{reviewingLoan.employee?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Current Base Salary</p>
                                        <p className="font-bold text-slate-800">{reviewingLoan.employee?.salary ? formatPKR(reviewingLoan.employee.salary) : 'Not Set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Purpose</p>
                                        <p className="font-bold text-slate-800">{reviewingLoan.purpose}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Requested Amount</p>
                                        <p className="font-extrabold text-indigo-600">{formatPKR(reviewingLoan.requestedAmount)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Applicant Justification</p>
                                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                                        {reviewingLoan.reason}
                                    </p>
                                </div>

                                {/* HR Approval Terms Adjustment Controls */}
                                <div className="border-t border-slate-100 pt-4 space-y-3">
                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Adjust Final Loan Approval Terms
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                                Approved Amount (₨)
                                            </label>
                                            <input
                                                type="number"
                                                value={reviewTerms.approvedAmount}
                                                onChange={e => handleLoanAmountChange(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                                Installments (Months)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="36"
                                                value={reviewTerms.approvedInstallments}
                                                onChange={e => handleInstallmentsChange(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                                Monthly Deduction (₨)
                                            </label>
                                            <input
                                                type="number"
                                                value={reviewTerms.monthlyDeduction}
                                                onChange={e => setReviewTerms(p => ({ ...p, monthlyDeduction: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-emerald-600 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                                Repayment Start Month
                                            </label>
                                            <input
                                                type="month"
                                                value={reviewTerms.repaymentStartMonth}
                                                onChange={e => setReviewTerms(p => ({ ...p, repaymentStartMonth: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                            HR Reviewer Notes (visible to employee)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={reviewTerms.hrNotes}
                                            onChange={e => setReviewTerms(p => ({ ...p, hrNotes: e.target.value }))}
                                            placeholder="Specify approval conditions or feedback..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Review Actions */}
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        disabled={reviewing}
                                        onClick={() => handleSaveLoanReview('Rejected')}
                                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        disabled={reviewing}
                                        onClick={() => handleSaveLoanReview('Revision Requested')}
                                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Request Revision
                                    </button>
                                    <button
                                        type="button"
                                        disabled={reviewing}
                                        onClick={() => handleSaveLoanReview('Approved')}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-200 transition-all cursor-pointer"
                                    >
                                        Approve & Activate Loan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default HRRequestsManagement;