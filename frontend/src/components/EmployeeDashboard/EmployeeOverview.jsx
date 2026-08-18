import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosClient';
import { User, ArrowRight, Clock, Calendar, Megaphone, TrendingUp, PartyPopper, MessageSquare, Star, AlertCircle , MessageCircle, MonitorPlay, Users} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const EmployeeOverview = ({ user, attendance, leaves, holidays = [], announcements = [], setActiveTab, performanceSummary }) => {
    const todayAttendance = attendance;
    const navigate = useNavigate();

    const [todaySchedule, setTodaySchedule] = useState(null);
    const [upcomingSchedules, setUpcomingSchedules] = useState([]);

    useEffect(() => {
        apiClient.get('/office-schedule/today')
            .then(res => setTodaySchedule(res.data))
            .catch(() => setTodaySchedule(null));

        apiClient.get('/office-schedule/upcoming')
            .then(res => setUpcomingSchedules(res.data))
            .catch(() => setUpcomingSchedules([]));
    }, []);

    const formatTime12hr = (timeString) => {
        if (!timeString) return '';
        const [h, m] = timeString.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    // Check if today is Sunday or a Holiday to disable check-in
    const checkInDate = new Date();
    const isSunday = checkInDate.getDay() === 0;
    const isHoliday = holidays?.some(h => {
        const start = new Date(h.startDate);
        start.setHours(0,0,0,0);
        const end = new Date(h.endDate);
        end.setHours(23,59,59,999);
        return checkInDate >= start && checkInDate <= end;
    });

    const isOnLeave = leaves?.some(l => {
        if (l.status !== 'approved') return false;
        const start = new Date(l.startDate);
        start.setHours(0,0,0,0);
        const end = new Date(l.endDate);
        end.setHours(23,59,59,999);
        return checkInDate >= start && checkInDate <= end;
    });

    const isCheckInDisabled = isSunday || isHoliday || isOnLeave;
    let disableReason = "";
    if (isSunday) disableReason = "Happy Sunday! (Weekly Off)";
    else if (isHoliday) disableReason = "Today is a Holiday. Enjoy your day off!";
    else if (isOnLeave) disableReason = "You are on an approved leave today.";

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
            // Deduct salary ONLY if it is an Unpaid Leave
            const isUnpaid = l.leaveType && String(l.leaveType.name).toLowerCase().includes('unpaid');
            if (!isUnpaid) return;

            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            if (!isNaN(start) && !isNaN(end)) {
                const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                totalDays += diffDays;
            }
        });

        const deduction = Math.round((baseSalary / 30) * totalDays);
        const netSalary = Math.max(0, baseSalary - deduction);

        return { netSalary, totalDays, baseSalary };
    }, [user?.salary, leaves]);

    // ── UC-07: Next upcoming holiday ──────────────────────────────────────────
    const nextHoliday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return holidays
            .filter(h => new Date(h.startDate) >= today)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;
    }, [holidays]);

    const upcomingCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return holidays.filter(h => new Date(h.startDate) >= today).length;
    }, [holidays]);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0,
        }).format(amount);

    const formatShortDate = (dateStr) =>
        formatDate(dateStr);

    return (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
        >
            {/* ── Welcome Banner ── */}
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
                            isCheckInDisabled ? (
                                <div className="bg-white/20 dark:bg-slate-800/20 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 cursor-not-allowed border border-white/30">
                                    <Clock size={16} /> {disableReason}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => navigate(`/employee/${user?._id || user?.id}/attendance`)} 
                                    className="bg-white dark:bg-slate-800 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    Check In Now <ArrowRight size={16} />
                                </button>
                            )
                        ) : !todayAttendance.checkOut ? (
                                <button 
                                    onClick={() => navigate(`/employee/${user?._id || user?.id}/attendance`)} 
                                    className="bg-rose-500 dark:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-rose-600 dark:hover:bg-rose-700 hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    Check Out <ArrowRight size={16} />
                                </button>
                        ) : (
                            <button 
                                onClick={() => navigate(`/employee/${user?._id || user?.id}/leaves`)} 
                                className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-2"
                            >
                                Request Leave <Calendar size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Today's & Upcoming Working Hours ── */}
            <div className="flex flex-col lg:flex-row gap-4 max-w-6xl">
                {(user?.shiftDetails?.startTime || user?.departmentId?.shiftDetails?.startTime || todaySchedule) && (() => {
                    const hasCustomShift = user?.shiftDetails?.startTime && user?.shiftDetails?.endTime;
                    const hasDeptShift = !hasCustomShift && user?.departmentId?.shiftDetails?.startTime && user?.departmentId?.shiftDetails?.endTime;
                    
                    const startTimeStr = hasCustomShift ? user.shiftDetails.startTime : (hasDeptShift ? user.departmentId.shiftDetails.startTime : todaySchedule?.startTime);
                    const endTimeStr = hasCustomShift ? user.shiftDetails.endTime : (hasDeptShift ? user.departmentId.shiftDetails.endTime : todaySchedule?.endTime);
                    const isCustomSchedule = hasCustomShift || hasDeptShift || (!todaySchedule?.isDefault && todaySchedule?.reason);

                    if (!startTimeStr || !endTimeStr) return null;

                    return (
                        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
                            <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 rounded-xl shrink-0">
                                <Clock size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Working Hours</p>
                                <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                                    {formatTime12hr(startTimeStr)} – {formatTime12hr(endTimeStr)}
                                </p>
                                {(!hasCustomShift && !hasDeptShift) && todaySchedule?.reason && (
                                    <p className="text-xs text-violet-600 font-medium mt-0.5">{todaySchedule.reason}</p>
                                )}
                            </div>
                            {isCustomSchedule && (
                                <span className="text-[10px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-600 px-2 py-1 rounded-lg shrink-0">
                                    {hasCustomShift ? 'Custom Schedule' : (hasDeptShift ? 'Department Schedule' : 'Custom Schedule')}
                                </span>
                            )}
                        </div>
                    );
                })()}

                {upcomingSchedules && upcomingSchedules.length > 0 && (
                    <div className="flex-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-800/90 border border-indigo-100 dark:border-slate-700/50 rounded-2xl px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />
                            <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Upcoming Schedule Changes</p>
                        </div>
                        <div className="space-y-3 mt-3">
                            {upcomingSchedules.slice(0, 2).map((schedule) => (
                                <div key={schedule._id} className="flex justify-between items-center bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-white dark:border-slate-700/50 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white text-sm">
                                                {formatDate(schedule.date)}
                                            </span>
                                            {schedule.reason && (
                                                <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    {schedule.reason}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <Clock size={12} />
                                            <span className="font-medium text-xs">
                                                {formatTime12hr(schedule.startTime)} – {formatTime12hr(schedule.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl">

                {/* Performance Rating Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/employee/${user?._id || user?.id}/performance`)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-xl transition-colors bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                            {performanceSummary?.totalComplaints > 0 ? <AlertCircle size={20} /> : <Star size={20} />}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-tight transition-colors bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                            {performanceSummary?.hasReviews ? 'Rated' : 'Pending'}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Performance</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {performanceSummary ? `${performanceSummary.adjustedRating}/5` : '-'}
                        </p>
                    </div>
                </motion.div>

                {/* Today Status Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/employee/${user?._id || user?.id}/attendance`)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                            <Clock size={20} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                            {todayAttendance 
                                ? (todayAttendance.checkOut ? 'Completed' : 'On Shift') 
                                : 'Absent'}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Today's Status</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
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
                    onClick={() => navigate(`/employee/${user?._id || user?.id}/leaves`)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                            Month
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Leaves Taken</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{salaryStats.totalDays} Days</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

                {/* HR Request Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/employee/${user?._id || user?.id}/hr-requests`)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                            <MessageSquare size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg uppercase tracking-tight group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                            Support
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">HR Requests</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">Get Help</p>
                            <p className="text-[10px] text-slate-400 font-medium">Contact HR Department</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

                {/* Announcements Card */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/employee/${user?._id || user?.id}/announcements`)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                            <Megaphone size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg uppercase tracking-tight group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">All</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Announcements</p>
                    <div className="flex items-end justify-between mt-0.5">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{announcements.length}</p>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </motion.div>

            </div>

            
            {/* ── Quick Access Features ── */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> Workspace
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-6xl">
                    
                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate(`/employee/${user?._id || user?.id}/messages`)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center relative">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Messages</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate(`/employee/${user?._id || user?.id}/training`)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                            <MonitorPlay size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Training Center</span>
                    </motion.div>
                    
                    <motion.div whileHover={{ y: -4 }} onClick={() => navigate(`/employee/${user?._id || user?.id}/holidays`)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                            <PartyPopper size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Holidays</span>
                    </motion.div>

                    {user?.isTeamLead && (
                        <motion.div whileHover={{ y: -4 }} onClick={() => navigate(`/employee/${user?._id || user?.id}/myTeam`)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm cursor-pointer transition-all group hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md flex flex-col items-center justify-center gap-3 text-center relative">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">My Team</span>
                        </motion.div>
                    )}

                </div>
            </div>

            {/* ── UC-07: Upcoming Holiday Banner ── */}
            <motion.div
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/employee/${user?._id || user?.id}/holidays`)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 shadow-sm cursor-pointer transition-all group hover:border-indigo-300 hover:shadow-md p-5 max-w-6xl"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:bg-indigo-100 dark:bg-indigo-500/20 transition-colors shrink-0">
                            <PartyPopper size={22} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                Next Upcoming Holiday
                            </p>
                            {nextHoliday ? (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <p className="text-base font-bold text-slate-800 dark:text-white">{nextHoliday.name}</p>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 px-2 py-0.5 rounded-full">
                                        {formatShortDate(nextHoliday.startDate)}
                                    </span>
                                    {nextHoliday.type && (
                                        <span className={`badge ${
                                            nextHoliday.type === 'Public' ? 'badge-primary' :
                                            nextHoliday.type === 'Company' ? 'badge-success' :
                                            nextHoliday.type === 'Optional' ? 'badge-warning' :
                                            nextHoliday.type === 'Restricted' ? 'badge-danger' :
                                            'badge-primary'
                                        }`}>
                                            {nextHoliday.type}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-lg font-bold text-slate-400">No upcoming holidays</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                        {upcomingCount > 0 && (
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 px-3 py-1.5 rounded-xl">
                                {upcomingCount} upcoming
                            </span>
                        )}
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EmployeeOverview;