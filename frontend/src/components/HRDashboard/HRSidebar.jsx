import { ShieldCheck, CalendarCheck, Clock, LogOut, LayoutDashboard,Calendar,Bell, User } from 'lucide-react';

const HRSidebar = ({ activeTab, setActiveTab, user, logout }) => {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                    <ShieldCheck size={24} />
                </div>
                <span className="font-bold text-lg text-slate-800 tracking-tight">HR Admin</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 mt-4">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-sm">Dashboard</span>
                </button>
                <button 
                    onClick={() => setActiveTab('employees')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'employees' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <User size={20} />
                    <span className="text-sm">Employees</span>
                </button>
                <button 
                    onClick={() => setActiveTab('leaves')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'leaves' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <CalendarCheck size={20} />
                    <span className="text-sm">Leave Requests</span>
                </button>

                <button 
                    onClick={() => setActiveTab('latecomers')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'latecomers' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <Clock size={20} />
                    <span className="text-sm">Late Comers</span>
                </button>


                <button 
                    onClick={() => setActiveTab('attendance')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <Calendar size={20} />
                    <span className="text-sm">Attendance</span>
                </button>
                <button 
                    onClick={() => setActiveTab('announcements')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'announcements' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <Bell size={20} />
                    <span className="text-sm">Announcements</span>
                </button>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div 
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user?.name?.[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">View Profile</p>
                    </div>
                </div>
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default HRSidebar;
