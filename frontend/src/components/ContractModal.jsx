import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calendar, Building2, UserCheck, ShieldCheck } from 'lucide-react';

const ContractModal = ({ isOpen, onClose, contractDetails, employeeName }) => {
    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not Specified';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return 'Not Specified';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                    onClick={onClose} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/50 ring-1 ring-slate-900/5"
                >
                    {/* Header Minimal */}
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl shadow-sm">
                                <FileText size={22} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employment Contract</h2>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-0.5">Official Agreement</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700 hover:rotate-90 duration-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content (Scrollable) */}
                    <div 
                        className="p-8 overflow-y-auto bg-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full" 
                        style={{ maxHeight: 'calc(90vh - 160px)' }}
                    >
                        <div className="max-w-xl mx-auto space-y-10">
                            
                            {/* Intro Section */}
                            <div className="text-center pb-8 border-b border-slate-100/50">
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <h3 className="text-3xl font-serif text-slate-900 mb-3">Employment Agreement</h3>
                                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                        This formal agreement outlines the working relationship between the Company and <strong className="text-indigo-600 font-bold">{employeeName || 'the Employee'}</strong>.
                                    </p>
                                </motion.div>
                            </div>

                            {/* Details Grid */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="grid grid-cols-2 gap-x-8 gap-y-8 pb-8 border-b border-slate-100/50"
                            >
                                <div className="space-y-1.5 group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                                        <Building2 size={14} /> Contract Type
                                    </p>
                                    <p className="text-base font-semibold text-slate-800">{contractDetails?.contractType || 'Full-Time'}</p>
                                </div>
                                <div className="space-y-1.5 group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors">
                                        <UserCheck size={14} /> Status
                                    </p>
                                    <p className="text-base font-semibold text-emerald-600">Active Employee</p>
                                </div>
                                <div className="space-y-1.5 group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                                        <Calendar size={14} /> Start Date
                                    </p>
                                    <p className="text-base font-semibold text-slate-800">{formatDate(contractDetails?.startDate)}</p>
                                </div>
                                <div className="space-y-1.5 group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                                        <Calendar size={14} /> End Date
                                    </p>
                                    <p className="text-base font-semibold text-slate-800">
                                        {contractDetails?.endDate ? formatDate(contractDetails.endDate) : 'Indefinite'}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Terms Section */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-indigo-500" />
                                    Terms & Summary
                                </h4>
                                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <p>{contractDetails?.summary || 'This is a standard employment contract establishing the terms, conditions, and expectations of employment between the company and the employee. It encompasses compensation, benefits, working hours, confidentiality agreements, and termination clauses.'}</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-slate-100 bg-white/80 shrink-0 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Acknowledge & Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContractModal;
