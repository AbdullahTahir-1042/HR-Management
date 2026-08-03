import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Send, Clock, CheckCircle,
    XCircle, AlertCircle, ChevronDown, FileText, Check, DollarSign, Home, HelpCircle,
    Coins, Plus, Calendar, AlertTriangle, ShieldCheck, FileSpreadsheet, Eye, Info, X
} from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ── Constants ──────────────────────────────────────────────────────────────────

const REQUEST_TYPES = [
    'Attendance Correction',
    'Experience Letter',
    'Salary Slip',
    'Work From Home',
    'Other'
];

const TYPE_ICONS = {
    'Attendance Correction': Clock,
    'Experience Letter': FileText,
    'Salary Slip': DollarSign,
    'Work From Home': Home,
    'Other': HelpCircle
};

const LOAN_PURPOSES = [
    'Emergency',
    'Medical',
    'Education',
    'Personal',
    'Housing',
    'Travel',
    'Other'
];

const STATUS_STYLES = {
    'Pending': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock, label: 'Pending' },
    'In Review': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: AlertCircle, label: 'In Review' },
    'Revision Requested': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: Info, label: 'Revision Requested' },
    'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle, label: 'Approved' },
    'Active': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle, label: 'Active' },
    'Completed': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', icon: ShieldCheck, label: 'Completed' },
    'Rejected': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', icon: XCircle, label: 'Rejected' },
    'Cancelled': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: X, label: 'Cancelled' }
};

const TYPE_COLORS = {
    'Attendance Correction': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'Experience Letter': 'bg-violet-50 text-violet-600 border-violet-200',
    'Salary Slip': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Work From Home': 'bg-amber-50 text-amber-600 border-amber-200',
    'Other': 'bg-slate-50 text-slate-600 border-slate-200',
};

const formatPKR = (amount) => `₨ ${(amount || 0).toLocaleString()}`;

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

// ── Custom Dropdowns ────────────────────────────────────────────────────────────

const RequestTypeDropdown = ({ value, onChange, options, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const SelectedIcon = value ? (TYPE_ICONS[value] || FileText) : null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm flex items-center justify-between font-medium cursor-pointer transition-all ${isOpen
                        ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10 shadow-xs'
                        : error
                            ? 'border-rose-300 bg-rose-50/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                    }`}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {SelectedIcon ? (
                        <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                            <SelectedIcon size={13} />
                        </div>
                    ) : (
                        <FileText size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className={`truncate text-sm ${value ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {value || 'Select a request type...'}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 overflow-hidden"
                    >
                        <div className="space-y-0.5 max-h-60 overflow-y-auto">
                            {options.map((type) => {
                                const IconComp = TYPE_ICONS[type] || FileText;
                                const isSelected = value === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            onChange(type);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${isSelected
                                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 transition-colors ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200/60'
                                                }`}>
                                                <IconComp size={13} />
                                            </div>
                                            <span>{type}</span>
                                        </span>
                                        {isSelected && (
                                            <Check size={14} className="text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES['Pending'];
    const Icon = style.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            <Icon size={11} />
            {style.label}
        </span>
    );
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-slate-100 p-4 rounded-full mb-3">
            <ClipboardList size={28} className="text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-600">No requests submitted yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Fill out the form above to send a request directly to HR.
        </p>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const EmployeeHRRequests = ({ user }) => {
    const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'loans'

    // General HR Requests State
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Loan Requests State
    const [loans, setLoans] = useState([]);
    const [loansLoading, setLoansLoading] = useState(true);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [loanForm, setLoanForm] = useState({
        requestedAmount: '',
        purpose: 'Personal',
        reason: '',
        preferredInstallments: '6',
        preferredStartMonth: new Date().toISOString().slice(0, 7),
        supportingDocument: '',
        employeeNotes: ''
    });
    const [loanSubmitting, setLoanSubmitting] = useState(false);
    const [loanError, setLoanError] = useState('');
    const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);

    // Fetch General HR Requests
    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/hr-requests/my-requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching HR requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch Loan Requests
    const fetchLoans = useCallback(async () => {
        try {
            setLoansLoading(true);
            const res = await apiClient.get('/loans/my-loans');
            setLoans(res.data);
        } catch (err) {
            console.error('Error fetching loan requests:', err);
        } finally {
            setLoansLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
        fetchLoans();

        if (!('BroadcastChannel' in window)) return;
        let bcLoans, bcHR;
        try {
            bcLoans = new BroadcastChannel('loans_channel');
            bcLoans.onmessage = () => fetchLoans();

            bcHR = new BroadcastChannel('hr_requests_channel');
            bcHR.onmessage = () => fetchRequests();
        } catch (e) {}

        return () => {
            if (bcLoans) bcLoans.close();
            if (bcHR) bcHR.close();
        };
    }, [fetchRequests, fetchLoans]);

    const handleSubmitGeneral = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.type) {
            return setError('Please select a request type.');
        }
        if (!form.description.trim()) {
            return setError('Please describe your request.');
        }

        try {
            setSubmitting(true);
            const res = await apiClient.post('/hr-requests', form);
            setRequests((prev) => [res.data, ...prev]);
            setForm({ type: '', description: '' });

            try {
                window.dispatchEvent(new CustomEvent('hr_request_event', { detail: { type: 'NEW_HR_REQUEST', request: res.data } }));
                const bc = new BroadcastChannel('hr_requests_channel');
                bc.postMessage({ type: 'NEW_HR_REQUEST', request: res.data });
                bc.close();
            } catch (e) {}
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitLoan = async (e) => {
        e.preventDefault();
        setLoanError('');

        if (!loanForm.requestedAmount || Number(loanForm.requestedAmount) < 1000) {
            return setLoanError('Please enter a valid loan amount (min ₨ 1,000).');
        }
        if (!loanForm.reason.trim()) {
            return setLoanError('Please provide a detailed reason for the loan request.');
        }

        try {
            setLoanSubmitting(true);
            const res = await apiClient.post('/loans', loanForm);
            setLoans((prev) => [res.data, ...prev]);
            setIsLoanModalOpen(false);
            setLoanForm({
                requestedAmount: '',
                purpose: 'Personal',
                reason: '',
                preferredInstallments: '6',
                preferredStartMonth: new Date().toISOString().slice(0, 7),
                supportingDocument: '',
                employeeNotes: ''
            });

            // Dispatch instant local + cross-tab events
            try {
                window.dispatchEvent(new CustomEvent('loan_event', { detail: { type: 'NEW_LOAN_REQUEST', loan: res.data } }));
                const bc = new BroadcastChannel('loans_channel');
                bc.postMessage({ type: 'NEW_LOAN_REQUEST', loan: res.data });
                bc.close();
            } catch (e) {}
        } catch (err) {
            setLoanError(err.response?.data?.msg || 'Failed to submit loan request.');
        } finally {
            setLoanSubmitting(false);
        }
    };

    const handleCancelLoan = async (loanId) => {
        if (!window.confirm('Are you sure you want to cancel this pending loan request?')) return;
        try {
            await apiClient.delete(`/loans/${loanId}`);
            fetchLoans();

            // Dispatch instant local + cross-tab events
            try {
                window.dispatchEvent(new CustomEvent('loan_event', { detail: { type: 'LOAN_CANCELLED', loanId } }));
                const bc = new BroadcastChannel('loans_channel');
                bc.postMessage({ type: 'LOAN_CANCELLED', loanId });
                bc.close();
            } catch (e) {}
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to cancel loan request');
        }
    };

    const activeLoan = loans.find(l => ['Active', 'Approved'].includes(l.status));
    const pendingOrActiveCount = loans.filter(l => ['Pending', 'Revision Requested', 'Active', 'Approved'].includes(l.status)).length;

    const estimatedMonthlyInstallment = loanForm.requestedAmount && loanForm.preferredInstallments
        ? Math.ceil(Number(loanForm.requestedAmount) / Number(loanForm.preferredInstallments))
        : 0;

    return (
        <motion.div
            key="hr-requests"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* ── Page Header & Sub-Tab Switcher ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 text-white">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Requests Hub</h1>
                        <p className="text-xs font-semibold text-slate-400">Manage your HR inquiries and financial loan requests</p>
                    </div>
                </div>

                {/* Sub-Tab Navigation Bar */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('general')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'general'
                                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <FileText size={14} /> General Requests
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('loans')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'loans'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Coins size={14} /> Loan Requests
                        {loans.filter(l => l.status === 'Pending').length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 1: GENERAL HR REQUESTS                                       */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {activeSubTab === 'general' && (
                <div className="space-y-6">
                    {/* Request Form */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                        <h2 className="text-xs font-bold text-indigo-600 mb-5 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                            <FileText size={16} /> New General HR Request
                        </h2>

                        <form onSubmit={handleSubmitGeneral} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Request Type
                                </label>
                                <RequestTypeDropdown
                                    value={form.type}
                                    onChange={(val) => setForm({ ...form, type: val })}
                                    options={REQUEST_TYPES}
                                    error={error && !form.type}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe your request in detail..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none placeholder:text-slate-300 placeholder:font-normal"
                                />
                            </div>

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

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-100 cursor-pointer"
                            >
                                <Send size={14} />
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    {/* Request History */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-widest">
                                <ClipboardList size={16} className="text-indigo-500" />
                                My General Requests History
                            </h2>
                            {requests.length > 0 && (
                                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                    {requests.length} total
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Loading requests...</div>
                        ) : requests.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-3">
                                {requests.map((req) => (
                                    <div
                                        key={req._id}
                                        className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 hover:bg-white hover:border-indigo-100 hover:shadow-xs transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TYPE_COLORS[req.type] || TYPE_COLORS['Other']}`}>
                                                    {req.type}
                                                </span>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-semibold">
                                                {formatDate(req.createdAt)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                                            {req.description}
                                        </p>

                                        {req.hrNote && (
                                            <div className="mt-3 bg-indigo-50/70 border border-indigo-100 rounded-xl px-4 py-2.5">
                                                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">HR Response Note</p>
                                                <p className="text-xs text-indigo-800 font-semibold">{req.hrNote}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB 2: LOAN REQUESTS MODULE                                      */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {activeSubTab === 'loans' && (
                <div className="space-y-6">
                    {/* Active Loan Summary Strip (If Employee has active loan) */}
                    {activeLoan && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/20">
                                        Active Financial Loan
                                    </span>
                                    <h2 className="text-2xl font-black mt-2 tracking-tight">
                                        {formatPKR(activeLoan.approvedAmount)}
                                    </h2>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        Purpose: <span className="font-semibold text-white">{activeLoan.purpose}</span> ({activeLoan.approvedInstallments} Months Repayment)
                                    </p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Monthly Deduction</p>
                                    <p className="text-lg font-black text-emerald-400">{formatPKR(activeLoan.monthlyDeduction)} / mo</p>
                                </div>
                            </div>

                            {/* Repayment Progress Bar */}
                            <div className="space-y-2 relative z-10">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-indigo-200">Repaid: {formatPKR(activeLoan.paidAmount)}</span>
                                    <span className="text-white">Remaining: {formatPKR(activeLoan.remainingBalance)}</span>
                                </div>
                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, Math.round(((activeLoan.paidAmount || 0) / (activeLoan.approvedAmount || 1)) * 100))}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loan Requests Table & Header Action */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                                    <Coins size={16} /> Financial Loan Applications
                                </h2>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Submit new requests or track repayment progress</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLoanModalOpen(true)}
                                disabled={pendingOrActiveCount > 0}
                                title={pendingOrActiveCount > 0 ? "You already have an active or pending loan application" : "Submit new loan request"}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-100 disabled:shadow-none self-start sm:self-auto"
                            >
                                <Plus size={15} /> Request Loan
                            </button>
                        </div>

                        {pendingOrActiveCount > 0 && (
                            <div className="mb-5 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs font-semibold text-indigo-700">
                                <Info size={16} className="text-indigo-500 shrink-0" />
                                <span>Note: System policy limits employees to 1 active or pending loan request at a time.</span>
                            </div>
                        )}

                        {loansLoading ? (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">Loading loan requests...</div>
                        ) : loans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-slate-100 p-4 rounded-full mb-3">
                                    <Coins size={28} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-600">No loan applications submitted</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Click "+ Request Loan" above to apply for an interest-free company loan.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider bg-slate-50/60">
                                            <th className="py-3 px-3 rounded-l-xl">Submitted Date</th>
                                            <th className="py-3 px-3">Purpose</th>
                                            <th className="py-3 px-3">Requested Amount</th>
                                            <th className="py-3 px-3">Installments</th>
                                            <th className="py-3 px-3">Monthly Deduction</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3 text-right rounded-r-xl">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                        {loans.map(loan => (
                                            <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-3 font-medium text-slate-500">{formatDate(loan.createdAt)}</td>
                                                <td className="py-3.5 px-3">
                                                    <span className="font-bold text-slate-800">{loan.purpose}</span>
                                                </td>
                                                <td className="py-3.5 px-3 font-extrabold text-slate-900">{formatPKR(loan.requestedAmount)}</td>
                                                <td className="py-3.5 px-3">{loan.approvedInstallments || loan.preferredInstallments} Months</td>
                                                <td className="py-3.5 px-3 font-bold text-emerald-600">
                                                    {loan.monthlyDeduction ? formatPKR(loan.monthlyDeduction) : '-'}
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <StatusBadge status={loan.status} />
                                                </td>
                                                <td className="py-3.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedLoanDetails(loan)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-bold text-[10px] uppercase transition-colors cursor-pointer"
                                                        >
                                                            <Eye size={12} className="inline mr-1" /> View Details
                                                        </button>
                                                        {loan.status === 'Pending' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCancelLoan(loan._id)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] uppercase transition-colors cursor-pointer"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* LOAN REQUEST SUBMISSION MODAL                                        */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isLoanModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Coins size={16} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        Apply for Employee Financial Loan
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsLoanModalOpen(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitLoan} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                            Requested Amount (₨) *
                                        </label>
                                        <input
                                            type="number"
                                            min="1000"
                                            value={loanForm.requestedAmount}
                                            onChange={e => setLoanForm(p => ({ ...p, requestedAmount: e.target.value }))}
                                            placeholder="e.g. 50000"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                            Loan Purpose *
                                        </label>
                                        <select
                                            value={loanForm.purpose}
                                            onChange={e => setLoanForm(p => ({ ...p, purpose: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                                        >
                                            {LOAN_PURPOSES.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                            Installments (Months) *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="36"
                                            value={loanForm.preferredInstallments}
                                            onChange={e => setLoanForm(p => ({ ...p, preferredInstallments: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                            Repayment Start Month *
                                        </label>
                                        <input
                                            type="month"
                                            value={loanForm.preferredStartMonth}
                                            onChange={e => setLoanForm(p => ({ ...p, preferredStartMonth: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Estimated Monthly Installment Indicator */}
                                {estimatedMonthlyInstallment > 0 && (
                                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-indigo-700">
                                        <span>Estimated Monthly Deduction:</span>
                                        <span className="text-sm font-black text-indigo-800">{formatPKR(estimatedMonthlyInstallment)} / mo</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                        Detailed Reason & Justification *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={loanForm.reason}
                                        onChange={e => setLoanForm(p => ({ ...p, reason: e.target.value }))}
                                        placeholder="Explain why you are requesting this financial loan..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                        Supporting Document Link (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={loanForm.supportingDocument}
                                        onChange={e => setLoanForm(p => ({ ...p, supportingDocument: e.target.value }))}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>

                                {loanError && (
                                    <p className="text-rose-500 text-xs font-bold flex items-center gap-1">
                                        <XCircle size={13} /> {loanError}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsLoanModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loanSubmitting}
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-200 transition-all cursor-pointer"
                                    >
                                        {loanSubmitting ? 'Submitting...' : 'Submit Loan Request'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* LOAN DETAILS SLIDE-OVER DRAWER                                       */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedLoanDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <Coins size={16} className="text-indigo-600" />
                                    Loan Details & Repayment History
                                </h3>
                                <button
                                    onClick={() => setSelectedLoanDetails(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Requested Amount</p>
                                        <p className="font-extrabold text-slate-800 text-sm">{formatPKR(selectedLoanDetails.requestedAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Approved Amount</p>
                                        <p className="font-extrabold text-indigo-600 text-sm">{selectedLoanDetails.approvedAmount ? formatPKR(selectedLoanDetails.approvedAmount) : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Monthly Deduction</p>
                                        <p className="font-bold text-emerald-600">{selectedLoanDetails.monthlyDeduction ? formatPKR(selectedLoanDetails.monthlyDeduction) : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase text-[9px]">Status</p>
                                        <StatusBadge status={selectedLoanDetails.status} />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Reason</p>
                                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                                        {selectedLoanDetails.reason}
                                    </p>
                                </div>

                                {selectedLoanDetails.hrNotes && (
                                    <div>
                                        <p className="text-indigo-400 font-bold uppercase text-[9px] mb-1">HR Review Notes</p>
                                        <p className="text-xs text-indigo-800 bg-indigo-50 p-3 rounded-xl border border-indigo-100 font-semibold">
                                            {selectedLoanDetails.hrNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Repayment Log List */}
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px] mb-2">Payroll Repayment History</p>
                                    {(!selectedLoanDetails.repaymentLogs || selectedLoanDetails.repaymentLogs.length === 0) ? (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">No payroll deductions recorded yet.</p>
                                    ) : (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                            {selectedLoanDetails.repaymentLogs.map((log, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                                                    <span>{log.payrollMonth} Deduction</span>
                                                    <span className="text-rose-600">-{formatPKR(log.amountDeducted)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLoanDetails(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase transition-colors cursor-pointer"
                                    >
                                        Close
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

export default EmployeeHRRequests;