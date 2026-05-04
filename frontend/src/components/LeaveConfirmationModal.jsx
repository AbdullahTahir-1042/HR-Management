import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Calendar, Hash, User } from 'lucide-react';

const LeaveConfirmationModal = ({ leave, action, onConfirm, onCancel }) => {
    if (!leave) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const calculateDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const isApprove = action === 'approved';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                {/* Modal Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isApprove ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl text-white ${isApprove ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                {isApprove ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
                            </h3>
                        </div>
                        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-slate-500 text-sm leading-relaxed">
                                You are about to <span className={`font-bold ${isApprove ? 'text-emerald-600' : 'text-rose-600'}`}>{action}</span> the leave request for:
                            </p>
                            <div className="flex items-center justify-center gap-3 py-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User size={20} />
                                </div>
                                <span className="text-lg font-black text-slate-800">{leave.employee?.name}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                                    <Calendar size={14} className="text-indigo-500" />
                                    <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Impact</p>
                                <div className="flex items-center gap-2 text-slate-800 font-black">
                                    <span>{calculateDays(leave.startDate, leave.endDate)} Days</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={onCancel}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => onConfirm(leave._id, action)}
                                className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}
                            >
                                {isApprove ? 'Approve' : 'Reject'} Request
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LeaveConfirmationModal;
