import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Shield, Briefcase, Building2, UserCheck, Calendar, DollarSign, User, Phone, Edit3, Wallet, AlertCircle, Trash2 } from 'lucide-react';

const EmployeeDetailsPage = ({ employee, leaves = [], onBack, onEdit, onDelete }) => {
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

    const stats = [
        { label: 'Department', value: employee.department || 'Development', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Status', value: employee.status || 'Full Time', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Role', value: employee.role || 'Employee', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto pb-10"
        >
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
                >
                    <ArrowLeft size={18} /> Back to Directory
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={() => onEdit(employee)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 rounded-xl transition-all font-bold text-sm shadow-sm"
                    >
                        <Edit3 size={16}/> Edit Profile
                    </button>
                    <button 
                        onClick={() => onDelete(employee._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm shadow-sm"
                    >
                        <Trash2 size={16}/> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
                        <div className="px-6 pb-8 -mt-12 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-2xl mb-4">
                                <div className="w-full h-full rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
                                    {employee.photo ? (
                                        <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-slate-300" />
                                    )}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight">{employee.name}</h2>
                            <p className="text-slate-400 font-bold text-[10px] flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                                {employee.department || 'Development'} • {employee.role}
                            </p>
                            
                            <div className="w-full grid grid-cols-3 gap-2 mt-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className={`${stat.bg} p-2.5 rounded-2xl flex flex-col items-center gap-1`}>
                                        <stat.icon size={14} className={stat.color} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</span>
                                        <span className={`text-[10px] font-bold ${stat.color} truncate w-full text-center capitalize`}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Contact */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-widest border-b border-slate-50 pb-3">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Mail size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                    <p className="text-sm text-slate-600 truncate">{employee.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                    <p className="text-sm text-slate-600">{employee.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Salary Calculation Card - MEDIUM WHITE THEME */}
                    <motion.div 
                        key={`${employee._id}-${salaryData.totalLeaveDays}`}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-50/50 blur-3xl -mr-18 -mt-18 rounded-full" />
                        
                        {!salaryData.hasSalary && (
                            <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                                <AlertCircle size={32} className="text-amber-500 mb-2" />
                                <h4 className="font-bold text-base text-slate-800">Salary Not Set</h4>
                            </div>
                        )}

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Wallet size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800">Monthly Net Salary</h3>
                                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                            {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                        Base: {formatSalary(salaryData.baseSalary)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Leaves Taken</p>
                                    <p className="text-xl font-bold text-slate-800">{salaryData.totalLeaveDays} Days</p>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-right">
                                    <p className="text-rose-400 text-[9px] font-bold uppercase tracking-widest mb-1">Deduction</p>
                                    <p className="text-xl font-bold text-rose-500">-{formatSalary(salaryData.deduction)}</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-end justify-between">
                                <div>
                                    <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-1">Payable Amount</p>
                                    <p className="text-3xl font-black tracking-tight text-slate-900">{formatSalary(salaryData.netSalary)}</p>
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold max-w-[180px] text-right italic leading-relaxed uppercase tracking-tighter">
                                    * {formatSalary(salaryData.baseSalary)} / 30 × {salaryData.totalLeaveDays} leaves
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8">
                            <h3 className="text-sm font-bold text-indigo-600 mb-8 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-50 pb-4">
                                <Briefcase size={18} /> Employment Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <InfoItem icon={Building2} label="Department" value={employee.department} />
                                <InfoItem icon={UserCheck} label="Reporting Officer" value={employee.reportingTo || 'Directly to HR'} />
                                <InfoItem icon={Shield} label="Access Role" value={employee.role} capitalize />
                                <InfoItem icon={Briefcase} label="Employment Type" value={employee.status} capitalize />
                                <InfoItem icon={Calendar} label="Joining Date" value={formatDate(employee.createdAt)} />
                                <InfoItem icon={DollarSign} label="Monthly Salary" value={formatSalary(employee.salary)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const InfoItem = ({ icon: Icon, label, value, capitalize }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 border border-slate-100">
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-slate-700 font-bold text-sm ${capitalize ? 'capitalize' : ''}`}>{value || '-'}</p>
        </div>
    </div>
);

export default EmployeeDetailsPage;
