import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    ShieldCheck, 
    CalendarCheck, 
    Clock, 
    LogOut, 
    LayoutDashboard, 
    User, 
    Building2, 
    Sparkles, 
    BarChart2,
    CalendarDays,
    ClipboardList,
    GraduationCap,
    CalendarRange,
    Calendar,
    Bell,
    BookOpen,
    AlertTriangle,
    X,
    MessageCircle,
    MonitorPlay,
    CalendarClock,
    Sun,
    Moon,
    Trophy
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const HRSidebar = ({ user, logout, isOpen, setIsOpen, unreadMessages = 0, pendingRequestsCount = 0 }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useTheme();

    const getIsActive = (path) => {
        if (path === 'dashboard' && (location.pathname === '/hr' || location.pathname === '/hr/')) return true;
        if (path !== 'dashboard' && location.pathname.includes('/hr/' + path)) return true;
        return false;
    };

    return (
        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Logo / Home Button */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <Link
                    to="/hr"
                    className="flex items-center gap-3 cursor-pointer group text-left p-1 -ml-1 rounded-xl hover:bg-slate-50 transition-all focus:outline-none"
                    title="Go to Dashboard Overview"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-200">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 tracking-tight transition-colors duration-200">HR Admin</span>
                </Link>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden focus:outline-none"
                    aria-label="Close Sidebar"
                >
                    <X size={18} />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-3 mt-2 overflow-y-auto no-scrollbar">
                {/* ── SECTION: OVERVIEW ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Overview</p>
                    <Link
                        to="/hr"
                        onClick={() => setIsOpen(false)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('dashboard') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </Link>
                </div>

                {/* ── SECTION: MANAGEMENT ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Organization</p>
                    <div className="space-y-0.5">
                        <Link
                            to="/hr/employees"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('employees') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <User size={18} />
                            <span>Employees</span>
                        </Link>
                        <Link 
                            to="/hr/departments"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('departments') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Building2 size={18} />
                            <span>Departments</span>
                        </Link>
                    </div>
                </div>

                {/* ── SECTION: TIME & ATTENDANCE ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Time & Attendance</p>
                    <div className="space-y-0.5">
                        <Link 
                            to="/hr/attendance"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('attendance') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Calendar size={18} />
                            <span>Attendance Logs</span>
                        </Link>

                        <Link 
                            to="/hr/office-schedule"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('office-schedule') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarClock size={18} />
                            <span>Office Schedule</span>
                        </Link>
                    </div>
                </div>

                {/* ── SECTION: REQUESTS & LEAVES ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Requests & Leaves</p>
                    <div className="space-y-0.5">
                        <Link
                            to="/hr/leaves"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('leaves') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarCheck size={18} />
                            <span>Leave Requests</span>
                        </Link>
                        <Link
                            to="/hr/leave-types"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('leave-types') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarRange size={18} />
                            <span>Leave Types</span>
                        </Link>
                        <Link
                            to="/hr/hr-requests"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('hr-requests') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <ClipboardList size={18} />
                            <span>HR Requests</span>
                        </Link>
                    </div>
                </div>

                {/* ── SECTION: COMMUNICATIONS ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Communication</p>
                    <div className="space-y-0.5">
                        <Link
                            to="/hr/messages"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('messages') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <MessageCircle size={18} />
                            <span>Messages</span>
                            {unreadMessages > 0 && (
                                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                    {unreadMessages}
                                </span>
                            )}
                        </Link>
                        <Link 
                            to="/hr/announcements"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('announcements') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Bell size={18} />
                            <span>Announcements</span>
                        </Link>
                    </div>
                </div>

                {/* ── SECTION: SYSTEM & REPORTS ── */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">System & Reports</p>
                    <div className="space-y-0.5">
                        <Link 
                            to="/hr/reports"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('reports') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <BarChart2 size={18} />
                            <span>User Reports</span>
                        </Link>
                        <Link 
                            to="/hr/mistake-reports"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('mistake-reports') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <AlertTriangle size={18} />
                            <span>Mistake Reports</span>
                        </Link>
                        <Link 
                            to="/hr/training"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('training') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <MonitorPlay size={18} />
                            <span>Training Management</span>
                        </Link>
                        <Link
                            to="/hr/holidays"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${getIsActive('holidays') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarDays size={18} />
                            <span>Holidays</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100">
                {/* Dark / Light Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl transition-all duration-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 group cursor-pointer"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <div className="relative w-5 h-5">
                        <Sun size={18} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                        <Moon size={18} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
                    </div>
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <Link
                    to="/hr/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user?.name?.[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">View Profile</p>
                    </div>
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default HRSidebar;