import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Star, Plus, Edit3, Trash2, X, Save, AlertCircle,
    DollarSign, Award, Calendar, User, ChevronRight, BarChart3,
    CheckCircle2, Clock, XCircle, ArrowUpRight, FileText, Target, ShieldCheck
} from 'lucide-react';
import apiClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import RestoreCardModal from './RestoreCardModal';

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
    1: 'bg-rose-50/50 border-rose-100',
    2: 'bg-amber-50/50 border-amber-100',
    3: 'bg-sky-50/50 border-sky-100',
    4: 'bg-emerald-50/50 border-emerald-100',
    5: 'bg-indigo-50/50 border-indigo-100'
};

const VALID_RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];

const STATUS_STYLES = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200'
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

// ── Custom Interactive Star Rating Selector ─────────────────────────────────
const StarRatingSelector = ({ value, onChange, error }) => {
    const [hoverValue, setHoverValue] = useState(null);

    const LABEL_CLASS = "text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest";

    return (
        <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Overall Rating *</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 min-h-[50px] focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            onMouseEnter={() => setHoverValue(star)}
                            onMouseLeave={() => setHoverValue(null)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        >
                            <Star
                                size={22}
                                className={`${star <= (hoverValue || value)
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-200'
                                    } transition-colors duration-150`}
                            />
                        </button>
                    ))}
                </div>
                {(hoverValue || value) ? (
                    <span className={`text-xs font-black uppercase tracking-wider ml-1.5 ${RATING_COLORS[hoverValue || value]}`}>
                        {RATING_LABELS[hoverValue || value]}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 font-bold ml-1.5">Select a rating</span>
                )}
            </div>
            {error && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{error}</p>}
        </div>
    );
};

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
    const { user: hrUser } = useContext(AuthContext);

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
        reviewDate: '', reviewer: '', overallRating: '',
        comments: '', strengths: '', areasForImprovement: '', goals: '', nextReviewDate: ''
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

    // ── Predefined Career Summary Cards ──────────────────────────────────
    const predefinedCareerCards = useMemo(() => [
        {
            id: 'salary',
            label: 'Current Salary',
            value: careerSummary.currentSalary,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            id: 'rank',
            label: 'Current Rank',
            value: careerSummary.currentRank,
            icon: Award,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            id: 'lastIncDate',
            label: 'Last Increment',
            value: careerSummary.lastIncDate,
            icon: TrendingUp,
            color: 'text-sky-600',
            bg: 'bg-sky-50'
        },
        {
            id: 'lastIncAmount',
            label: 'Last Inc. Amount',
            value: careerSummary.lastIncAmount,
            icon: ArrowUpRight,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            id: 'currentRating',
            label: 'Current Rating',
            value: careerSummary.currentRating
                ? `${careerSummary.currentRating}/5 — ${RATING_LABELS[careerSummary.currentRating]}`
                : 'No reviews',
            icon: Star,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            id: 'lastRevDate',
            label: 'Last Review',
            value: careerSummary.lastRevDate,
            icon: Calendar,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ], [careerSummary]);

    const [hiddenCareerCards, setHiddenCareerCards] = useState([]);
    const [showAddCareerDropdown, setShowAddCareerDropdown] = useState(false);
    const careerDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (careerDropdownRef.current && !careerDropdownRef.current.contains(event.target)) {
                setShowAddCareerDropdown(false);
            }
        };
        if (showAddCareerDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAddCareerDropdown]);

    useEffect(() => {
        if (!employee?._id) return;
        try {
            const stored = localStorage.getItem(`hidden_career_${employee._id}`);
            if (stored !== null) {
                setHiddenCareerCards(JSON.parse(stored));
                return;
            }
        } catch (e) {}
        setHiddenCareerCards(employee.hiddenCareerCards || []);
    }, [employee?._id, employee?.hiddenCareerCards]);

    const visibleCareerCards = useMemo(() => {
        return predefinedCareerCards.filter(c => !hiddenCareerCards.includes(c.id));
    }, [predefinedCareerCards, hiddenCareerCards]);

    const removedCareerCards = useMemo(() => {
        return predefinedCareerCards.filter(c => hiddenCareerCards.includes(c.id));
    }, [predefinedCareerCards, hiddenCareerCards]);

    const handleHideCareerCard = async (id) => {
        const nextHidden = Array.from(new Set([...hiddenCareerCards, id]));
        setHiddenCareerCards(nextHidden);
        if (employee) employee.hiddenCareerCards = nextHidden;
        try {
            localStorage.setItem(`hidden_career_${employee._id}`, JSON.stringify(nextHidden));
            await apiClient.put(`/auth/users/${employee._id}/card-visibility`, {
                hiddenCareerCards: nextHidden
            });
        } catch (e) {
            console.error('Error updating career card visibility:', e);
        }
    };

    const handleRestoreCareerCard = async (id) => {
        const nextHidden = hiddenCareerCards.filter(cId => cId !== id);
        setHiddenCareerCards(nextHidden);
        if (employee) employee.hiddenCareerCards = nextHidden;
        try {
            localStorage.setItem(`hidden_career_${employee._id}`, JSON.stringify(nextHidden));
            await apiClient.put(`/auth/users/${employee._id}/card-visibility`, {
                hiddenCareerCards: nextHidden
            });
        } catch (e) {
            console.error('Error updating career card visibility:', e);
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // INCREMENT FORM LOGIC
    // ══════════════════════════════════════════════════════════════════════
    const openIncForm = (inc = null) => {
        const currentHrName = hrUser?.name || 'HR Admin';
        if (inc) {
            setEditingInc(inc);
            setIncForm({
                incrementDate: formatDateInput(inc.incrementDate),
                previousSalary: inc.previousSalary ?? '',
                incrementAmount: inc.incrementAmount ?? '',
                promotionRank: inc.promotionRank || '',
                reason: inc.reason || '',
                approvedBy: inc.approvedBy || currentHrName,
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
                approvedBy: currentHrName,
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
        const parts = incForm.incrementDate.split('-');
        if (parts.length !== 3) return false;
        const targetDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const today = new Date();
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
            const parts = incForm.incrementDate.split('-');
            if (parts.length === 3) {
                const targetDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                const today = new Date();
                const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                if (targetDay < todayDay) {
                    errs.incrementDate = 'Increment date cannot be in the past';
                }
            } else {
                errs.incrementDate = 'Valid increment date is required';
            }
        }
        if (incForm.previousSalary === '' || Number(incForm.previousSalary) < 0) errs.previousSalary = 'Previous salary must be 0 or more';
        if (incForm.incrementAmount === '' || Number(incForm.incrementAmount) < 0) errs.incrementAmount = 'Increment amount must be 0 or more';
        if (incForm.incrementAmount === 0 || incForm.incrementAmount === '0') errs.incrementAmount = 'Increment amount is required and must be greater than 0';
        if (!incForm.reason.trim()) errs.reason = 'Reason is required';
        if (incForm.promotionRank) {
            if (!VALID_RANKS.includes(incForm.promotionRank)) {
                errs.promotionRank = 'Invalid rank';
            } else {
                const currentRankIndex = VALID_RANKS.indexOf(employee?.promotionRank || 'Junior');
                const selectedRankIndex = VALID_RANKS.indexOf(incForm.promotionRank);
                if (selectedRankIndex < currentRankIndex) {
                    errs.promotionRank = `Cannot assign a rank lower than current (${employee?.promotionRank || 'Junior'})`;
                }
            }
        }
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
        const currentHrName = hrUser?.name || 'HR Admin';
        if (rev) {
            setEditingRev(rev);
            setRevForm({
                reviewDate: formatDateInput(rev.reviewDate),
                reviewer: rev.reviewer || currentHrName,
                overallRating: rev.overallRating ?? '',
                comments: rev.comments || '',
                strengths: rev.strengths || '',
                areasForImprovement: rev.areasForImprovement || '',
                goals: rev.goals || ''
            });
        } else {
            setEditingRev(null);
            setRevForm({
                reviewDate: new Date().toISOString().split('T')[0],
                reviewer: currentHrName,
                overallRating: '',
                comments: '',
                strengths: '',
                areasForImprovement: '',
                goals: ''
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
        const rating = Number(revForm.overallRating);
        if (!revForm.overallRating || isNaN(rating) || rating < 1 || rating > 5) errs.overallRating = 'Rating is required';
        if (!revForm.comments.trim()) errs.comments = 'Comments are required';
        if (!revForm.goals.trim()) errs.goals = 'Goals are required';
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
                overallRating: Number(revForm.overallRating),
                comments: revForm.comments,
                strengths: revForm.strengths,
                areasForImprovement: revForm.areasForImprovement,
                goals: revForm.goals
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
    const INPUT_CLASS = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-semibold text-slate-700";
    const INPUT_ERR = "w-full px-4 py-3 bg-rose-50/30 border border-rose-300 rounded-2xl outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-sm font-semibold text-slate-700";
    const LABEL_CLASS = "text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest";
    const READONLY_INPUT = "w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl outline-none text-slate-500 text-sm font-semibold cursor-default select-none pointer-events-none";

    // ══════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* ── CAREER SUMMARY STRIP ── */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 relative overflow-visible">
                <div className="flex items-center justify-between mb-5 border-b border-indigo-50 pb-3">
                    <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                        <BarChart3 size={16} /> Career Summary
                    </h3>
                    {removedCareerCards.length > 0 && (
                        <div className="relative" ref={careerDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowAddCareerDropdown(prev => !prev)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-200 hover:shadow-indigo-300"
                            >
                                <Plus size={14} /> Add Card
                                <span className="ml-0.5 px-1.5 py-0.2 bg-white/25 rounded-md text-[10px] font-extrabold">
                                    {removedCareerCards.length}
                                </span>
                            </button>

                            <AnimatePresence>
                                {showAddCareerDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-2 z-[100] overflow-hidden"
                                    >
                                        <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100/80 mb-1 flex items-center justify-between">
                                            <span>Available Cards</span>
                                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">
                                                {removedCareerCards.length} hidden
                                            </span>
                                        </div>
                                        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                                            {removedCareerCards.map(kpi => {
                                                const IconComp = kpi.icon || DollarSign;
                                                return (
                                                    <button
                                                        key={kpi.id}
                                                        type="button"
                                                        onClick={() => {
                                                            handleRestoreCareerCard(kpi.id);
                                                            setShowAddCareerDropdown(false);
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-all cursor-pointer group border border-transparent hover:border-indigo-100/80"
                                                    >
                                                        <span className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                                                                <IconComp size={14} />
                                                            </div>
                                                            <span className="truncate">{kpi.label}</span>
                                                        </span>
                                                        <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-100/70 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shrink-0">
                                                            <Plus size={11} /> Add
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {visibleCareerCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                            <BarChart3 size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">All career summary cards are currently removed</p>
                        <p className="text-[11px] text-slate-400 font-medium max-w-xs">
                            Click the <span className="text-indigo-600 font-bold">+ Add Card</span> button above to restore any metrics.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {visibleCareerCards.map((kpi) => {
                            const IconComp = kpi.icon || DollarSign;
                            return (
                                <div
                                    key={kpi.id}
                                    className={`group relative ${kpi.bg} p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border border-slate-100/50 min-h-[76px] transition-all hover:shadow-xs`}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHideCareerCard(kpi.id);
                                        }}
                                        title="Remove card from view"
                                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-100/90 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-slate-200/50 z-10"
                                    >
                                        <X size={10} />
                                    </button>
                                    <IconComp size={16} className={kpi.color} />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{kpi.label}</span>
                                    <span className={`text-[11px] font-bold ${kpi.color} leading-tight`}>{kpi.value}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Sub-Tab Switcher ── */}
            <div className="flex gap-2">
                {[
                    { key: 'increments', label: 'Salary Increments', icon: TrendingUp },
                    { key: 'reviews', label: 'Performance Reviews', icon: Star }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSubTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                INCREMENTS TAB
               ══════════════════════════════════════════════════════════════ */}
            {activeSubTab === 'increments' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-2">
                                <TrendingUp size={16} /> Salary Increment History
                            </h3>
                            {/* Hide Add Increment button when form is currently open */}
                            {!showIncForm && (
                                <button
                                    onClick={() => openIncForm()}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                                >
                                    <Plus size={14} /> Add Increment
                                </button>
                            )}
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
                                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp size={16} className="text-indigo-600" />
                                                {editingInc ? 'Edit Increment Record' : 'New Increment Record'}
                                            </h4>
                                            <button onClick={closeIncForm} className="p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
                                                <X size={16} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {incErrors._server && (
                                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-2">
                                                <AlertCircle size={16} /> {incErrors._server}
                                            </div>
                                        )}

                                        <form onSubmit={handleIncSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Increment Date */}
                                            <div>
                                                <label className={LABEL_CLASS}>Increment Date *</label>
                                                <input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
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
                                                <label className={LABEL_CLASS}>Previous Salary (₨) (Read-only)</label>
                                                <input
                                                    type="number"
                                                    value={incForm.previousSalary}
                                                    readOnly
                                                    className={READONLY_INPUT}
                                                />
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
                                                    placeholder="Enter salary increase amount"
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
                                                    className={`${incErrors.promotionRank ? INPUT_ERR : INPUT_CLASS} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%252394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
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
                                                    className={`${INPUT_CLASS} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%252394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
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

                                            {/* Approved By (Auto-populated, Read-only) */}
                                            <div>
                                                <label className={LABEL_CLASS}>Approved By (Auto)</label>
                                                <input
                                                    type="text"
                                                    value={incForm.approvedBy}
                                                    readOnly
                                                    className={READONLY_INPUT}
                                                />
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
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                                                >
                                                    {incSubmitting ? 'Saving...' : <><Save size={16} /> {editingInc ? 'Update Increment' : 'Save Increment'}</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Redesigned Premium Timeline-styled Increment Table */}
                        {loadingInc ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                            </div>
                        ) : increments.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingUp size={36} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No increment history found.</p>
                                <p className="text-[11px] text-slate-300 mt-1">Add a new record to begin tracking.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-2xs">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-2">Previous Salary</th>
                                            <th className="py-3 px-2">Increment Amount</th>
                                            <th className="py-3 px-2">%</th>
                                            <th className="py-3 px-2">New Salary</th>
                                            <th className="py-3 px-2">Rank</th>
                                            <th className="py-3 px-2">Approved By</th>
                                            <th className="py-3 px-2">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {increments.map(inc => (
                                            <tr key={inc._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-slate-700">{formatDate(inc.incrementDate)}</td>
                                                <td className="py-3.5 px-2 text-slate-400 font-semibold">{formatSalary(inc.previousSalary)}</td>
                                                <td className="py-3.5 px-2 font-bold text-emerald-600">+{formatSalary(inc.incrementAmount)}</td>
                                                <td className="py-3.5 px-2">
                                                    <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-lg font-black text-[9px]">
                                                        {inc.incrementPercentage}%
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-2 font-black text-slate-800">{formatSalary(inc.newSalary)}</td>
                                                <td className="py-3.5 px-2">
                                                    {inc.promotionRank ? (
                                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider">
                                                            {inc.promotionRank}
                                                        </span>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="py-3.5 px-2 text-slate-500 font-bold">{inc.approvedBy}</td>
                                                <td className="py-3.5 px-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border ${STATUS_STYLES[inc.status] || ''}`}>
                                                        {inc.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openIncForm(inc)}
                                                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInc(inc._id)}
                                                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
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
                    <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-2">
                                <Star size={16} /> Performance Review History
                            </h3>
                            {/* Hide Add Review button when form is currently open */}
                            {!showRevForm && (
                                <button
                                    onClick={() => openRevForm()}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                                >
                                    <Plus size={14} /> Add Review
                                </button>
                            )}
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
                                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Star size={16} className="text-amber-500 fill-amber-500" />
                                                {editingRev ? 'Edit Performance Review' : 'New Performance Review'}
                                            </h4>
                                            <button onClick={closeRevForm} className="p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
                                                <X size={16} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {revErrors._server && (
                                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-2">
                                                <AlertCircle size={16} /> {revErrors._server}
                                            </div>
                                        )}

                                        <form onSubmit={handleRevSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Review Date (Read-only) */}
                                            <div>
                                                <label className={LABEL_CLASS}>Review Date (Auto Today)</label>
                                                <input
                                                    type="text"
                                                    value={formatDate(revForm.reviewDate)}
                                                    readOnly
                                                    className={READONLY_INPUT}
                                                />
                                            </div>

                                            {/* Custom Star Rating Selector (Redesigned rating dropdown) */}
                                            <StarRatingSelector
                                                value={revForm.overallRating}
                                                onChange={val => setRevForm(p => ({ ...p, overallRating: val }))}
                                                error={revErrors.overallRating}
                                            />

                                            {/* Reviewer (Auto-populated, Read-only) */}
                                            <div>
                                                <label className={LABEL_CLASS}>Reviewer (Auto)</label>
                                                <input
                                                    type="text"
                                                    value={revForm.reviewer}
                                                    readOnly
                                                    className={READONLY_INPUT}
                                                />
                                            </div>

                                            {/* Comments */}
                                            <div className="md:col-span-2">
                                                <label className={LABEL_CLASS}>Comments *</label>
                                                <textarea
                                                    rows={2}
                                                    value={revForm.comments}
                                                    onChange={e => setRevForm(p => ({ ...p, comments: e.target.value }))}
                                                    className={revErrors.comments ? INPUT_ERR : INPUT_CLASS}
                                                    placeholder="Provide general notes, evaluation, and feedback..."
                                                />
                                                {revErrors.comments && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.comments}</p>}
                                            </div>

                                            {/* Strengths */}
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                        placeholder="Skills/areas needing development..."
                                                    />
                                                </div>

                                                {/* Goals */}
                                                <div>
                                                    <label className={LABEL_CLASS}>Goals *</label>
                                                    <textarea
                                                        rows={2}
                                                        value={revForm.goals}
                                                        onChange={e => setRevForm(p => ({ ...p, goals: e.target.value }))}
                                                        className={revErrors.goals ? INPUT_ERR : INPUT_CLASS}
                                                        placeholder="Review goals & targets for next period..."
                                                    />
                                                    {revErrors.goals && <p className="text-rose-500 text-[11px] font-semibold mt-1 ml-1">{revErrors.goals}</p>}
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <div className="md:col-span-2 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={revSubmitting}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                                                >
                                                    {revSubmitting ? 'Saving...' : <><Save size={16} /> {editingRev ? 'Update Review' : 'Save Review'}</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Redesigned Premium Performance Review History Cards */}
                        {loadingRev ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12">
                                <Star size={36} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No performance reviews found.</p>
                                <p className="text-[11px] text-slate-300 mt-1">Review the employee's work to create the first record.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(rev => (
                                    <motion.div
                                        key={rev._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`border rounded-2xl p-5 hover:shadow-xs transition-all bg-white border-slate-200`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Header Details */}
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <StarRating rating={rev.overallRating} size={15} />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-md ${RATING_COLORS[rev.overallRating]}`}>
                                                        {RATING_LABELS[rev.overallRating]}
                                                    </span>
                                                </div>

                                                {/* Review Metadata */}
                                                <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">
                                                    <span className="flex items-center gap-1.5"><Calendar size={11} className="text-indigo-500" /> Date: {formatDate(rev.reviewDate)}</span>
                                                    <span className="flex items-center gap-1.5"><User size={11} className="text-indigo-500" /> Reviewer: {rev.reviewer}</span>
                                                    <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-indigo-500" /> Created: {formatDate(rev.createdAt)}</span>
                                                </div>

                                                {/* Comments Block */}
                                                <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-3 bg-slate-50 border border-slate-100 p-3 rounded-xl italic">
                                                    "{rev.comments}"
                                                </p>

                                                {/* Details Sub-Grid (Strengths, Improvements, Goals) */}
                                                {(rev.strengths || rev.areasForImprovement || rev.goals) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                                                        {rev.strengths && (
                                                            <div className="bg-emerald-50/20 rounded-xl p-3 border border-emerald-100/50">
                                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CheckCircle2 size={11} /> Strengths</p>
                                                                <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.strengths}</p>
                                                            </div>
                                                        )}
                                                        {rev.areasForImprovement && (
                                                            <div className="bg-amber-50/20 rounded-xl p-3 border border-amber-100/50">
                                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target size={11} /> Areas to Improve</p>
                                                                <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.areasForImprovement}</p>
                                                            </div>
                                                        )}
                                                        {rev.goals && (
                                                            <div className="bg-indigo-50/20 rounded-xl p-3 border border-indigo-100/50">
                                                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileText size={11} /> Review Goals</p>
                                                                <p className="text-xs font-semibold text-slate-600 leading-normal">{rev.goals}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => openRevForm(rev)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRev(rev._id)}
                                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
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
