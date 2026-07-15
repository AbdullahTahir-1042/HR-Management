import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Calendar, Users, TrendingUp, CalendarDays } from 'lucide-react';

const HROverview = ({ user, leaves, attendance, employees = [], holidays = [], setActiveTab }) => {
    return (
        <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
        >
            {/* Welcome Banner */}
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
                        <button 
                            onClick={() => setActiveTab('leaves')} 
                            className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            Review Leaves <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Leave Requests Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('leaves')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-amber-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg group-hover:bg-amber-100 transition-colors">
                            Pending
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Leave Requests</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {leaves.filter(l => l.status === 'pending').length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Attendance Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('attendance')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            Active
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Today's Attendance</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Total Employees Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('employees')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-emerald-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            Total
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Employees</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {employees.filter(e => e.role !== 'hr').length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                </motion.div>

                {/* ✅ NEW — Holidays Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('holidays')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-violet-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl group-hover:bg-violet-100 transition-colors">
                            <CalendarDays size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg group-hover:bg-violet-100 transition-colors">
                            Upcoming
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Company Holidays</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {holidays.length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default HROverview;