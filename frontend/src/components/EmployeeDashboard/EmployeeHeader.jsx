import { LayoutDashboard, Clock, Calendar, Bell, User, PartyPopper, MessageSquare, Menu, ArrowLeft, MessageCircle, MonitorPlay, Users } from 'lucide-react';
import NotificationsPanel from '../NotificationsPanel';

const EmployeeHeader = ({ activeTab, setActiveTab, onBack, canGoBack = true, setSidebarOpen, onNotificationNavigate }) => {
    const config = {
        dashboard: { icon: <LayoutDashboard size={24} className="text-indigo-600" />, label: 'Overview' },
        attendance: { icon: <Clock size={24} className="text-indigo-600" />, label: 'Mark Attendance' },
        leaves: { icon: <Calendar size={24} className="text-indigo-600" />, label: 'Request Leave' },
        holidays: { icon: <PartyPopper size={24} className="text-indigo-600" />, label: 'Holiday Calendar' },
        'hr-requests': { icon: <MessageSquare size={24} className="text-indigo-600" />, label: 'HR Requests' },
        announcements: { icon: <Bell size={24} className="text-indigo-600" />, label: 'Announcements' },
        profile: { icon: <User size={24} className="text-indigo-600" />, label: 'My Profile' },
        messages: { icon: <MessageCircle size={24} className="text-indigo-600" />, label: 'Messages' },
        training: { icon: <MonitorPlay size={24} className="text-indigo-600" />, label: 'Training' },
        myTeam: { icon: <Users size={24} className="text-indigo-600" />, label: 'My Team' },
    };

    const current = config[activeTab] || config.dashboard;

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-40 flex items-center justify-between gap-4">
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
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition-all font-semibold text-xs sm:text-sm group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shrink-0 shadow-xs"
                        aria-label="Go Back"
                        title="Go Back"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform text-indigo-600 dark:text-indigo-400" />
                        <span>Back</span>
                    </button>
                )}
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 min-w-0">
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