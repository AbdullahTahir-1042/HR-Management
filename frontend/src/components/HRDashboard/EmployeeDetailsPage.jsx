import React, { useMemo, useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Mail, Shield, Briefcase, Building2, UserCheck,
    Calendar, DollarSign, User, Phone, Edit3, Wallet,
    AlertCircle, Trash2, ClipboardList, TrendingUp, Star, Award, Award as RankIcon, CheckCircle2, Clock, X, Plus, LayoutGrid, Coins
} from 'lucide-react';
import IncrementReviewPage from './IncrementReviewPage';
import apiClient from '../../api/axiosClient';
import RestoreCardModal from './RestoreCardModal';
import { AuthContext } from '../../context/AuthContext';

const RATING_LABELS = {
    1: 'Needs Improvement',
    2: 'Average',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
};

const VALID_RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];

const EmployeeDetailsPage = ({ employee: propEmployee, leaves = [], leaveTypes = [], onBack, onEdit, onDelete }) => {
    const employee = propEmployee || {};
    const { user: currentUser } = useContext(AuthContext);
    const [activeDetailTab, setActiveDetailTab] = useState('profile');
    const [increments, setIncrements] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Scroll to top on detail sub-tab changes
    useEffect(() => {
        window.scrollTo(0, 0);
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
    }, [activeDetailTab]);

    // Fetch summaries on mount or employee change
    useEffect(() => {
        const fetchSummaryData = async () => {
            if (!employee?._id) return;
            setLoadingSummary(true);
            try {
                const incRes = await apiClient.get(`/increments/${employee._id}`);
                setIncrements(incRes.data || []);
            } catch (e) {
                console.error('Error fetching increments summary:', e);
            }
            try {
                const revRes = await apiClient.get(`/performance-reviews/${employee._id}`);
                setReviews(revRes.data || []);
            } catch (e) {
                console.error('Error fetching reviews summary:', e);
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchSummaryData();
    }, [employee?._id]);

    // Removed early return to comply with React Hooks rules
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) { return '-'; }
    };

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const formatSalary = (amount) => {
        const val = Number(amount);
        if (isNaN(val)) return '₨ 0';
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Active Loan state
    const [activeLoan, setActiveLoan] = useState(null);

    useEffect(() => {
        if (!employee?._id) return;
        apiClient.get(`/loans/active/${employee._id}`)
            .then(res => setActiveLoan(res.data))
            .catch(err => console.error('Error fetching employee active loan:', err));
    }, [employee?._id]);

    // Calculate Net Salary for this month
    const salaryData = useMemo(() => {
        const rawSalary = employee.salary;
        const baseSalary = Number(rawSalary) || 0;
        const oneDaySalary = baseSalary / 30;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const safeLeaves = Array.isArray(leaves) ? leaves : [];

        const employeeLeaves = safeLeaves.filter(l => {
            if (!l.startDate || !l.employee) return false;
            const leaveDate = new Date(l.startDate);
            const isThisMonth = leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
            const leaveEmpId = (typeof l.employee === 'object' && l.employee !== null) ? (l.employee._id || l.employee.id) : l.employee;
            const isEmployee = String(leaveEmpId) === String(employee._id);
            return isEmployee && l.status === 'approved' && isThisMonth;
        });

        let totalLeaveDays = 0;
        employeeLeaves.forEach(l => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            if (!isNaN(start) && !isNaN(end)) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                totalLeaveDays += diffDays;
            }
        });

        const leaveDeduction = Math.round(oneDaySalary * totalLeaveDays);
        const loanDeduction = activeLoan ? (activeLoan.monthlyDeduction || 0) : 0;
        const totalDeductions = leaveDeduction + loanDeduction;
        const netSalary = Math.max(0, baseSalary - totalDeductions);

        return {
            netSalary,
            totalLeaveDays,
            leaveDeduction,
            loanDeduction,
            totalDeductions,
            baseSalary,
            hasSalary: baseSalary > 0
        };
    }, [employee._id, employee.salary, leaves, activeLoan]);

    // Calculate leave balances per type
    const leaveBalances = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const safeLeaves = Array.isArray(leaves) ? leaves : [];
        const safeTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

        // Filter approved leaves for this employee in the current calendar year
        const employeeApprovedLeaves = safeLeaves.filter(l => {
            if (!l.startDate || !l.employee) return false;
            const leaveEmpId = (typeof l.employee === 'object' && l.employee !== null) ? (l.employee._id || l.employee.id) : l.employee;
            const isEmployee = String(leaveEmpId) === String(employee._id);
            const leaveDate = new Date(l.startDate);
            const isThisYear = leaveDate.getFullYear() === currentYear;
            return isEmployee && l.status === 'approved' && isThisYear;
        });

        // Sum days per leaveType
        const usedMap = {};
        employeeApprovedLeaves.forEach(l => {
            const days = calculateDays(l.startDate, l.endDate);
            if (l.leaveType) {
                const typeIdStr = l.leaveType._id ? l.leaveType._id.toString() : l.leaveType.toString();
                usedMap[typeIdStr] = (usedMap[typeIdStr] || 0) + days;
            }
        });

        return safeTypes.map(t => {
            const used = usedMap[t._id.toString()] || 0;
            return {
                leaveType: t,
                allocated: t.quota,
                used,
                remaining: Math.max(0, t.quota - used)
            };
        });
    }, [employee._id, leaves, leaveTypes]);

    // All leaves of this employee for history
    const employeeLeaves = useMemo(() => {
        const safeLeaves = Array.isArray(leaves) ? leaves : [];
        return safeLeaves.filter(l => {
            if (!l.employee) return false;
            const leaveEmpId = (typeof l.employee === 'object' && l.employee !== null) ? (l.employee._id || l.employee.id) : l.employee;
            return String(leaveEmpId) === String(employee._id);
        });
    }, [employee._id, leaves]);

    // Calculate career variables
    const latestApprovedInc = useMemo(() => {
        return increments.find(i => i.status === 'Approved') || null;
    }, [increments]);

    const latestReview = useMemo(() => {
        return reviews[0] || null;
    }, [reviews]);

    // ── Predefined Profile Summary Cards ──────────────────────────────────
    const predefinedProfileCards = useMemo(() => [
        {
            id: 'salary',
            label: 'Current Salary',
            value: formatSalary(employee.salary),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50/50',
            icon: DollarSign
        },
        {
            id: 'lastIncrement',
            label: 'Last Increment',
            value: latestApprovedInc ? `+${formatSalary(latestApprovedInc.incrementAmount)}` : '-',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50/50',
            icon: TrendingUp
        },
        {
            id: 'lastIncDate',
            label: 'Last Inc. Date',
            value: latestApprovedInc ? formatDate(latestApprovedInc.incrementDate) : 'No raise',
            color: 'text-violet-600',
            bg: 'bg-violet-50/50',
            icon: Calendar
        },
        {
            id: 'currentRating',
            label: 'Current Rating',
            value: latestReview ? `${latestReview.overallRating}/5` : 'No reviews',
            subtext: latestReview ? RATING_LABELS[latestReview.overallRating] : '',
            color: 'text-amber-600',
            bg: 'bg-amber-50/50',
            icon: Star
        }
    ], [employee.salary, latestApprovedInc, latestReview]);

    const [hiddenProfileCards, setHiddenProfileCards] = useState([]);
    const [showAddProfileDropdown, setShowAddProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowAddProfileDropdown(false);
            }
        };
        if (showAddProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAddProfileDropdown]);

    useEffect(() => {
        if (!employee?._id) return;
        try {
            const stored = localStorage.getItem(`hidden_profile_${employee._id}`);
            if (stored !== null) {
                setHiddenProfileCards(JSON.parse(stored));
                return;
            }
        } catch (e) {}
        setHiddenProfileCards(employee.hiddenProfileCards || []);
    }, [employee?._id, employee?.hiddenProfileCards]);

    const visibleProfileCards = useMemo(() => {
        return predefinedProfileCards.filter(c => !hiddenProfileCards.includes(c.id));
    }, [predefinedProfileCards, hiddenProfileCards]);

    const removedProfileCards = useMemo(() => {
        return predefinedProfileCards.filter(c => hiddenProfileCards.includes(c.id));
    }, [predefinedProfileCards, hiddenProfileCards]);

    const handleHideProfileCard = async (id) => {
        const nextHidden = Array.from(new Set([...hiddenProfileCards, id]));
        setHiddenProfileCards(nextHidden);
        try {
            localStorage.setItem(`hidden_profile_${employee._id}`, JSON.stringify(nextHidden));
            await apiClient.put(`/auth/users/${employee._id}/card-visibility`, {
                hiddenProfileCards: nextHidden
            });
        } catch (e) {
            console.error('Error updating card visibility:', e);
        }
    };

    const handleRestoreProfileCard = async (id) => {
        const nextHidden = hiddenProfileCards.filter(cId => cId !== id);
        setHiddenProfileCards(nextHidden);
        if (employee) employee.hiddenProfileCards = nextHidden;
        try {
            localStorage.setItem(`hidden_profile_${employee._id}`, JSON.stringify(nextHidden));
            await apiClient.put(`/auth/users/${employee._id}/card-visibility`, {
                hiddenProfileCards: nextHidden
            });
        } catch (e) {
            console.error('Error updating card visibility:', e);
        }
    };

    if (!employee || !employee._id) {
        return (
            <div className="p-16 text-center text-slate-400">
                No employee selected.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto pb-12 px-4"
        >
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-end gap-4 mb-6">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onEdit(employee)}
                        className="btn-secondary font-bold text-xs uppercase tracking-wider"
                    >
                        <Edit3 size={14} /> Edit Profile
                    </button>
                    <button
                        disabled={currentUser?.role === 'hr' && (employee.role === 'hr' || employee.role === 'admin') && currentUser?.role !== 'admin'}
                        onClick={() => onDelete(employee._id)}
                        className={`font-bold text-xs uppercase tracking-wider ${
                            currentUser?.role === 'hr' && (employee.role === 'hr' || employee.role === 'admin') && currentUser?.role !== 'admin'
                                ? 'btn-secondary opacity-50 cursor-not-allowed'
                                : 'btn-danger'
                        }`}
                    >
                        <Trash2 size={14} /> Mark as Inactive
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Redesigned Profile Hero Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card !p-0 overflow-hidden">
                        {/* Profile Cover Banner */}
                        <div className="h-28 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 relative">
                            <div className="absolute inset-0 bg-black/10" />
                            {/* Role Badge */}
                            <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                                {employee.role === 'hr' ? 'HR Admin' : 'Staff'}
                            </span>
                        </div>

                        <div className="px-6 pb-6 -mt-14 flex flex-col items-center">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl mb-4 relative z-10">
                                <div className="w-full h-full rounded-2xl bg-indigo-50 border border-slate-100 overflow-hidden flex items-center justify-center font-bold text-indigo-600 text-2xl uppercase shadow-inner">
                                    {employee.photo ? (
                                        <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
                                    ) : (
                                        employee.name ? employee.name.charAt(0) : <User size={32} />
                                    )}
                                </div>
                            </div>

                            {/* Name & ID */}
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight text-center leading-snug">{employee.name}</h2>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider font-mono mt-1 select-all cursor-pointer hover:text-indigo-600 transition-colors" title="Click to copy employee ID">
                                ID: {employee._id}
                            </p>

                            {/* Divider */}
                            <div className="w-full h-px bg-slate-100 my-5" />

                            {/* Primary Details Grid */}
                            <div className="w-full space-y-3.5">
                                <ProfileDetailItem label="Department" value={employee.department || 'Unassigned'} icon={Building2} />
                                <ProfileDetailItem label="Designation" value={employee.role === 'hr' ? 'HR Specialist' : 'Software Engineer'} icon={Briefcase} />
                                <ProfileDetailItem label="Employment Status" value={employee.status || 'Active'} icon={UserCheck} uppercase />
                                <ProfileDetailItem label="Joining Status" value={employee.joiningStatus || 'Fresh Join'} icon={Calendar} />
                                <ProfileDetailItem label="Promotion Rank" value={employee.promotionRank || 'Junior'} icon={RankIcon} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Contact Block */}
                    <div className="card space-y-4">
                        <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Mail size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Email Address</p>
                                    <p className="text-sm font-semibold text-slate-700 truncate">{employee.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Phone Number</p>
                                    <p className="text-sm font-semibold text-slate-700">{employee.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Career Growth Ladder Card */}
                    <div className="card space-y-4">
                        <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                            <TrendingUp size={14} className="text-indigo-500" /> Career Growth Ladder
                        </h3>
                        <div className="relative pl-1">
                            {/* Vertical Line Connector */}
                            <div className="absolute top-2 bottom-2 left-3 w-0.5 bg-slate-100" />
                            {/* Vertical Progress Line Indicator */}
                            <div
                                className="absolute top-2 left-3 w-0.5 bg-indigo-500 transition-all duration-500"
                                style={{
                                    height: `${(VALID_RANKS.indexOf(employee.promotionRank || 'Junior') / (VALID_RANKS.length - 1)) * 100}%`,
                                    maxHeight: 'calc(100% - 16px)'
                                }}
                            />

                            {/* Steps list */}
                            <div className="space-y-4 relative">
                                {VALID_RANKS.map((rank, idx) => {
                                    const currentIdx = VALID_RANKS.indexOf(employee.promotionRank || 'Junior');
                                    const isPassed = idx < currentIdx;
                                    const isActive = idx === currentIdx;

                                    return (
                                        <div key={rank} className="flex items-center gap-4">
                                            {/* Circle */}
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 shrink-0 ${isActive
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-110'
                                                        : isPassed
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'bg-white border-slate-200 text-slate-300'
                                                    }`}
                                            >
                                                {isPassed ? (
                                                    <CheckCircle2 size={12} className="stroke-[3]" />
                                                ) : (
                                                    <span className="text-[9px] font-black">{idx + 1}</span>
                                                )}
                                            </div>

                                            {/* Text details */}
                                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                <p className={`text-xs font-black uppercase tracking-wider ${isActive
                                                        ? 'text-indigo-600'
                                                        : isPassed
                                                            ? 'text-slate-600'
                                                            : 'text-slate-300'
                                                    }`}>
                                                    {rank}
                                                </p>
                                                {isActive && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md animate-pulse">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Tabs Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation Switcher */}
                    <div className="flex gap-2 bg-slate-100/80 border border-slate-200/50 p-1.5 rounded-2xl">
                        {[
                            { key: 'profile', label: 'Profile & Salary', icon: User },
                            { key: 'increment-review', label: 'Increment & Review', icon: TrendingUp }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveDetailTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${activeDetailTab === tab.key
                                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeDetailTab === 'increment-review' ? (
                        <IncrementReviewPage employee={employee} />
                    ) : (
                        <>
                            {/* ── PROFILE & SALARY SUMMARY ── */}
                            <div className="card relative overflow-visible">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 blur-2xl rounded-full" />
                                <div className="flex items-center justify-between mb-5 border-b border-indigo-50 pb-3">
                                    <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                                        <DollarSign size={16} /> Salary & Review Summary
                                    </h3>
                                    {removedProfileCards.length > 0 && (
                                        <div className="relative" ref={profileDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddProfileDropdown(prev => !prev)}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-200 hover:shadow-indigo-300"
                                            >
                                                <Plus size={14} /> Add Card
                                                <span className="ml-0.5 px-1.5 py-0.2 bg-white/25 rounded-md text-[10px] font-extrabold">
                                                    {removedProfileCards.length}
                                                </span>
                                            </button>

                                            <AnimatePresence>
                                                {showAddProfileDropdown && (
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
                                                                {removedProfileCards.length} hidden
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                                                            {removedProfileCards.map(card => {
                                                                const IconComp = card.icon || DollarSign;
                                                                return (
                                                                    <button
                                                                        key={card.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleRestoreProfileCard(card.id);
                                                                            setShowAddProfileDropdown(false);
                                                                        }}
                                                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-all cursor-pointer group border border-transparent hover:border-indigo-100/80"
                                                                    >
                                                                        <span className="flex items-center gap-2.5">
                                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                                                                                <IconComp size={14} />
                                                                            </div>
                                                                            <span className="truncate">{card.label}</span>
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

                                {visibleProfileCards.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center gap-2">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                                            <LayoutGrid size={18} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">All summary cards are currently removed</p>
                                        <p className="text-[11px] text-slate-400 font-medium max-w-xs">
                                            Click the <span className="text-indigo-600 font-bold">+ Add Card</span> button above to restore any metrics.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                        {visibleProfileCards.map(card => {
                                            const IconComp = card.icon || DollarSign;
                                            return (
                                                <div
                                                    key={card.id}
                                                    className={`group relative ${card.bg} p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border border-slate-100/50 min-h-[76px] transition-all hover:shadow-xs`}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleHideProfileCard(card.id);
                                                        }}
                                                        title="Remove card from view"
                                                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-100/90 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-slate-200/50 z-10"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <IconComp size={16} className={card.color} />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{card.label}</span>
                                                    <span className={`text-[11px] font-extrabold ${card.color} leading-tight`}>{card.value}</span>
                                                    {card.subtext && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">{card.subtext}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Net Salary Monthly Pay slip Calc Card */}
                            <motion.div
                                key={`${employee._id}-${salaryData.totalLeaveDays}`}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="card relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-56 h-56 bg-slate-50/50 blur-3xl -mr-18 -mt-18 rounded-full" />

                                {!salaryData.hasSalary && (
                                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6">
                                        <AlertCircle size={28} className="text-amber-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Salary Not Configured</h4>
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                                <Wallet size={18} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Monthly Net Salary Estimation</h3>
                                                <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">
                                                    For {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/50 border border-indigo-100 px-3 py-1 rounded-xl">
                                                Base: {formatSalary(salaryData.baseSalary)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Leaves Taken</p>
                                            <p className="text-base font-black text-slate-800">{salaryData.totalLeaveDays} Days</p>
                                        </div>
                                        <div className="bg-rose-50/40 p-3 rounded-2xl border border-rose-100">
                                            <p className="text-rose-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Leave Deduction</p>
                                            <p className="text-base font-black text-rose-600">-{formatSalary(salaryData.leaveDeduction)}</p>
                                        </div>
                                        <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                                            <p className="text-amber-600 text-[9px] font-bold uppercase tracking-wider mb-0.5">Loan Installment</p>
                                            <p className="text-base font-black text-amber-700">-{formatSalary(salaryData.loanDeduction)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-wider mb-0.5">Net Payable Amount</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{formatSalary(salaryData.netSalary)}</p>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-semibold max-w-[220px] text-right italic leading-normal uppercase tracking-wider">
                                            * Calculated: Base ({formatSalary(salaryData.baseSalary)}) - Total Deductions ({formatSalary(salaryData.totalDeductions)})
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Active Financial Loan Summary Card (Only rendered if employee has active loan) */}
                            {activeLoan && (
                                <div className="card bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden border-none shadow-xl">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 relative z-10">
                                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                            <Coins size={16} /> Active Financial Loan
                                        </h3>
                                        <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                                            {activeLoan.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 relative z-10">
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Approved Loan</p>
                                            <p className="text-sm font-extrabold text-white">{formatSalary(activeLoan.approvedAmount)}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Remaining Balance</p>
                                            <p className="text-sm font-extrabold text-indigo-300">{formatSalary(activeLoan.remainingBalance)}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Monthly Installment</p>
                                            <p className="text-sm font-extrabold text-emerald-400">{formatSalary(activeLoan.monthlyDeduction)} / mo</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Start Month</p>
                                            <p className="text-sm font-extrabold text-amber-300">{activeLoan.repaymentStartMonth || '-'}</p>
                                        </div>
                                    </div>

                                    {/* Repayment Progress Bar */}
                                    <div className="space-y-1.5 relative z-10">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-slate-400">Repaid: {formatSalary(activeLoan.paidAmount)}</span>
                                            <span className="text-indigo-300">{Math.round(((activeLoan.paidAmount || 0) / (activeLoan.approvedAmount || 1)) * 100)}% Repaid</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
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

                            {/* Employment Details Card */}
                            <div className="card">
                                <h3 className="text-xs font-bold text-indigo-600 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                                    <Briefcase size={16} /> Employment Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                    <InfoItem icon={Building2} label="Department" value={employee.department} />
                                    <InfoItem icon={UserCheck} label="Reporting Officer" value={employee.reportingTo || 'Directly to HR'} />
                                    <InfoItem icon={Shield} label="Access Role" value={employee.role} capitalize />
                                    <InfoItem icon={Briefcase} label="Employment Type" value={employee.status} capitalize />
                                    <InfoItem icon={Calendar} label="Joining Date" value={formatDate(employee.createdAt)} />
                                    <InfoItem icon={DollarSign} label="Monthly Salary" value={formatSalary(employee.salary)} />
                                </div>
                            </div>

                            {/* Leave Balances Summary */}
                            <div className="card">
                                <h3 className="text-xs font-bold text-indigo-600 mb-5 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                                    <Calendar size={16} /> Leave Balance Summary
                                </h3>
                                {leaveBalances.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4">No active leave type configurations found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        {leaveBalances.map(b => (
                                            <div key={b.leaveType._id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-indigo-100 hover:shadow-xs transition-all duration-200">
                                                <div>
                                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                        {b.leaveType.name}
                                                    </span>
                                                    <p className="text-xl font-black text-slate-800 mt-2.5">{b.remaining} Days</p>
                                                </div>
                                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                                    <span>Used: {b.used}d</span>
                                                    <span>Allocated: {b.allocated}d</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Leave History */}
                            <div className="card space-y-6">
                                <h3 className="text-xs font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                                    <ClipboardList size={16} /> Recent Leave Request History
                                </h3>
                                {employeeLeaves.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-6">No leave requests found for this employee.</p>
                                ) : (
                                    <div className="table-container shadow-none border-none">
                                        <table className="table-base">
                                            <thead>
                                                <tr className="table-header">
                                                    <th>Type</th>
                                                    <th>Duration</th>
                                                    <th className="text-center">Days</th>
                                                    <th className="text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="table-body">
                                                {employeeLeaves.slice(0, 5).map(l => (
                                                    <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3">
                                                            <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2.5 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
                                                                {l.leaveType?.name || 'Annual Leave'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-slate-600 font-medium">{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                                                        <td className="py-3 text-center">
                                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">
                                                                {calculateDays(l.startDate, l.endDate)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border ${l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                    l.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                                                }`}>
                                                                {l.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

        </motion.div>
    );
};

const ProfileDetailItem = ({ label, value, icon: Icon, uppercase }) => (
    <div className="flex items-center gap-3 w-full bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <Icon size={14} />
        </div>
        <div className="overflow-hidden">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
            <p className={`text-xs font-bold text-slate-700 truncate ${uppercase ? 'uppercase' : 'capitalize'}`}>
                {value || '-'}
            </p>
        </div>
    </div>
);

const InfoItem = ({ icon: Icon, label, value, capitalize }) => (
    <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 border border-slate-100 shrink-0">
            <Icon size={16} />
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-slate-700 font-bold text-xs ${capitalize ? 'capitalize' : ''}`}>{value || '-'}</p>
        </div>
    </div>
);

export default EmployeeDetailsPage;
