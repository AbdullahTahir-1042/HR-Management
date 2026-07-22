import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Clock, Calendar, LogOut, User,
    PartyPopper, MessageSquare, Bell, Users, Crown,
    Sparkles, GraduationCap, BookOpen, X
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'attendance',   label: 'Mark Attendance',   icon: Clock },
    { id: 'leaves',       label: 'Request Leave',     icon: Calendar },
    { id: 'holidays',     label: 'Holiday Calendar',  icon: PartyPopper },
    { id: 'hr-requests',  label: 'HR Requests',       icon: MessageSquare },
    { id: 'announcements',label: 'Announcements',     icon: Bell },
];

const EmployeeSidebar = ({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen }) => {
    return (
        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                        <User size={24} />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-slate-800 tracking-tight block leading-tight">
                            Employee Portal
                        </span>
                        {user?.isTeamLead && (
                            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                                <Crown size={10} /> Team Lead
                            </span>
                        )}
                    </div>
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
            <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto">
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
                    </button>
                ))}

                {/* My Team — only visible to Team Leads */}
                {user?.isTeamLead && (
                    <button
                        onClick={() => setActiveTab('myTeam')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${activeTab === 'myTeam'
                                ? 'bg-amber-50 text-amber-600 font-bold'
                                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`}
                    >
                        <Users size={20} />
                        <span className="text-sm">My Team</span>
                        <span className="ml-auto text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">
                            Lead
                        </span>
                    </button>
                )}

                {/* 👇 PRACTICE ONBOARDING (LINK 1) COMMENTED OUT */}
                {/* <Link 
                    to="/practice-onboarding"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                    <Sparkles size={20} />
                    <span className="text-sm">Practice Onboarding</span>
                </Link> */}

                {/* 👇 PRACTICE ONBOARDING (BUTTON 2) COMMENTED OUT */}
                {/* <button
                    onClick={() => navigate('/practice-onboarding')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                    <GraduationCap size={20} />
                    <span className="text-sm">Practice Onboarding</span>
                </button> */}

                {/* 👇 PRACTICE ONBOARDING (LINK 3) COMMENTED OUT */}
                {/* <Link 
                    to="/practice-onboarding"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                    <BookOpen size={20} />
                    <span className="text-sm">practice-onboarding</span>
                </Link> */}
            </nav>

            {/* Profile + Logout */}
            <div className="p-4 border-t border-slate-100">
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