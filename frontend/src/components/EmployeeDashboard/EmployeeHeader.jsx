import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, Calendar, Bell, User, PartyPopper, MessageSquare, Menu, ArrowLeft, MessageCircle, MonitorPlay, Users } from 'lucide-react';
import NotificationsPanel from '../NotificationsPanel';

const EmployeeHeader = ({ setSidebarOpen, onNotificationNavigate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    let activeTab = location.pathname.split('/').pop();
    if (activeTab === 'employee' || activeTab === '') activeTab = 'dashboard';

    const canGoBack = activeTab !== 'dashboard';

    const config = {
        dashboard: { icon: <LayoutDashboard size={24} className="text-indigo-600" />, label: 'Overview' },
        attendance: { icon: <Clock size={24} className="text-indigo-600" />, label: 'Mark Attendance' },
        leaves: { icon: <Calendar size={24} className="text-indigo-600" />, label: 'Request Leave' },
        holidays: { icon: <PartyPopper size={24} className="text-indigo-600" />, label: 'Holiday Calendar' },
        'hr-requests': { icon: <MessageSquare size={24} className="text-indigo-600" />, label: 'HR Requests' },
        announcements: { icon: <Bell size={24} className="text-indigo-600" />, label: 'Announcements' },
        profile: { icon: <User size={24} className="text-indigo-600" />, label: 'My Profile' },
        'edit-profile': { icon: <User size={24} className="text-indigo-600" />, label: 'Edit Profile' },
        messages: { icon: <MessageSquare size={24} className="text-indigo-600" />, label: 'Messages' },
        myTeam: { icon: <Users size={24} className="text-indigo-600" />, label: 'My Team' },
        'team-leaves': { icon: <Calendar size={24} className="text-indigo-600" />, label: 'Team Leaves' },
        training: { icon: <MonitorPlay size={24} className="text-indigo-600" />, label: 'Training Center' },
        performance: { icon: <PartyPopper size={24} className="text-indigo-600" />, label: 'My Performance' },
    };

    const current = config[activeTab] || config.dashboard;

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 sticky top-0 z-40 flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
                <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 min-w-0 transition-colors">
                    {current.icon}
                    <span className="truncate">{current.label}</span>
                </h2>
            </div>
            
            <div className="flex items-center ml-2">
                <NotificationsPanel onNavigate={onNotificationNavigate} />
            </div>
        </header>
    );
};

export default EmployeeHeader;