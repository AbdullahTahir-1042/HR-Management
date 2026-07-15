import { LayoutDashboard, Clock, Calendar, Bell, User } from 'lucide-react';

const EmployeeHeader = ({ activeTab }) => {
    const config = {
        dashboard:     { icon: <LayoutDashboard size={24} className="text-indigo-600" />, label: 'Overview' },
        attendance:    { icon: <Clock size={24} className="text-indigo-600" />,           label: 'Mark Attendance' },
        leaves:        { icon: <Calendar size={24} className="text-indigo-600" />,        label: 'Request Leave' },
        announcements: { icon: <Bell size={24} className="text-indigo-600" />,            label: 'Announcements' },
        profile:       { icon: <User size={24} className="text-indigo-600" />,            label: 'My Profile' },
    };

    const current = config[activeTab] || config.dashboard;

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {current.icon}
                {current.label}
            </h2>
        </header>
    );
};

export default EmployeeHeader;