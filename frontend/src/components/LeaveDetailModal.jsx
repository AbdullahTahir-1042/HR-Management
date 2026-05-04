import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, FileText, CheckCircle, Clock, AlertCircle, Check, Edit2 } from 'lucide-react';
import LeaveConfirmationModal from './LeaveConfirmationModal';

const LeaveDetailModal = ({ leave, onClose, onStatusUpdate }) => {
    const [confirmAction, setConfirmAction] = useState(null);

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

    const handleConfirmAction = async (id, action) => {
        if (onStatusUpdate) {
            await onStatusUpdate(id, action);
        }
        setConfirmAction(null);
        onClose();
    };

    const isProcessed = leave.status !== 'pending';

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Leave Details</h3>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {/* Employee Info */}
                            {leave.employee && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {leave.employee.name?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{leave.employee.name}</p>
                                        <p className="text-sm text-slate-500">{leave.employee.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Dates and Stats */}
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                        <Calendar size={16} className="text-indigo-500" />
                                        <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days</p>
                                    <div className="flex items-center gap-2 justify-end text-slate-700 font-black">
                                        <span className="text-lg">{calculateDays(leave.startDate, leave.endDate)} Days</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                                    <div className="flex items-center gap-2">
                                        {leave.status === 'approved' && <CheckCircle size={16} className="text-emerald-500" />}
                                        {leave.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                                        {leave.status === 'rejected' && <AlertCircle size={16} className="text-rose-500" />}
                                        <span className={`font-bold capitalize ${
                                            leave.status === 'approved' ? 'text-emerald-600' : 
                                            leave.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                                        }`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Leave</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed min-h-[100px] text-sm italic">
                                    "{leave.reason}"
                                </div>
                            </div>
                        </div>

                        {/* Footer - Actions allowed for all statuses */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">                        
                            {onStatusUpdate && (
                                <div className="flex gap-2">
                                    {leave.status !== 'rejected' && (
                                        <button 
                                            onClick={() => setConfirmAction({ leave, action: 'rejected' })}
                                            className={`px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all flex items-center gap-2 ${isProcessed ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            {isProcessed ? <Edit2 size={14} /> : <X size={16} />} 
                                            {isProcessed ? 'Mark Rejected' : 'Reject'}
                                        </button>
                                    )}
                                    {leave.status !== 'approved' && (
                                        <button 
                                            onClick={() => setConfirmAction({ leave, action: 'approved' })}
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                                        >
                                            {isProcessed ? <Edit2 size={14} /> : <Check size={16} />}
                                            {isProcessed ? 'Mark Approved' : 'Approve'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {confirmAction && (
                <LeaveConfirmationModal 
                    leave={confirmAction.leave}
                    action={confirmAction.action}
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
};

export default LeaveDetailModal;
