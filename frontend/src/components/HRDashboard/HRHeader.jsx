import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarCheck,
    Clock,
    Search,
    Calendar,
    Users,
    ClipboardList,
    Building2,
    BarChart2,
    CalendarDays,
    CalendarRange,
    Bell,
    User,
    Menu,
    AlertTriangle,
    ArrowLeft
} from 'lucide-react';
import NotificationsPanel from '../NotificationsPanel';

const HRHeader = ({
    leaveFilter,
    setLeaveFilter,
    attendanceDateFilter,
    setAttendanceDateFilter,
    searchTerm,
    setSearchTerm,
    setSidebarOpen,
    onNotificationNavigate
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    let activeTab = location.pathname.split('/').pop();
    if (activeTab === 'hr' || activeTab === '') activeTab = 'dashboard';
    if (location.pathname.includes('/employees')) activeTab = 'employees';

    const isAddingEmployee = location.pathname === '/hr/employees/add';
    const isEditingEmployee = location.pathname.includes('/hr/employees/edit/');
    const isViewingEmployee = !isAddingEmployee && !isEditingEmployee && location.pathname !== '/hr/employees' && location.pathname.includes('/hr/employees/');

    const canGoBack = activeTab !== 'dashboard' || isAddingEmployee || isEditingEmployee || isViewingEmployee;

    const tabMeta = {
        'dashboard': { icon: <LayoutDashboard size={24} className="text-indigo-600" />, title: 'Overview' },
        'employees': { icon: <Users size={24} className="text-indigo-600" />, title: 'Staff Directory' },
        'leaves': { icon: <CalendarCheck size={24} className="text-indigo-600" />, title: 'Leave Requests' },
        'leave-types': { icon: <CalendarRange size={24} className="text-indigo-600" />, title: 'Leave Types' },

        'attendance': { icon: <ClipboardList size={24} className="text-indigo-600" />, title: 'Attendance Master' },
        'departments': { icon: <Building2 size={24} className="text-indigo-600" />, title: 'Departments' },
        'reports': { icon: <BarChart2 size={24} className="text-indigo-600" />, title: 'User Report Center' },
        'holidays': { icon: <CalendarDays size={24} className="text-indigo-600" />, title: 'Holiday Calendar' },
        'hr-requests': { icon: <ClipboardList size={24} className="text-indigo-600" />, title: 'HR Requests' },
        'announcements': { icon: <Bell size={24} className="text-indigo-600" />, title: 'Announcements' },
        'mistake-reports': { icon: <AlertTriangle size={24} className="text-indigo-600" />, title: 'Mistake Reports' },
        'profile': { icon: <User size={24} className="text-indigo-600" />, title: 'My Profile' },
        'edit-profile': { icon: <User size={24} className="text-indigo-600" />, title: 'Edit Profile' }
    };

    let currentMeta = tabMeta[activeTab] || { icon: null, title: '' };
    if (activeTab === 'employees') {
        if (isEditingEmployee) {
            currentMeta = { icon: <Users size={24} className="text-indigo-600" />, title: 'Edit Employee' };
        } else if (isAddingEmployee) {
            currentMeta = { icon: <Users size={24} className="text-indigo-600" />, title: 'Add New Employee' };
        } else if (isViewingEmployee) {
            currentMeta = { icon: <Users size={24} className="text-indigo-600" />, title: 'Employee Details' };
        }
    }

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 sticky top-0 z-40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                {canGoBack && (
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition-all font-semibold text-xs sm:text-sm group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shrink-0 shadow-xs"
                        aria-label="Go Back"
                        title="Go Back"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform text-indigo-600 dark:text-indigo-400" />
                        <span>Back</span>
                    </button>
                )}
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 min-w-0">
                    {currentMeta.icon}
                    <span className="truncate">{currentMeta.title}</span>
                </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {(activeTab === 'attendance' || activeTab === 'employees') && (
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'employees' ? "Search employees..." : "Search name or email..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm w-full"
                        />
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setLeaveFilter(status)}
                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${leaveFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={attendanceDateFilter}
                            onChange={(e) => setAttendanceDateFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 transition-all text-sm flex-1 sm:flex-none cursor-pointer"
                        />
                        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-transparent dark:border-slate-700">
                            <button
                                onClick={() => setAttendanceDateFilter(new Date().toISOString().slice(0, 10))}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${attendanceDateFilter === new Date().toISOString().slice(0, 10)
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setAttendanceDateFilter('')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${attendanceDateFilter === ''
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center ml-2">
                    <NotificationsPanel onNavigate={(tab, subParam) => {
                        if (tab === 'messages') {
                            navigate(`/hr/messages${subParam ? `?chat=${subParam}` : ''}`);
                        } else if (tab === 'hr-requests') {
                            navigate(`/hr/hr-requests`);
                        } else if (tab === 'leaves') {
                            navigate(`/hr/leaves`);
                        } else {
                            navigate(`/hr/${tab}`);
                        }
                    }} />
                </div>
            </div>
        </header>
    );
};

export default HRHeader;