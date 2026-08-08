import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Users, TrendingUp, CalendarDays, Clock, Bell, AlertTriangle, MessageSquare, Coins, ClipboardList , Building2, CalendarClock, CalendarRange, MessageCircle, BarChart2, MonitorPlay} from 'lucide-react';

const HROverview = ({ user, leaves = [], attendance = [], latecomers = [], employees = [], holidays = [], announcements = [], mistakeReports = [], hrRequests = [], loans = [], setActiveTab, setHrRequestsSubTab }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
        >
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-xl font-bold mb-1">Welcome back, {user?.name}</h1>
                <p className="text-indigo-200 text-sm">
                    {leaves.filter(l => l.status === 'pending' || l.status === 'pending_hr').length} pending leave {leaves.filter(l => l.status === 'pending' || l.status === 'pending_hr').length === 1 ? 'request' : 'requests'} awaiting review.
                </p>
                <div className="mt-4">
                    <button
                        onClick={() => navigate('/hr/leaves')}
                        className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                        Review Leaves <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                {/* Leave Requests Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => navigate('/hr/leaves')}
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
                            {leaves.filter(l => l.status === 'pending' || l.status === 'pending_hr').length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Attendance Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => navigate('/hr/attendance')}
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
                    onClick={() => navigate('/hr/employees')}
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


                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => navigate('/hr/holidays')}
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

                {/* Announcements Card */}
                <motion.div
                    whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                    onClick={() => navigate('/hr/announcements')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-emerald-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <Bell size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg group-hover:bg-emerald-100 transition-colors">All</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Announcements</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">{announcements.length}</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Mistake Reports Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => navigate('/hr/mistake-reports')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-rose-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg group-hover:bg-rose-100 transition-colors">
                            Submitted
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Mistake Reports</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {mistakeReports.length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Combined Employee Requests Card */}
                <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => {
                        setHrRequestsSubTab?.('general');
                        navigate('/hr/hr-requests');
                    }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <ClipboardList size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            Pending
                        </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Employee Requests</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800">
                            {hrRequests.filter(r => r.status === 'Pending').length + loans.filter(l => ['Pending', 'Revision Requested'].includes(l.status)).length}
                        </p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>
            </div>

            {/* ── Quick Access Features ── */}
            <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> Workspace
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-7xl">
                    
                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/departments')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Building2 size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Departments</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/office-schedule')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <CalendarClock size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Office Schedule</span>
                    </motion.div>
                    
                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/leave-types')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <CalendarRange size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Leave Types</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/messages')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center relative">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Messages</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/reports')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <BarChart2 size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">User Reports</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/hr/training')} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <MonitorPlay size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Training</span>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    );
};


export default HROverview;