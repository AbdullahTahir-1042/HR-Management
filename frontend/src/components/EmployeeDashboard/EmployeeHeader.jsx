import { LayoutDashboard, Clock, Calendar, Bell, User, PartyPopper, MessageSquare, Menu } from 'lucide-react';

const EmployeeHeader = ({ activeTab, setSidebarOpen }) => {
    const config = {
        dashboard:     { icon: <LayoutDashboard size={24} className="text-indigo-600" />, label: 'Overview' },
        attendance:    { icon: <Clock size={24} className="text-indigo-600" />,           label: 'Mark Attendance' },
        leaves:        { icon: <Calendar size={24} className="text-indigo-600" />,        label: 'Request Leave' },
        holidays:      { icon: <PartyPopper size={24} className="text-indigo-600" />,      label: 'Holiday Calendar' },
        'hr-requests': { icon: <MessageSquare size={24} className="text-indigo-600" />,    label: 'HR Requests' },
        announcements: { icon: <Bell size={24} className="text-indigo-600" />,            label: 'Announcements' },
        profile:       { icon: <User size={24} className="text-indigo-600" />,            label: 'My Profile' },
    };

    const current = config[activeTab] || config.dashboard;

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                    {current.icon}
                    <span>{current.label}</span>
                </h2>
            </div>
        </header>
    );
};

export default EmployeeHeader;