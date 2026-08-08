import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Clock, Calendar, LogOut, User,
    PartyPopper, MessageSquare, Bell, Users, Crown,
    Sparkles, GraduationCap, BookOpen, X, MessageCircle, MonitorPlay,
    Sun, Moon, Star
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
    { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'attendance',   label: 'Mark Attendance',   icon: Clock },
    { id: 'leaves',       label: 'Request Leave',     icon: Calendar },
    { id: 'holidays',     label: 'Holiday Calendar',  icon: PartyPopper },
    { id: 'performance',  label: 'My Performance',    icon: Star },
    { id: 'hr-requests',  label: 'HR Requests',       icon: MessageSquare },
    { id: 'messages',     label: 'Messages',          icon: MessageCircle },
    { id: 'announcements',label: 'Announcements',     icon: Bell },
    { id: 'training',     label: 'Training',          icon: MonitorPlay },
];

const EmployeeSidebar = ({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen, unreadMessages = 0 }) => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo / Home Button */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-3 cursor-pointer group text-left p-1 -ml-1 rounded-xl hover:bg-slate-50 transition-all focus:outline-none"
                    title="Go to Dashboard Overview"
                >
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-200">
                        <User size={24} />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 tracking-tight block leading-tight transition-colors duration-200 truncate max-w-[150px]">
                            {user?.name || 'Employee Portal'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[150px] block capitalize">
                            {user?.department || 'Staff'}
                        </span>
                        {user?.isTeamLead && (
                            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                                <Crown size={10} /> Team Lead
                            </span>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden focus:outline-none"
                    aria-label="Close Sidebar"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${activeTab === id
                                ? 'bg-indigo-50 text-indigo-600 font-bold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        <Icon size={20} />
                        <span className="text-sm">{label}</span>
                        {id === 'messages' && unreadMessages > 0 && (
                            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                {unreadMessages}
                            </span>
                        )}
                    </button>
                ))}

                {/* My Team — only visible to Team Leads */}
                {user?.isTeamLead && (
                    <button
                        onClick={() => setActiveTab('myTeam')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${activeTab === 'myTeam'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'}`}
                    >
                        <Users size={20} />
                        <span className="text-sm">My Team</span>
                        <span className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full">
                            Lead
                        </span>
                    </button>
                )}
            </nav>

            {/* Profile + Logout */}
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

                <div
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {user?.name}
                        </p>
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

export default EmployeeSidebar;