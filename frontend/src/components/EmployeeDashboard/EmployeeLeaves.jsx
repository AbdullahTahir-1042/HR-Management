import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Send, ClipboardList } from 'lucide-react';
import LeaveDetailModal from '../LeaveDetailModal';

const EmployeeLeaves = ({ leaveForm, setLeaveForm, handleApplyLeave, leaves, statusFilter, setStatusFilter, leaveBalances = [], leaveTypes = [] }) => {
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
                        {leaveBalances.map(b => (
                            <div key={b.leaveType?._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                                    {b.leaveType?.name}
                                </span>
                                <div className="flex justify-between items-end mt-4">
                                    <div>
                                        <p className="text-xl font-bold text-slate-800">{b.remaining} Days</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Remaining of {b.allocated}d</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Used: {b.used}d
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Apply Leave Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Calendar size={20} className="text-indigo-600" /> Request Leave
                            </h3>
                            <form onSubmit={handleApplyLeave} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Leave Type</label>
                                    <select 
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                                        value={leaveForm.leaveTypeId || ''} 
                                        onChange={e => setLeaveForm({...leaveForm, leaveTypeId: e.target.value})} 
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        {leaveTypes.map(t => (
                                            <option key={t._id} value={t._id}>
                                                {t.name} (Quota: {t.quota}d)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Start Date</label>
                                    <input className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">End Date</label>
                                    <input className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Reason</label>
                                    <textarea className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" placeholder="Tell us why..." value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} required style={{ minHeight: '100px' }}></textarea>
                                </div>
                                <button className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                                    <Send size={18} /> Submit Application
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Leave History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={20} className="text-indigo-600" />
                                    <h3 className="text-lg font-bold text-slate-800">My Leave History</h3>
                                </div>
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Days</th>
                                            <th className="px-6 py-4">Reason</th>
                                            <th className="px-6 py-4">Status</th>
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
                                                    <span className="font-bold text-slate-800 text-xs bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                                                        {leave.leaveType?.name || 'Annual Leave'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-700 font-medium text-xs">
                                                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-600 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                        {calculateDays(leave.startDate, leave.endDate)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-600 text-sm bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 group-hover:border-indigo-200 transition-colors">
                                                        {truncateReason(leave.reason)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`
                                                        px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                        ${leave.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                                                        ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                        ${leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : ''}
                                                    `}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {leaves.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        No leave requests found {statusFilter !== 'all' && `with status "${statusFilter}"`}.
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
