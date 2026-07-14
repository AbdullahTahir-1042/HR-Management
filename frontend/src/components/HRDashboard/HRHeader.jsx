import React from 'react';
import { LayoutDashboard, CalendarCheck, Clock, Search, Calendar, Users, ClipboardList, Building2, BarChart2 } from 'lucide-react';

const HRHeader = ({ 
    activeTab, 
    leaveFilter, 
    setLeaveFilter, 
    attendanceDateFilter, 
    setAttendanceDateFilter, 
    searchTerm, 
    setSearchTerm 
}) => {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'dashboard' && <LayoutDashboard size={24} className="text-indigo-600" />}
                {activeTab === 'employees' && <Users size={24} className="text-indigo-600" />}
                {activeTab === 'leaves' && <CalendarCheck size={24} className="text-indigo-600" />}
                {activeTab === 'attendance' && <ClipboardList size={24} className="text-indigo-600" />}
                {activeTab === 'departments' && <Building2 size={24} className="text-indigo-600" />}
                {activeTab === 'reports' && <BarChart2 size={24} className="text-indigo-600" />}

                {activeTab === 'dashboard' ? 'Overview' 
                : activeTab === 'employees' ? 'Staff Directory' 
                : activeTab === 'leaves' ? 'Leave Requests' 
                : activeTab === 'attendance' ? 'Attendance Master' 
                : activeTab === 'departments' ? 'Departments'      
                : activeTab === 'profile' ? 'My Profile'           
                : activeTab === 'reports' ? 'User Report Center'
                : ''}
            </h2>

            <div className="flex items-center gap-4">
                {/* Search Bar for Employees & Attendance */}
                {(activeTab === 'attendance' || activeTab === 'employees') && (
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'employees' ? "Search employees..." : "Search name or email..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm w-64"
                        />
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setLeaveFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${leaveFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input 
                            type="date" 
                            value={attendanceDateFilter}
                            onChange={(e) => setAttendanceDateFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-100 border border-transparent rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                        />
                        {attendanceDateFilter && (
                            <button onClick={() => setAttendanceDateFilter('')} className="text-xs text-indigo-600 font-bold hover:underline">
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default HRHeader;
