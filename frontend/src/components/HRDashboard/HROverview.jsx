import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Calendar, Users, TrendingUp } from 'lucide-react';

const HROverview = ({ user, leaves, attendance, employees = [], setActiveTab }) => {
    return (
        <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
        >
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}! 👋</h1>
                    <p className="text-indigo-100 text-sm max-w-md">
                        You have {leaves.filter(l => l.status === 'pending').length} pending leave requests today.
                    </p>
                    <div className="mt-4 flex gap-3">
                        <button onClick={() => setActiveTab('leaves')} className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2">
                            Review Leaves <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">Pending</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Leave Requests</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">{leaves.filter(l => l.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">Active</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Today's Attendance</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">{attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Total</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Employees</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">{employees.filter(e => e.role !== 'hr').length}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default HROverview;
