import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

const HRAttendanceTracking = ({ filteredAttendance, searchTerm }) => {
    const sortedAttendance = [...filteredAttendance]
        .filter(record => record.employee?.role !== 'admin' && record.employee?.role !== 'hr')
        .sort((a, b) => {
            const dateA = a.checkIn ? new Date(a.checkIn) : new Date(a.date);
            const dateB = b.checkIn ? new Date(b.checkIn) : new Date(b.date);
            return dateB - dateA;
        });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatDuration = (record) => {
        if (!record.checkIn) return '-';
        const checkIn = new Date(record.checkIn);
        let end;
        let isActive = false;
        
        if (record.checkOut) {
            end = new Date(record.checkOut);
        } else {
            const isToday = record.date === new Date().toISOString().split('T')[0];
            if (isToday) {
                end = new Date();
                isActive = true;
            } else {
                return <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-wider">Missing Check-out</span>;
            }
        }
        
        const diffMs = Math.max(0, end - checkIn);
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return (
            <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{diffHrs}H {diffMins}M</span>
                {isActive && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wider animate-pulse">Active</span>}
            </div>
        );
    };

    const renderStatus = (record) => {
        if (record.status === 'absent' || !record.checkIn) {
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />Absent</span>;
        }
        if (record.status === 'late') {
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />Late</span>;
        }
        return <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider w-fit">Present</span>;
    };

    return (
        <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="table-container"
        >
            <div className="overflow-x-auto">
                <table className="table-base">
                    <thead>
                        <tr className="table-header">
                            <th className="table-cell px-6 py-4">Employee</th>
                            <th className="table-cell px-6 py-4">Date</th>
                            <th className="table-cell px-6 py-4 text-emerald-600">Check In</th>
                            <th className="table-cell px-6 py-4 text-amber-600">Check Out</th>
                            <th className="table-cell px-6 py-4">Time Worked</th>
                            <th className="table-cell px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {sortedAttendance.map(record => {
                            const isLate = record.status === 'late';
                            return (
                            <tr key={record._id} className={`table-row transition-colors ${isLate ? 'bg-rose-50/30 hover:bg-rose-50/50 dark:bg-rose-900/10 dark:hover:bg-rose-900/20' : ''}`}>
                                <td className="table-cell px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${isLate ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {record.employee?.name}
                                        </span>
                                        <span className={`text-xs ${isLate ? 'text-rose-500/70 dark:text-rose-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {record.employee?.email}
                                        </span>
                                    </div>
                                </td>
                                <td className="table-cell px-6 py-5">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                        <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                        {formatDate(record.date)}
                                    </span>
                                </td>
                                <td className="table-cell px-6 py-5">
                                    <div className={`flex items-center gap-2 font-medium ${isLate ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {record.status === 'absent' || !record.checkIn ? (
                                            <span className="text-slate-400">-</span>
                                        ) : (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${isLate ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell px-6 py-5">
                                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                                        {record.status === 'absent' || !record.checkIn ? (
                                            <span className="text-slate-400">-</span>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell px-6 py-5">
                                    {formatDuration(record)}
                                </td>
                                <td className="table-cell px-6 py-5">
                                    {renderStatus(record)}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                {filteredAttendance.length === 0 && (
                    <div className="p-20 text-center text-slate-400">
                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No attendance records found for "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default HRAttendanceTracking;
