import React from 'react';
import { LayoutDashboard, Clock, Calendar, Sun, ClipboardList, BookOpen, User } from 'lucide-react';

const tabConfig = {
    dashboard:    { icon: LayoutDashboard, label: 'Overview' },
    attendance:   { icon: Clock,           label: 'Mark Attendance' },
    leaves:       { icon: Calendar,         label: 'Request Leave' },
    holidays:     { icon: Sun,              label: 'Holidays' },
    'hr-requests':{ icon: ClipboardList,    label: 'HR Requests' },
    onboarding:   { icon: BookOpen,         label: 'Onboarding' },
    profile:      { icon: User,             label: 'My Profile' },
};

const EmployeeHeader = ({ activeTab }) => {
    const config = tabConfig[activeTab] || tabConfig.dashboard;
    const Icon = config.icon;
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Icon size={24} className="text-indigo-600" />
                {config.label}
            </h2>
        </header>
    );
};

export default EmployeeHeader;
