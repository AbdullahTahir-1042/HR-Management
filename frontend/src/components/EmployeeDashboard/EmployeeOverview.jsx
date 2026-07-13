import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, Clock, Calendar, Megaphone, TrendingUp, Bell } from 'lucide-react';

const EmployeeOverview = ({ user, attendance, leaves, announcements = [], setActiveTab }) => {
    const todayAttendance = attendance;

    const salaryStats = useMemo(() => {
        const baseSalary = Number(user?.salary) || 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthLeaves = leaves.filter(l => {
            if (l.status !== 'approved' || !l.startDate) return false;
            const leaveDate = new Date(l.startDate);
            return leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
        });

        let totalDays = 0;
        thisMonthLeaves.forEach(l => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            if (!isNaN(start) && !isNaN(end)) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                totalDays += diffDays;
            }
        });

        const deduction = Math.round((baseSalary / 30) * totalDays);
        const netSalary = Math.max(0, baseSalary - deduction);

        return { netSalary, totalDays, baseSalary };
    }, [user?.salary, leaves]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <User size={120} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-1">Hello, {user?.name}! 👋</h1>
                    <p className="text-indigo-100 text-sm max-w-md">
                        {todayAttendance 
                            ? (todayAttendance.checkOut 
                                ? "You've completed your shift for today." 
                                : "Don't forget to check out when you leave.") 
                            : "Welcome! Start your day by marking your attendance."}
                    </p>
                    <div className="mt-4 flex gap-3">
                        {!todayAttendance ? (
                            <button 
                                onClick={() => setActiveTab('attendance')} 
                                className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Check In Now <ArrowRight size={16} />
                            </button>
                        ) : !todayAttendance.checkOut ? (
                            <button 
                                onClick={() => setActiveTab('attendance')} 
                                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Check Out <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => setActiveTab('leaves')} 
                                className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-2"
                            >
                                Request Leave <Calendar size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">

                {/* Today Status Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('attendance')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Clock size={20} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                            todayAttendance 
                                ? (todayAttendance.checkOut 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-amber-50 text-amber-600') 
                                : 'bg-slate-50 text-slate-500'
                        }`}>
                            {todayAttendance 
                                ? (todayAttendance.checkOut ? 'Completed' : 'On Shift') 
                                : 'Absent'}
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Today's Status</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {todayAttendance 
                                ? (todayAttendance.checkIn 
                                    ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : '-') 
                                : 'Not Checked In'}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Leaves Month Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('leaves')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-amber-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg group-hover:bg-amber-100 transition-colors">Month</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Leaves Taken</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">{salaryStats.totalDays} Days</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Net Salary Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('profile')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-emerald-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-tight group-hover:bg-emerald-100 transition-colors">Est. Payable</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Current Month Net</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <div>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(salaryStats.netSalary)}</p>
                            <p className="text-[9px] text-slate-400 font-medium">After {salaryStats.totalDays} days deduction</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Notifications Card — fixed */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('notifications')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Bell size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-tight group-hover:bg-indigo-100 transition-colors">All</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Notificationss</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-900">{}</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setActiveTab('announcements')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Megaphone size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-tight group-hover:bg-indigo-100 transition-colors">All</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Announcements</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-900">{announcements.length}</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default EmployeeOverview;