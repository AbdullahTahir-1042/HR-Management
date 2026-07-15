
import { motion } from 'framer-motion';
import { Clock, LogIn, LogOut, CheckCircle, ClipboardList } from 'lucide-react';

const EmployeeAttendance = ({ attendance, history, handleCheckIn, handleCheckOut }) => {
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Action Card - Now smaller (col-span-1 of 4) */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-600" /> Daily Attendance
                        </h3>
                        
                        {!attendance ? (
                            <button onClick={handleCheckIn} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                                <LogIn size={16} /> Check In
                            </button>
                        ) : !attendance.checkOut ? (
                            <div className="space-y-3">
                                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-wider">Arrival</p>
                                    <p className="text-lg font-bold text-slate-800">{new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button onClick={handleCheckOut} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                                    <LogOut size={16} /> Check Out
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-1" />
                                <p className="font-bold text-slate-800 text-sm">Done!</p>
                                <p className="text-slate-500 text-[10px]">Checked out today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Table - Now larger (col-span-3 of 4) */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-800">Attendance History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Check In</th>
                                        <th className="px-6 py-4">Check Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map(record => (
                                        <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-700 font-medium text-sm">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    No attendance history found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EmployeeAttendance;
