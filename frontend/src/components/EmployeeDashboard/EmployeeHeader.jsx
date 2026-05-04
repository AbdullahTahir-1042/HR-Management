import React from 'react';
import { LayoutDashboard, Clock, Calendar } from 'lucide-react';

const EmployeeHeader = ({ activeTab }) => {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'dashboard' && <LayoutDashboard size={24} className="text-indigo-600" />}
                {activeTab === 'attendance' && <Clock size={24} className="text-indigo-600" />}
                {activeTab === 'leaves' && <Calendar size={24} className="text-indigo-600" />}
                {activeTab === 'dashboard' ? 'Overview' : activeTab === 'attendance' ? 'Mark Attendance' : 'Request Leave'}
            </h2>
        </header>
    );
};

export default EmployeeHeader;
