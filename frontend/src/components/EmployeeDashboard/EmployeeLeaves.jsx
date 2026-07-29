import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Send, ClipboardList, RefreshCw, AlertTriangle } from 'lucide-react';
import LeaveDetailModal from '../LeaveDetailModal';

const EmployeeLeaves = ({ user, leaveForm, setLeaveForm, handleApplyLeave, leaves, statusFilter, setStatusFilter, leaveBalances = [], leaveTypes = [], onRefresh }) => {
    const [selectedLeave, setSelectedLeave] = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const calculateDays = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.abs(e - s);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const truncateReason = (reason) => {
        if (!reason) return '';
        return reason.length > 20 ? reason.substring(0, 20) + '...' : reason;
    };

    // Selected leave balance lookup & excess/deduction calculation
    const getLeaveTypeId = (leaveType) => {
        if (!leaveType) return '';
        if (typeof leaveType === 'object') return String(leaveType._id || leaveType.id || '');
        return String(leaveType);
    };

    const selectedBalance = leaveBalances.find(b => getLeaveTypeId(b.leaveType) === String(leaveForm.leaveTypeId));

    const deductionPreview = React.useMemo(() => {
        if (!leaveForm.startDate || !leaveForm.endDate || !selectedBalance) return null;
        const s = new Date(leaveForm.startDate);
        const e = new Date(leaveForm.endDate);
        if (s > e) return null;

        const duration = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
        const remaining = selectedBalance.remaining || 0;
        const excessDays = Math.max(0, duration - remaining);

        const baseSalary = Number(user?.salary) || 0;
        const dailyRate = baseSalary > 0 ? Math.round(baseSalary / 30) : 0;
        const estimatedDeduction = excessDays * dailyRate;

        return {
            duration,
            remaining,
            excessDays,
            dailyRate,
            estimatedDeduction
        };
    }, [leaveForm.startDate, leaveForm.endDate, selectedBalance, user?.salary]);

    return (
        <>
            <motion.div 
                key="leaves"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
            >
                {/* Leave Balances Grid */}
                {leaveBalances.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                        {leaveBalances.map(b => {
                            const usedPercent = b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0;
                            return (
                                <div key={b.leaveType?._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                                            {b.leaveType?.name}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                            {b.used} {b.used === 1 ? 'Day Used' : 'Days Used'}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-2xl font-black text-slate-800">{b.remaining} <span className="text-sm font-semibold text-slate-500">Days Left</span></p>
                                            <span className="text-xs text-slate-400 font-medium">Total: {b.allocated} Days</span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    usedPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                                                }`}
                                                style={{ width: `${usedPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {/* Apply Leave Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                            <h3 className="text-lg font-bold text-slate-800 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                                <Calendar size={20} className="text-indigo-600" />
                                <span>Request Leave</span>
                            </h3>
                            <form onSubmit={handleApplyLeave} className="flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">Leave Type</label>
                                        <select 
                                            className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700" 
                                            value={leaveForm.leaveTypeId || ''} 
                                            onChange={e => setLeaveForm({...leaveForm, leaveTypeId: e.target.value})} 
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            {leaveTypes.map(t => {
                                                const typeId = String(t._id || t.id || '');
                                                const balance = leaveBalances.find(b => getLeaveTypeId(b.leaveType) === typeId);
                                                const remaining = balance !== undefined ? balance.remaining : t.quota;
                                                return (
                                                    <option key={typeId} value={typeId}>
                                                        {t.name} ({remaining} {remaining === 1 ? 'day left' : 'days left'})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">Start Date</label>
                                            <input 
                                                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700" 
                                                type="date" 
                                                value={leaveForm.startDate} 
                                                onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">End Date</label>
                                            <input 
                                                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700" 
                                                type="date" 
                                                value={leaveForm.endDate} 
                                                onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">Reason</label>
                                        <textarea 
                                            className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 resize-none" 
                                            placeholder="Tell us why..." 
                                            value={leaveForm.reason} 
                                            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} 
                                            required 
                                            rows={3}
                                        />
                                    </div>

                                    {/* Deduction / Excess Quota Warning Banner */}
                                    {deductionPreview && deductionPreview.excessDays > 0 && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                                            <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                                                <span>Quota Exceeded ({deductionPreview.excessDays} Unpaid {deductionPreview.excessDays === 1 ? 'Day' : 'Days'})</span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-amber-700">
                                                Remaining balance: <strong>{deductionPreview.remaining} {deductionPreview.remaining === 1 ? 'day' : 'days'}</strong>. {deductionPreview.excessDays} {deductionPreview.excessDays === 1 ? 'day' : 'days'} will be processed as <strong>Unpaid Leave</strong>.
                                            </p>
                                            {deductionPreview.dailyRate > 0 && (
                                                <div className="pt-1.5 mt-1 border-t border-amber-200/60 font-bold flex justify-between items-center text-slate-800">
                                                    <span>Est. Salary Deduction:</span>
                                                    <span className="text-rose-600 font-black">
                                                        -₨ {deductionPreview.estimatedDeduction.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-sm mt-auto">
                                    <Send size={18} /> Submit Application
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Leave History Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={20} className="text-indigo-600" />
                                    <h3 className="text-lg font-bold text-slate-800">My Leave History</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                                            <button 
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                    {onRefresh && (
                                        <button
                                            onClick={onRefresh}
                                            title="Sync latest status from HR"
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                                        >
                                            <RefreshCw size={12} />
                                            Sync
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto flex flex-col justify-between">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4 text-center">Days</th>
                                            <th className="px-6 py-4">Reason</th>
                                            <th className="px-6 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {leaves.map(leave => (
                                            <tr 
                                                key={leave._id} 
                                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                onClick={() => setSelectedLeave(leave)}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-800 text-xs bg-indigo-50/60 border border-indigo-100/80 px-2.5 py-1 rounded-lg inline-block">
                                                        {leave.leaveType?.name || 'Annual Leave'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-700 font-medium text-xs whitespace-nowrap">
                                                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded-md inline-block">
                                                        {calculateDays(leave.startDate, leave.endDate)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-600 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 group-hover:border-indigo-200 transition-colors block truncate max-w-[180px]">
                                                        {truncateReason(leave.reason)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`
                                                        px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block
                                                        ${leave.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                                                        ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                                                        ${leave.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : ''}
                                                    `}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {leaves.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                        <ClipboardList size={36} className="mb-2 opacity-30" />
                                        <p className="text-xs font-semibold">No leave requests found {statusFilter !== 'all' && `with status "${statusFilter}"`}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <LeaveDetailModal 
                leave={selectedLeave} 
                onClose={() => setSelectedLeave(null)} 
            />
        </>
    );
};

export default EmployeeLeaves;
