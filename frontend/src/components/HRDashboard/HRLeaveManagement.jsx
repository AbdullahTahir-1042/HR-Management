import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Check, X, Clock } from 'lucide-react';
import LeaveDetailModal from '../LeaveDetailModal';
import LeaveConfirmationModal from '../LeaveConfirmationModal';

const HRLeaveManagement = ({ filteredLeaves, handleStatusUpdate }) => {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { leave, action }

    const truncateReason = (reason) => {
        if (!reason) return '';
        return reason.length > 20 ? reason.substring(0, 20) + '...' : reason;
    };

    const calculateDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const onConfirmAction = async (id, action) => {
        await handleStatusUpdate(id, action);
        setConfirmAction(null);
    };

    return (
        <>
            <motion.div 
                key="leaves"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-[0.1em]">
                                <th className="px-8 py-4">Employee</th>
                                <th className="px-8 py-4">Duration</th>
                                <th className="px-8 py-4 text-center">Days</th>
                                <th className="px-8 py-4">Reason</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeaves.map(leave => (
                                <tr 
                                    key={leave._id} 
                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedLeave(leave)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{leave.employee?.name}</span>
                                            <span className="text-xs text-slate-400">{leave.employee?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-slate-600 text-sm">
                                        <div className="flex flex-col">
                                            <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold">
                                            {calculateDays(leave.startDate, leave.endDate)} Days
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-slate-600 text-sm bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 group-hover:border-indigo-200 transition-colors">
                                            {truncateReason(leave.reason)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`
                                            px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                                            ${leave.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                                            ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                                            ${leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : ''}
                                        `}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                        {leave.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => setConfirmAction({ leave, action: 'approved' })}
                                                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmAction({ leave, action: 'rejected' })}
                                                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLeaves.length === 0 && (
                        <div className="p-20 text-center text-slate-400">
                            <CalendarCheck size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No leave requests found matching your filter.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <LeaveDetailModal 
                leave={selectedLeave} 
                onClose={() => setSelectedLeave(null)} 
                onStatusUpdate={handleStatusUpdate}
            />

            {confirmAction && (
                <LeaveConfirmationModal 
                    leave={confirmAction.leave}
                    action={confirmAction.action}
                    onConfirm={onConfirmAction}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
};

export default HRLeaveManagement;
