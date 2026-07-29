import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Mail, Shield, Briefcase, Building2, UserCheck,
    Calendar, DollarSign, User, Phone, Edit3, Wallet, AlertCircle,
    Trash2, ClipboardList, Award, TrendingUp, Sparkles, CheckCircle2,
    Layers, Zap, Clock
} from 'lucide-react';

const RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];

const EmployeeDetailsPage = ({ employee, leaves = [], leaveTypes = [], onBack, onEdit, onDelete }) => {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'leaves'

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
            return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) { return '-'; }
    };

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
            const days = calculateDays(l.startDate, l.endDate);
            totalLeaveDays += days;
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

        const employeeApprovedLeaves = safeLeaves.filter(l => {
            if (!l.startDate || !l.employee) return false;
            const leaveEmpId = (typeof l.employee === 'object' && l.employee !== null) ? (l.employee._id || l.employee.id) : l.employee;
            const isEmployee = String(leaveEmpId) === String(employee._id);
            const leaveDate = new Date(l.startDate);
            return isEmployee && l.status === 'approved' && leaveDate.getFullYear() === currentYear;
        });

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
            const remaining = Math.max(0, t.quota - used);
            const percentage = t.quota > 0 ? Math.round((used / t.quota) * 100) : 0;
            return {
                leaveType: t,
                allocated: t.quota,
                used,
                remaining,
                percentage
            };
        });
    }, [employee._id, leaves, leaveTypes]);

    // Employee leave history
    const employeeLeaves = useMemo(() => {
        const safeLeaves = Array.isArray(leaves) ? leaves : [];
        return safeLeaves.filter(l => {
            if (!l.employee) return false;
            const leaveEmpId = (typeof l.employee === 'object' && l.employee !== null) ? (l.employee._id || l.employee.id) : l.employee;
            return String(leaveEmpId) === String(employee._id);
        });
    }, [employee._id, leaves]);

    const currentRank = employee.promotionRank || 'Junior';
    const joiningStatus = employee.joiningStatus || 'Fresh Join';
    const currentRankIdx = RANKS.indexOf(currentRank) !== -1 ? RANKS.indexOf(currentRank) : 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto pb-12 space-y-6"
        >
            {/* Top Header Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm shadow-xs group cursor-pointer"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-indigo-600" />
                    <span>Back to Directory</span>
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onEdit(employee)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all font-bold text-sm shadow-md shadow-indigo-200 cursor-pointer"
                    >
                        <Edit3 size={16} /> Edit Profile
                    </button>
                    <button
                        onClick={() => onDelete(employee._id)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm shadow-xs cursor-pointer"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Hero Profile & Identity Card (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Unified Profile Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/50 overflow-hidden relative">
                        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:12px_12px]" />
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/30">
                                {employee.role}
                            </div>
                        </div>

                        <div className="px-6 pb-6 -mt-16 flex flex-col items-center text-center relative z-10">
                            {/* Avatar */}
                            <div className="relative mb-3">
                                <div className="w-28 h-28 rounded-3xl bg-white p-1.5 shadow-xl ring-4 ring-white">
                                    <div className="w-full h-full rounded-2xl bg-indigo-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                                        {employee.photo ? (
                                            <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-indigo-300" />
                                        )}
                                    </div>
                                </div>
                                {employee.isTeamLead && (
                                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white" title="Team Lead">
                                        <Sparkles size={14} />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-xl font-black text-slate-800 leading-tight">{employee.name}</h2>
                            <p className="text-slate-400 font-bold text-xs flex items-center gap-1.5 mt-1 capitalize">
                                {employee.department || 'Development'}
                            </p>

                            {/* Current Rank Badge */}
                            <div className="mt-3 flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-2 rounded-2xl">
                                <TrendingUp size={16} className="text-indigo-600" />
                                <div className="text-left">
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Promotion Rank</p>
                                    <p className="text-xs font-black text-indigo-900">{currentRank}</p>
                                </div>
                            </div>

                            {/* KPI Metrics */}
                            <div className="w-full grid grid-cols-3 gap-2 mt-5 border-t border-slate-100 pt-4">
                                <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                                    <Building2 size={14} className="mx-auto text-indigo-500 mb-1" />
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Dept</span>
                                    <span className="text-[10px] font-bold text-slate-700 capitalize truncate block">{employee.department || 'Dev'}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                                    <Briefcase size={14} className="mx-auto text-emerald-500 mb-1" />
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Status</span>
                                    <span className="text-[10px] font-bold text-slate-700 capitalize truncate block">{employee.status || 'Full Time'}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                                    <Award size={14} className="mx-auto text-amber-500 mb-1" />
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Hired As</span>
                                    <span className="text-[10px] font-bold text-slate-700 capitalize truncate block">{joiningStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Career Growth Ladder Timeline Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                                    <TrendingUp size={16} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Career Growth Ladder</h3>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full capitalize">
                                Joined as {joiningStatus}
                            </span>
                        </div>

                        {/* Rank Timeline */}
                        <div className="space-y-2 pt-1">
                            {RANKS.map((rank, idx) => {
                                const isCurrent = rank === currentRank;
                                const isPassed = idx < currentRankIdx;
                                return (
                                    <div
                                        key={rank}
                                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                                            isCurrent
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold scale-[1.02]'
                                                : isPassed
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold'
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                                isCurrent ? 'bg-white text-indigo-600 font-black' : isPassed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {isPassed ? <CheckCircle2 size={12} /> : idx + 1}
                                            </div>
                                            <span className="text-xs">{rank}</span>
                                        </div>

                                        {isCurrent && (
                                            <span className="text-[9px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md text-white font-bold">
                                                Current Level
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Contact Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Mail size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-xs font-semibold text-slate-700 truncate">{employee.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-xs font-semibold text-slate-700">{employee.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info Tabs & Views (8 cols) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                        >
                            <Wallet size={15} /> Overview & Compensation
                        </button>
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeTab === 'leaves'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                        >
                            <Calendar size={15} /> Leave Balances & History
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' ? (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Salary Calculation Card */}
                                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-50/50 blur-3xl -mr-18 -mt-18 rounded-full" />

                                    {!salaryData.hasSalary && (
                                        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                                            <AlertCircle size={32} className="text-amber-500 mb-2" />
                                            <h4 className="font-bold text-base text-slate-800">Salary Not Set</h4>
                                            <p className="text-xs text-slate-400 mt-1">HR has not defined a salary for this employee profile yet.</p>
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                                    <Wallet size={22} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-800">Monthly Net Salary Calculation</h3>
                                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                                        {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                                                    Base: {formatSalary(salaryData.baseSalary)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Approved Leaves</p>
                                                <p className="text-2xl font-black text-slate-800">{salaryData.totalLeaveDays} Days</p>
                                            </div>
                                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-right">
                                                <p className="text-rose-400 text-[9px] font-bold uppercase tracking-widest mb-1">Leave Deductions</p>
                                                <p className="text-2xl font-black text-rose-500">-{formatSalary(salaryData.deduction)}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 flex items-end justify-between">
                                            <div>
                                                <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-1">Payable Net Amount</p>
                                                <p className="text-3xl font-black tracking-tight text-slate-900">{formatSalary(salaryData.netSalary)}</p>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold max-w-[200px] text-right italic leading-relaxed uppercase tracking-tighter">
                                                * Standard payroll equation: Base Salary / 30 × Leave Days
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comprehensive Employment Details */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                                    <div className="p-8">
                                        <h3 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-4">
                                            <Briefcase size={18} /> Detailed Employment Profile
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                            <InfoItem icon={Building2} label="Department" value={employee.department} />
                                            <InfoItem icon={UserCheck} label="Reporting Officer" value={employee.reportingTo || 'Directly to HR'} />
                                            <InfoItem icon={Shield} label="Account Role" value={employee.role} capitalize />
                                            <InfoItem icon={Briefcase} label="Employment Type" value={employee.status} capitalize />
                                            <InfoItem icon={Award} label="Joining Hiring Status" value={joiningStatus} />
                                            <InfoItem icon={TrendingUp} label="Current Promotion Rank" value={currentRank} highlight />
                                            <InfoItem icon={Calendar} label="Official Joining Date" value={formatDate(employee.createdAt)} />
                                            <InfoItem icon={DollarSign} label="Annual/Monthly Salary" value={formatSalary(employee.salary)} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="leaves"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Leave Balances Progress Summary */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-8">
                                    <h3 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-4">
                                        <Calendar size={18} /> Annual Leave Allocation & Meter
                                    </h3>
                                    {leaveBalances.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-6">No active leave type configurations found.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {leaveBalances.map(b => (
                                                <div key={b.leaveType._id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                                                            {b.leaveType.name}
                                                        </span>
                                                        <span className="text-xs font-black text-indigo-600">
                                                            {b.remaining} Days Left
                                                        </span>
                                                    </div>

                                                    {/* Progress Meter */}
                                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${
                                                                b.percentage >= 80 ? 'bg-rose-500' : b.percentage >= 50 ? 'bg-amber-500' : 'bg-indigo-600'
                                                            }`}
                                                            style={{ width: `${Math.min(100, b.percentage)}%` }}
                                                        />
                                                    </div>

                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        <span>Used: {b.used} Days</span>
                                                        <span>Total Quota: {b.allocated} Days</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Leave Request History */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-8">
                                    <h3 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-4">
                                        <ClipboardList size={18} /> Leave Request History
                                    </h3>
                                    {employeeLeaves.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-6">No leave requests logged for this employee.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                                                        <th className="py-3">Type</th>
                                                        <th className="py-3">Dates</th>
                                                        <th className="py-3 text-center">Days</th>
                                                        <th className="py-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {employeeLeaves.map(l => (
                                                        <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3.5 pr-2">
                                                                <span className="font-bold text-slate-800 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-lg text-[11px]">
                                                                    {l.leaveType?.name || 'Annual Leave'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 text-slate-600 font-semibold">{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                                                            <td className="py-3.5 text-center">
                                                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                                                                    {calculateDays(l.startDate, l.endDate)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 text-right">
                                                                <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                                                                    l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                    l.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

const InfoItem = ({ icon: Icon, label, value, capitalize, highlight }) => (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            highlight ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-600 border border-slate-100'
        }`}>
            <Icon size={16} />
        </div>
        <div className="overflow-hidden">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-xs font-bold ${highlight ? 'text-indigo-900 font-black' : 'text-slate-700'} ${capitalize ? 'capitalize' : ''} truncate`}>
                {value || '-'}
            </p>
        </div>
    </div>
);

export default EmployeeDetailsPage;
