import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Star, Plus, Edit3, Trash2, X, Save, AlertCircle,
    DollarSign, Award, Calendar, User, ChevronRight, BarChart3,
    CheckCircle2, Clock, XCircle, ArrowUpRight, FileText, Target
} from 'lucide-react';
import apiClient from '../../api/axiosClient';

// ── Rating Labels ─────────────────────────────────────────────────────────────
const RATING_LABELS = {
    1: 'Needs Improvement',
    2: 'Average',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
};

const RATING_COLORS = {
    1: 'text-rose-500',
    2: 'text-amber-500',
    3: 'text-sky-500',
    4: 'text-emerald-500',
    5: 'text-indigo-600'
};

const RATING_BG = {
    1: 'bg-rose-50 border-rose-100',
    2: 'bg-amber-50 border-amber-100',
    3: 'bg-sky-50 border-sky-100',
    4: 'bg-emerald-50 border-emerald-100',
    5: 'bg-indigo-50 border-indigo-100'
};

const VALID_RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];

const STATUS_STYLES = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-rose-100 text-rose-700'
};

// ── Star Rating Display ───────────────────────────────────────────────────────
const StarRating = ({ rating, size = 14 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                size={size}
                className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
            />
        ))}
    </div>
);

// ── Format Helpers ────────────────────────────────────────────────────────────
const formatSalary = (amount) => {
    const val = Number(amount);
    if (isNaN(val)) return '₨ 0';
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0
    }).format(val);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
};

const formatDateInput = (dateStr) => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toISOString().split('T')[0];
    } catch { return ''; }
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const IncrementReviewPage = ({ employee }) => {
    const [activeSubTab, setActiveSubTab] = useState('increments');
    const [increments, setIncrements] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingInc, setLoadingInc] = useState(true);
    const [loadingRev, setLoadingRev] = useState(true);

    // Increment form state
    const [showIncForm, setShowIncForm] = useState(false);
    const [editingInc, setEditingInc] = useState(null);
    const [incForm, setIncForm] = useState({
        incrementDate: '', previousSalary: '', incrementAmount: '',
        promotionRank: '', reason: '', approvedBy: '', notes: '', status: 'Pending'
    });
    const [incErrors, setIncErrors] = useState({});
    const [incSubmitting, setIncSubmitting] = useState(false);

    // Review form state
    const [showRevForm, setShowRevForm] = useState(false);
    const [editingRev, setEditingRev] = useState(null);
    const [revForm, setRevForm] = useState({
        reviewDate: '', reviewPeriod: '', reviewer: '',
        overallRating: '', comments: '', strengths: '',
        areasForImprovement: '', goals: '', nextReviewDate: ''
    });
    const [revErrors, setRevErrors] = useState({});
    const [revSubmitting, setRevSubmitting] = useState(false);

    // ── Fetch Data ────────────────────────────────────────────────────────
    const fetchIncrements = useCallback(async () => {
        if (!employee?._id) return;
        setLoadingInc(true);
        try {
            const res = await apiClient.get(`/increments/${employee._id}`);
            setIncrements(res.data);
        } catch (err) {
            console.error('Error fetching increments:', err);
        } finally {
            setLoadingInc(false);
        }
    }, [employee?._id]);

    const fetchReviews = useCallback(async () => {
        if (!employee?._id) return;
        setLoadingRev(true);
        try {
            const res = await apiClient.get(`/performance-reviews/${employee._id}`);
            setReviews(res.data);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoadingRev(false);
        }
    }, [employee?._id]);

    useEffect(() => {
        fetchIncrements();
        fetchReviews();
    }, [fetchIncrements, fetchReviews]);

    // ── Career Summary KPIs ──────────────────────────────────────────────
    const careerSummary = useMemo(() => {
        const lastInc = increments.find(i => i.status === 'Approved') || increments[0] || null;
        const lastRev = reviews[0] || null;
        return {
            currentSalary: formatSalary(employee?.salary || 0),
            currentRank: employee?.promotionRank || 'Junior',
            lastIncDate: lastInc ? formatDate(lastInc.incrementDate) : 'No records',
            lastIncAmount: lastInc ? formatSalary(lastInc.incrementAmount) : '-',
            currentRating: lastRev ? lastRev.overallRating : null,
            lastRevDate: lastRev ? formatDate(lastRev.reviewDate) : 'No records'
        };
    }, [employee, increments, reviews]);

    // ══════════════════════════════════════════════════════════════════════
    // INCREMENT FORM LOGIC
    // ══════════════════════════════════════════════════════════════════════
    const openIncForm = (inc = null) => {
        if (inc) {
            setEditingInc(inc);
            setIncForm({
                incrementDate: formatDateInput(inc.incrementDate),
                previousSalary: inc.previousSalary ?? '',
                incrementAmount: inc.incrementAmount ?? '',
                promotionRank: inc.promotionRank || '',
                reason: inc.reason || '',
                approvedBy: inc.approvedBy || '',
                notes: inc.notes || '',
                status: inc.status || 'Pending'
            });
        } else {
            setEditingInc(null);
            setIncForm({
                incrementDate: new Date().toISOString().split('T')[0],
                previousSalary: employee?.salary || 0,
                incrementAmount: '',
                promotionRank: employee?.promotionRank || '',
                reason: '',
                approvedBy: '',
                notes: '',
                status: 'Pending'
            });
        }
        setIncErrors({});
        setShowIncForm(true);
    };

    const closeIncForm = () => {
        setShowIncForm(false);
        setEditingInc(null);
        setIncErrors({});
    };

    const isFutureDateSelected = useMemo(() => {
        if (!incForm.incrementDate) return false;
        const targetDate = new Date(incForm.incrementDate);
        const today = new Date();
        const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return targetDay > todayDay;
    }, [incForm.incrementDate]);

    const autoCalcNewSalary = Number(incForm.previousSalary || 0) + Number(incForm.incrementAmount || 0);
    const autoCalcPercentage = Number(incForm.previousSalary) > 0
        ? ((Number(incForm.incrementAmount || 0) / Number(incForm.previousSalary)) * 100).toFixed(2)
        : '0.00';

    const validateIncForm = () => {
        const errs = {};
        if (!incForm.incrementDate) {
            errs.incrementDate = 'Increment date is required';
        } else {
            const targetDate = new Date(incForm.incrementDate);
            const today = new Date();
            const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (targetDay < todayDay) {
                errs.incrementDate = 'Increment date cannot be in the past';
            }
        }
        if (incForm.previousSalary === '' || Number(incForm.previousSalary) < 0) errs.previousSalary = 'Previous salary must be 0 or more';
        if (incForm.incrementAmount === '' || Number(incForm.incrementAmount) < 0) errs.incrementAmount = 'Increment amount must be 0 or more';
        if (!incForm.reason.trim()) errs.reason = 'Reason is required';
        if (!incForm.approvedBy.trim()) errs.approvedBy = 'Approved By is required';
        if (incForm.promotionRank && !VALID_RANKS.includes(incForm.promotionRank)) errs.promotionRank = 'Invalid rank';
        setIncErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleIncSubmit = async (e) => {
        e.preventDefault();
        if (!validateIncForm()) return;
        setIncSubmitting(true);
        try {
            const payload = {
                employee: employee._id,
                incrementDate: incForm.incrementDate,
                previousSalary: Number(incForm.previousSalary),
                incrementAmount: Number(incForm.incrementAmount),
                promotionRank: incForm.promotionRank || null,
                reason: incForm.reason,
                approvedBy: incForm.approvedBy,
                notes: incForm.notes,
                status: incForm.status
            };

            if (editingInc) {
                await apiClient.put(`/increments/${editingInc._id}`, payload);
            } else {
                await apiClient.post('/increments', payload);
            }
            closeIncForm();
            fetchIncrements();
        } catch (err) {
            setIncErrors({ _server: err.response?.data?.msg || 'Failed to save increment' });
        } finally {
            setIncSubmitting(false);
        }
    };

    const handleDeleteInc = async (id) => {
        if (!window.confirm('Are you sure you want to delete this increment record?')) return;
        try {
            await apiClient.delete(`/increments/${id}`);
            fetchIncrements();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete increment');
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // REVIEW FORM LOGIC
    // ══════════════════════════════════════════════════════════════════════
    const openRevForm = (rev = null) => {
        if (rev) {
            setEditingRev(rev);
            setRevForm({
                reviewDate: formatDateInput(rev.reviewDate),
                reviewPeriod: rev.reviewPeriod || '',
                reviewer: rev.reviewer || '',
                overallRating: rev.overallRating ?? '',
                comments: rev.comments || '',
                strengths: rev.strengths || '',
                areasForImprovement: rev.areasForImprovement || '',
                goals: rev.goals || '',
                nextReviewDate: formatDateInput(rev.nextReviewDate)
            });
        } else {
            setEditingRev(null);
            setRevForm({
                reviewDate: new Date().toISOString().split('T')[0],
                reviewPeriod: '',
                reviewer: '',
                overallRating: '',
                comments: '',
                strengths: '',
                areasForImprovement: '',
                goals: '',
                nextReviewDate: ''
            });
        }
        setRevErrors({});
        setShowRevForm(true);
    };

    const closeRevForm = () => {
        setShowRevForm(false);
        setEditingRev(null);
        setRevErrors({});
    };

    const validateRevForm = () => {
        const errs = {};
        if (!revForm.reviewDate) errs.reviewDate = 'Review date is required';
        if (!revForm.reviewPeriod.trim()) errs.reviewPeriod = 'Review period is required';
        if (!revForm.reviewer.trim()) errs.reviewer = 'Reviewer name is required';
        const rating = Number(revForm.overallRating);
        if (!revForm.overallRating || isNaN(rating) || rating < 1 || rating > 5) errs.overallRating = 'Rating must be between 1 and 5';
        if (!revForm.comments.trim()) errs.comments = 'Comments are required';
        setRevErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleRevSubmit = async (e) => {
        e.preventDefault();
        if (!validateRevForm()) return;
        setRevSubmitting(true);
        try {
            const payload = {
                employee: employee._id,
                reviewDate: revForm.reviewDate,
                reviewPeriod: revForm.reviewPeriod,
                reviewer: revForm.reviewer,
                overallRating: Number(revForm.overallRating),
                comments: revForm.comments,
                strengths: revForm.strengths,
                areasForImprovement: revForm.areasForImprovement,
                goals: revForm.goals,
                nextReviewDate: revForm.nextReviewDate || null
            };

            if (editingRev) {
                await apiClient.put(`/performance-reviews/${editingRev._id}`, payload);
            } else {
                await apiClient.post('/performance-reviews', payload);
            }
            closeRevForm();
            fetchReviews();
        } catch (err) {
            setRevErrors({ _server: err.response?.data?.msg || 'Failed to save review' });
        } finally {
            setRevSubmitting(false);
        }
    };

    const handleDeleteRev = async (id) => {
        if (!window.confirm('Are you sure you want to delete this performance review?')) return;
        try {
            await apiClient.delete(`/performance-reviews/${id}`);
            fetchReviews();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete review');
        }
    };

    // ── Shared Input Classes ─────────────────────────────────────────────
    const INPUT_CLASS = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm";
    const INPUT_ERR = "w-full px-4 py-3 bg-rose-50/30 border border-rose-300 rounded-2xl outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-sm";
    const LABEL_CLASS = "text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest";

    // ══════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* ── Career Summary Strip ───────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-indigo-600 mb-5 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                    <BarChart3 size={18} /> Career Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Current Salary', value: careerSummary.currentSalary, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Current Rank', value: careerSummary.currentRank, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Last Increment', value: careerSummary.lastIncDate, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
                        { label: 'Last Inc. Amount', value: careerSummary.lastIncAmount, icon: ArrowUpRight, color: 'text-violet-600', bg: 'bg-violet-50' },
                        {
                            label: 'Current Rating',
                            value: careerSummary.currentRating
                                ? `${careerSummary.currentRating}/5 — ${RATING_LABELS[careerSummary.currentRating]}`
                                : 'No reviews',
                            icon: Star, color: 'text-amber-600', bg: 'bg-amber-50'
                        },
                        { label: 'Last Review', value: careerSummary.lastRevDate, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((kpi, i) => (
                        <div key={i} className={`${kpi.bg} p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 border border-slate-100/50`}>
                            <kpi.icon size={16} className={kpi.color} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{kpi.label}</span>
                            <span className={`text-[11px] font-bold ${kpi.color} leading-tight`}>{kpi.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Sub-Tab Switcher ────────────────────────────────────────── */}
            <div className="flex gap-2">
                {[
                    { key: 'increments', label: 'Salary Increments', icon: TrendingUp },
                    { key: 'reviews', label: 'Performance Reviews', icon: Star }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSubTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                            activeSubTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                INCREMENTS TAB
               ══════════════════════════════════════════════════════════════ */}
            {activeSubTab === 'increments' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                                <TrendingUp size={18} /> Salary Increment History
                            </h3>
                            <button
                                onClick={() => openIncForm()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                            >
                                <Plus size={16} /> Add Increment
                            </button>
                        </div>

                        {/* Increment Form Modal */}
                        <AnimatePresence>
                            {showIncForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 overflow-hidden"
                                >
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                <TrendingUp size={18} className="text-indigo-600" />
                                                {editingInc ? 'Edit Increment Record' : 'New Increment Record'}
                                            </h4>
                                            <button onClick={closeIncForm} className="p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
                                                <X size={18} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {incErrors._server && (
                                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                                                <AlertCircle size={16} /> {incErrors._server}
                                            </div>
                                        )}

                                        <form onSubmit={handleIncSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Increment Date */}
                                            <div>
                                                <label className={LABEL_CLASS}>Increment Date *</label>
                                                <input
                                                    type="date"
                                                    value={incForm.incrementDate}
                                                    onChange={e => setIncForm(p => ({ ...p, incrementDate: e.target.value }))}
                                                    className={incErrors.incrementDate ? INPUT_ERR : INPUT_CLASS}
                                                />
                                                {incErrors.incrementDate && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.incrementDate}</p>}
                                                {isFutureDateSelected && incForm.status === 'Approved' && (
                                                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] font-semibold mt-2">
                                                        <Clock size={14} className="shrink-0 text-indigo-500 animate-pulse" />
                                                        <span>Future Increment: This raise will automatically update the employee's active profile salary on {formatDate(incForm.incrementDate)}.</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Previous Salary */}
                                            <div>
                                                <label className={LABEL_CLASS}>Previous Salary (₨) *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={incForm.previousSalary}
                                                    onChange={e => setIncForm(p => ({ ...p, previousSalary: e.target.value }))}
                                                    className={incErrors.previousSalary ? INPUT_ERR : INPUT_CLASS}
                                                />
                                                {incErrors.previousSalary && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.previousSalary}</p>}
                                            </div>

                                            {/* Increment Amount */}
                                            <div>
                                                <label className={LABEL_CLASS}>Increment Amount (₨) *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={incForm.incrementAmount}
                                                    onChange={e => setIncForm(p => ({ ...p, incrementAmount: e.target.value }))}
                                                    className={incErrors.incrementAmount ? INPUT_ERR : INPUT_CLASS}
                                                />
                                                {incErrors.incrementAmount && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.incrementAmount}</p>}
                                            </div>

                                            {/* Auto-Calculated Fields */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={LABEL_CLASS}>New Salary (Auto)</label>
                                                    <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-bold text-emerald-700">
                                                        {formatSalary(autoCalcNewSalary)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Increment % (Auto)</label>
                                                    <div className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-2xl text-sm font-bold text-sky-700">
                                                        {autoCalcPercentage}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Promotion Rank */}
                                            <div>
                                                <label className={LABEL_CLASS}>Promotion Rank</label>
                                                <select
                                                    value={incForm.promotionRank}
                                                    onChange={e => setIncForm(p => ({ ...p, promotionRank: e.target.value }))}
                                                    className={`${incErrors.promotionRank ? INPUT_ERR : INPUT_CLASS} appearance-none`}
                                                >
                                                    <option value="">— Keep Current —</option>
                                                    {VALID_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                {incErrors.promotionRank && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.promotionRank}</p>}
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <label className={LABEL_CLASS}>Status *</label>
                                                <select
                                                    value={incForm.status}
                                                    onChange={e => setIncForm(p => ({ ...p, status: e.target.value }))}
                                                    className={`${INPUT_CLASS} appearance-none`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>

                                            {/* Reason */}
                                            <div className="md:col-span-2">
                                                <label className={LABEL_CLASS}>Reason *</label>
                                                <textarea
                                                    rows={2}
                                                    value={incForm.reason}
                                                    onChange={e => setIncForm(p => ({ ...p, reason: e.target.value }))}
                                                    className={incErrors.reason ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="e.g. Annual performance-based salary review"
                                                />
                                                {incErrors.reason && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.reason}</p>}
                                            </div>

                                            {/* Approved By */}
                                            <div>
                                                <label className={LABEL_CLASS}>Approved By *</label>
                                                <input
                                                    type="text"
                                                    value={incForm.approvedBy}
                                                    onChange={e => setIncForm(p => ({ ...p, approvedBy: e.target.value }))}
                                                    className={incErrors.approvedBy ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="e.g. CEO / HR Manager"
                                                />
                                                {incErrors.approvedBy && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{incErrors.approvedBy}</p>}
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className={LABEL_CLASS}>Notes (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={incForm.notes}
                                                    onChange={e => setIncForm(p => ({ ...p, notes: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                    placeholder="Additional notes..."
                                                />
                                            </div>

                                            {/* Submit */}
                                            <div className="md:col-span-2 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={incSubmitting}
                                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                                >
                                                    {incSubmitting ? 'Saving...' : <><Save size={18} /> {editingInc ? 'Update Increment' : 'Save Increment'}</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Increment History Table */}
                        {loadingInc ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                            </div>
                        ) : increments.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-sm text-slate-400 font-bold">No increment records found for this employee.</p>
                                <p className="text-xs text-slate-300 mt-1">Click "Add Increment" to create the first record.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                                            <th className="py-2.5">Date</th>
                                            <th className="py-2.5">Previous</th>
                                            <th className="py-2.5">Increment</th>
                                            <th className="py-2.5">%</th>
                                            <th className="py-2.5">New Salary</th>
                                            <th className="py-2.5">Rank</th>
                                            <th className="py-2.5">Approved By</th>
                                            <th className="py-2.5">Status</th>
                                            <th className="py-2.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {increments.map(inc => (
                                            <tr key={inc._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 pr-2 font-medium text-slate-700">{formatDate(inc.incrementDate)}</td>
                                                <td className="py-3 pr-2 text-slate-500">{formatSalary(inc.previousSalary)}</td>
                                                <td className="py-3 pr-2 font-bold text-emerald-600">+{formatSalary(inc.incrementAmount)}</td>
                                                <td className="py-3 pr-2">
                                                    <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                                                        {inc.incrementPercentage}%
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-2 font-bold text-slate-800">{formatSalary(inc.newSalary)}</td>
                                                <td className="py-3 pr-2">
                                                    {inc.promotionRank ? (
                                                        <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                                                            {inc.promotionRank}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-3 pr-2 text-slate-500">{inc.approvedBy}</td>
                                                <td className="py-3 pr-2">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${STATUS_STYLES[inc.status] || ''}`}>
                                                        {inc.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openIncForm(inc)}
                                                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInc(inc._id)}
                                                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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

            {/* ══════════════════════════════════════════════════════════════
                PERFORMANCE REVIEWS TAB
               ══════════════════════════════════════════════════════════════ */}
            {activeSubTab === 'reviews' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                                <Star size={18} /> Performance Review History
                            </h3>
                            <button
                                onClick={() => openRevForm()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                            >
                                <Plus size={16} /> Add Review
                            </button>
                        </div>

                        {/* Review Form */}
                        <AnimatePresence>
                            {showRevForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 overflow-hidden"
                                >
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                <Star size={18} className="text-amber-500" />
                                                {editingRev ? 'Edit Performance Review' : 'New Performance Review'}
                                            </h4>
                                            <button onClick={closeRevForm} className="p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
                                                <X size={18} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {revErrors._server && (
                                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                                                <AlertCircle size={16} /> {revErrors._server}
                                            </div>
                                        )}

                                        <form onSubmit={handleRevSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Review Date */}
                                            <div>
                                                <label className={LABEL_CLASS}>Review Date *</label>
                                                <input
                                                    type="date"
                                                    value={revForm.reviewDate}
                                                    onChange={e => setRevForm(p => ({ ...p, reviewDate: e.target.value }))}
                                                    className={revErrors.reviewDate ? INPUT_ERR : INPUT_CLASS}
                                                />
                                                {revErrors.reviewDate && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.reviewDate}</p>}
                                            </div>

                                            {/* Review Period */}
                                            <div>
                                                <label className={LABEL_CLASS}>Review Period *</label>
                                                <input
                                                    type="text"
                                                    value={revForm.reviewPeriod}
                                                    onChange={e => setRevForm(p => ({ ...p, reviewPeriod: e.target.value }))}
                                                    className={revErrors.reviewPeriod ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="e.g. Jan 2026 – Jun 2026"
                                                />
                                                {revErrors.reviewPeriod && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.reviewPeriod}</p>}
                                            </div>

                                            {/* Reviewer */}
                                            <div>
                                                <label className={LABEL_CLASS}>Reviewer *</label>
                                                <input
                                                    type="text"
                                                    value={revForm.reviewer}
                                                    onChange={e => setRevForm(p => ({ ...p, reviewer: e.target.value }))}
                                                    className={revErrors.reviewer ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="e.g. Team Lead / HR Manager"
                                                />
                                                {revErrors.reviewer && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.reviewer}</p>}
                                            </div>

                                            {/* Rating */}
                                            <div>
                                                <label className={LABEL_CLASS}>Overall Rating *</label>
                                                <select
                                                    value={revForm.overallRating}
                                                    onChange={e => setRevForm(p => ({ ...p, overallRating: e.target.value }))}
                                                    className={`${revErrors.overallRating ? INPUT_ERR : INPUT_CLASS} appearance-none`}
                                                >
                                                    <option value="">— Select Rating —</option>
                                                    {[5, 4, 3, 2, 1].map(r => (
                                                        <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)} — {RATING_LABELS[r]}</option>
                                                    ))}
                                                </select>
                                                {revErrors.overallRating && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.overallRating}</p>}
                                            </div>

                                            {/* Comments */}
                                            <div className="md:col-span-2">
                                                <label className={LABEL_CLASS}>Comments *</label>
                                                <textarea
                                                    rows={2}
                                                    value={revForm.comments}
                                                    onChange={e => setRevForm(p => ({ ...p, comments: e.target.value }))}
                                                    className={revErrors.comments ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="Overall performance summary..."
                                                />
                                                {revErrors.comments && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.comments}</p>}
                                            </div>

                                            {/* Strengths */}
                                            <div>
                                                <label className={LABEL_CLASS}>Strengths</label>
                                                <textarea
                                                    rows={2}
                                                    value={revForm.strengths}
                                                    onChange={e => setRevForm(p => ({ ...p, strengths: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                    placeholder="Key strengths observed..."
                                                />
                                            </div>

                                            {/* Areas for Improvement */}
                                            <div>
                                                <label className={LABEL_CLASS}>Areas for Improvement</label>
                                                <textarea
                                                    rows={2}
                                                    value={revForm.areasForImprovement}
                                                    onChange={e => setRevForm(p => ({ ...p, areasForImprovement: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                    placeholder="Areas needing development..."
                                                />
                                            </div>

                                            {/* Goals */}
                                            <div>
                                                <label className={LABEL_CLASS}>Goals</label>
                                                <textarea
                                                    rows={2}
                                                    value={revForm.goals}
                                                    onChange={e => setRevForm(p => ({ ...p, goals: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                    placeholder="Goals for next review period..."
                                                />
                                            </div>

                                            {/* Next Review Date */}
                                            <div>
                                                <label className={LABEL_CLASS}>Next Review Date</label>
                                                <input
                                                    type="date"
                                                    value={revForm.nextReviewDate}
                                                    onChange={e => setRevForm(p => ({ ...p, nextReviewDate: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            {/* Submit */}
                                            <div className="md:col-span-2 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={revSubmitting}
                                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                                >
                                                    {revSubmitting ? 'Saving...' : <><Save size={18} /> {editingRev ? 'Update Review' : 'Save Review'}</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Review History Cards */}
                        {loadingRev ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12">
                                <Star size={40} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-sm text-slate-400 font-bold">No performance reviews found for this employee.</p>
                                <p className="text-xs text-slate-300 mt-1">Click "Add Review" to create the first review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(rev => (
                                    <motion.div
                                        key={rev._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`border rounded-2xl p-5 hover:shadow-md transition-all ${RATING_BG[rev.overallRating] || 'bg-slate-50 border-slate-100'}`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <StarRating rating={rev.overallRating} size={16} />
                                                    <span className={`text-xs font-bold ${RATING_COLORS[rev.overallRating]}`}>
                                                        {RATING_LABELS[rev.overallRating]}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold bg-white/60 px-2 py-0.5 rounded-lg border border-slate-200/50">
                                                        {rev.reviewPeriod}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                                                    <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(rev.reviewDate)}</span>
                                                    <span className="flex items-center gap-1"><User size={11} /> {rev.reviewer}</span>
                                                    {rev.nextReviewDate && (
                                                        <span className="flex items-center gap-1"><Clock size={11} /> Next: {formatDate(rev.nextReviewDate)}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">{rev.comments}</p>
                                                {(rev.strengths || rev.areasForImprovement || rev.goals) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                                                        {rev.strengths && (
                                                            <div className="bg-white/50 rounded-xl p-2.5 border border-slate-100/50">
                                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 size={10} /> Strengths</p>
                                                                <p className="text-xs text-slate-500">{rev.strengths}</p>
                                                            </div>
                                                        )}
                                                        {rev.areasForImprovement && (
                                                            <div className="bg-white/50 rounded-xl p-2.5 border border-slate-100/50">
                                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={10} /> Improve</p>
                                                                <p className="text-xs text-slate-500">{rev.areasForImprovement}</p>
                                                            </div>
                                                        )}
                                                        {rev.goals && (
                                                            <div className="bg-white/50 rounded-xl p-2.5 border border-slate-100/50">
                                                                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={10} /> Goals</p>
                                                                <p className="text-xs text-slate-500">{rev.goals}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => openRevForm(rev)}
                                                    className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRev(rev._id)}
                                                    className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncrementReviewPage;
