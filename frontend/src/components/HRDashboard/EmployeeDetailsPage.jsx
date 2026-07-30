import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Mail, Shield, Briefcase, Building2, UserCheck, 
    Calendar, DollarSign, User, Phone, Edit3, Wallet, 
    AlertCircle, Trash2, ClipboardList, TrendingUp, Star, Award, Award as RankIcon, CheckCircle2, Clock
} from 'lucide-react';
import IncrementReviewPage from './IncrementReviewPage';
import apiClient from '../../api/axiosClient';

const RATING_LABELS = {
    1: 'Needs Improvement',
    2: 'Average',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
};

const VALID_RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];

const EmployeeDetailsPage = ({ employee, leaves = [], leaveTypes = [], onBack, onEdit, onDelete }) => {
    const [activeDetailTab, setActiveDetailTab] = useState('profile');
    const [increments, setIncrements] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

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

    // Safety check for employee
    if (!employee) return (
        <div className="p-16 text-center text-slate-400">
            No employee selected.
        </div>
    );

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

        const deduction = Math.round(oneDaySalary * totalLeaveDays);
        const netSalary = Math.max(0, baseSalary - deduction);

        return {
            netSalary,
            totalLeaveDays,
            deduction,
            baseSalary,
            hasSalary: baseSalary > 0
        };
    }, [employee._id, employee.salary, leaves]);

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

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto pb-12 px-4"
        >
            {/* Top Navigation & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <button 
                    onClick={onBack}
                    className="btn-secondary font-bold text-xs uppercase tracking-wider"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-indigo-600" />
                    <span>Back to Employees</span>
                </button>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onEdit(employee)}
                        className="btn-secondary font-bold text-xs uppercase tracking-wider"
                    >
                        <Edit3 size={14}/> Edit Profile
                    </button>
                    <button 
                        onClick={() => onDelete(employee._id)}
                        className="btn-danger font-bold text-xs uppercase tracking-wider"
                    >
                        <Trash2 size={14}/> Mark as Inactive
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
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 shrink-0 ${
                                                    isActive 
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
                                                <p className={`text-xs font-black uppercase tracking-wider ${
                                                    isActive 
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
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                    activeDetailTab === tab.key
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
                        {/* ── REDESIGNED SALARY SUMMARY CARD ── */}
                        <div className="card relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 blur-2xl rounded-full" />
                            <h3 className="text-xs font-bold text-indigo-600 mb-5 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-3">
                                <DollarSign size={16} /> Salary & Review Summary
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                <SummaryKPI label="Current Salary" value={formatSalary(employee.salary)} color="text-indigo-600" bg="bg-indigo-50/50" />
                                <SummaryKPI label="Last Increment" value={latestApprovedInc ? `+${formatSalary(latestApprovedInc.incrementAmount)}` : '-'} color="text-emerald-600" bg="bg-emerald-50/50" />
                                <SummaryKPI label="Last Inc. Date" value={latestApprovedInc ? formatDate(latestApprovedInc.incrementDate) : 'No raise'} color="text-violet-600" bg="bg-violet-50/50" />
                                <SummaryKPI 
                                    label="Current Rating" 
                                    value={latestReview ? `${latestReview.overallRating}/5` : 'No reviews'} 
                                    subtext={latestReview ? RATING_LABELS[latestReview.overallRating] : ''}
                                    color="text-amber-600" 
                                    bg="bg-amber-50/50" 
                                />
                            </div>
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

                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Leaves Taken</p>
                                        <p className="text-lg font-black text-slate-800">{salaryData.totalLeaveDays} Days</p>
                                    </div>
                                    <div className="bg-rose-50/40 p-3.5 rounded-2xl border border-rose-100 text-right">
                                        <p className="text-rose-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Deduction</p>
                                        <p className="text-lg font-black text-rose-600">-{formatSalary(salaryData.deduction)}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-wider mb-0.5">Payable Amount</p>
                                        <p className="text-2xl font-black text-slate-900 leading-none">{formatSalary(salaryData.netSalary)}</p>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-semibold max-w-[200px] text-right italic leading-normal uppercase tracking-wider">
                                        * Calculated: Base / 30 × {salaryData.totalLeaveDays} approved leaves
                                    </div>
                                </div>
                            </div>
                        </motion.div>

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
                                                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border ${
                                                                l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
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

const SummaryKPI = ({ label, value, subtext, color, bg }) => (
    <div className={`${bg} p-3 rounded-2xl border border-slate-100/50 flex flex-col items-center justify-center text-center gap-1 min-h-[72px]`}>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</span>
        <span className={`text-xs font-black ${color} leading-none tracking-tight`}>{value}</span>
        {subtext && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">{subtext}</span>}
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
