import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    MessageCircle
} from 'lucide-react';

const HRSidebar = ({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen, unreadMessages = 0 }) => {
    const navigate = useNavigate();
    return (
        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Logo */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="font-bold text-lg text-slate-800 tracking-tight">HR Admin</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden focus:outline-none"
                    aria-label="Close Sidebar"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">

                {/* Dashboard */}
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-sm">Dashboard</span>
                </button>

                {/* Employees */}
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'employees' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <User size={20} />
                    <span className="text-sm">Employees</span>
                </button>

                {/* Messages — NEW from feature/chat */}
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'messages' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <MessageCircle size={20} />
                    <span className="text-sm flex-1 text-left">Messages</span>
                    {unreadMessages > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                    )}
                </button>

                {/* ── TIME & ATTENDANCE ── */}
                <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Time & Attendance</p>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Calendar size={18} />
                            <span>Attendance Logs</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('latecomers')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'latecomers' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Clock size={18} />
                            <span>Late Comers</span>
                        </button>
                    </div>
                </div>

                {/* ── REQUESTS & LEAVES ── */}
                <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">Requests & Leaves</p>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'leaves' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarCheck size={18} />
                            <span>Leave Requests</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('leave-types')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'leave-types' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarRange size={18} />
                            <span>Leave Types</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('hr-requests')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'hr-requests' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <ClipboardList size={18} />
                            <span>HR Requests</span>
                        </button>
                    </div>
                </div>

                {/* ── SYSTEM & REPORTS ── */}
                <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-1">System & Reports</p>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <BarChart2 size={18} />
                            <span>User Reports</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('mistake-reports')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'mistake-reports' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <AlertTriangle size={18} />
                            <span>Mistake Reports</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('holidays')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'holidays' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <CalendarDays size={18} />
                            <span>Holidays</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('announcements')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${activeTab === 'announcements' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <Bell size={18} />
                            <span>Announcements</span>
                        </button>
                    </div>
                </div>

            </nav>

            {/* Profile + Logout */}
            <div className="p-4 border-t border-slate-100">
                <div
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user?.name?.[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">View Profile</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>

        </aside>
    );
};

export default HRSidebar;