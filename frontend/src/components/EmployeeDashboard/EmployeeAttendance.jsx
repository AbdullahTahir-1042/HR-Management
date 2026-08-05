import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, LogIn, LogOut, CheckCircle, ClipboardList, AlertTriangle } from 'lucide-react';

const EmployeeAttendance = ({ attendance, history, handleCheckIn, handleCheckOut }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getLateness = (dateObj) => {
        if (!dateObj) return null;
        const shiftStart = new Date(dateObj);
        shiftStart.setHours(9, 45, 0, 0); // 9:45 AM cutoff
        
        if (dateObj > shiftStart) {
            const diffMs = dateObj - shiftStart;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
        return null;
    };

    const getTotalTimeWorked = (checkInStr, checkOutStr) => {
        if (!checkInStr || !checkOutStr) return '-';
        const inTime = new Date(checkInStr);
        const outTime = new Date(checkOutStr);
        const diffMs = outTime - inTime;
        if (diffMs <= 0) return '-';
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    let isLate = false;
    let lateStr = null;

    if (!attendance) {
        lateStr = getLateness(currentTime);
        if (lateStr) isLate = true;
    } else {
        const checkInTime = new Date(attendance.checkIn);
        const checkInTimeOnly = new Date();
        checkInTimeOnly.setHours(checkInTime.getHours(), checkInTime.getMinutes(), checkInTime.getSeconds(), 0);
        lateStr = getLateness(checkInTimeOnly);
        if (lateStr) isLate = true;
    }

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
                {/* Action Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-600" /> Daily Attendance
                        </h3>
                        
                        {attendance && attendance.status === 'absent' ? (
                            <div className="text-center py-5 bg-rose-50/80 rounded-xl border border-rose-200/80 shadow-xs">
                                <AlertTriangle size={36} className="text-rose-500 mx-auto mb-2" />
                                <p className="font-black text-slate-800 text-sm mb-1">Marked Absent</p>
                                <p className="text-rose-600 text-[11px] font-bold mb-2">You missed your check-in today.</p>
                                <p className="text-slate-500 text-[10px] px-2">{attendance.reason || 'No check-in'}</p>
                            </div>
                        ) : !attendance ? (
                            <div className="space-y-4">
                                {isLate && (
                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 shadow-xs">
                                        <p className="text-amber-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                            <AlertTriangle size={14} className="text-amber-600 shrink-0" /> Late Arrival
                                        </p>
                                        <p className="text-amber-700 text-xs font-semibold">
                                            {lateStr} late. Please compensate.
                                        </p>
                                    </div>
                                )}
                                <button onClick={handleCheckIn} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <LogIn size={16} /> Check In
                                </button>
                            </div>
                        ) : !attendance.checkOut ? (
                            <div className="space-y-3">
                                {isLate && (
                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 shadow-xs mb-1">
                                        <p className="text-amber-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                            <AlertTriangle size={14} className="text-amber-600 shrink-0" /> Late Arrival
                                        </p>
                                        <p className="text-amber-700 text-xs font-semibold">
                                            {lateStr} late. Compensate today.
                                        </p>
                                    </div>
                                )}
                                <div className="bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-100">
                                    <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-wider">Arrival Time</p>
                                    <p className="text-lg font-black text-slate-800">{new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button onClick={handleCheckOut} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <LogOut size={16} /> Check Out
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-xs">
                                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-1" />
                                <p className="font-bold text-slate-800 text-sm">Done!</p>
                                <p className="text-slate-500 text-[10px]">Checked out today.</p>
                                {isLate && (
                                    <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-left shadow-xs">
                                        <p className="text-amber-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                            <AlertTriangle size={14} className="text-amber-600 shrink-0" /> Late Arrival
                                        </p>
                                        <p className="text-amber-700 text-xs font-semibold">
                                            You checked in {lateStr} late today.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                <ClipboardList size={18} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Attendance History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Check In</th>
                                        <th className="px-4 py-3">Check Out</th>
                                        <th className="px-4 py-3 text-center">Work HRS</th>
                                        <th className="px-4 py-3 text-right">Late</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map(record => {
                                        const recordLate = record.checkIn ? getLateness(new Date(record.checkIn)) : null;
                                        return (
                                             <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3.5 text-slate-700 font-medium text-sm">
                                                    {formatDate(record.date)}
                                                </td>
                                                <td className={`px-4 py-3.5 text-sm ${recordLate ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                    {record.status === 'absent' || !record.checkIn ? (
                                                        <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-md text-xs inline-block">Absent</span>
                                                    ) : record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-600 text-sm">
                                                    {record.status === 'absent' || !record.checkIn ? (
                                                        <span className="text-[11px] text-slate-400 max-w-[150px] truncate block" title={record.reason}>{record.reason || 'No check-in'}</span>
                                                    ) : record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-600 text-sm text-center font-medium">
                                                    {record.status === 'absent' || !record.checkIn ? '-' : getTotalTimeWorked(record.checkIn, record.checkOut)}
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-right">
                                                    {recordLate ? (
                                                        <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-md text-xs inline-block">{recordLate}</span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {history.length === 0 && (
                                <div className="p-12 text-center text-slate-400 font-medium text-sm">
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
