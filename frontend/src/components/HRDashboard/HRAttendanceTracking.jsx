import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const HRAttendanceTracking = ({ filteredAttendance, searchTerm }) => {
    const sortedAttendance = [...filteredAttendance]
        .filter(record => record.employee?.role !== 'admin' && record.employee?.role !== 'hr')
        .sort((a, b) => {
            const dateA = a.checkIn ? new Date(a.checkIn) : new Date(a.date);
            const dateB = b.checkIn ? new Date(b.checkIn) : new Date(b.date);
            return dateB - dateA;
        });

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
                            <th className="table-cell px-8 py-4">Employee</th>
                            <th className="table-cell px-8 py-4">Date</th>
                            <th className="table-cell px-8 py-4 text-emerald-600">Check In</th>
                            <th className="table-cell px-8 py-4 text-amber-600">Check Out</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {sortedAttendance.map(record => {
                            const late = record.checkIn ? (() => {
                                const shiftStart = new Date(record.checkIn);
                                shiftStart.setHours(9, 45, 0, 0);
                                return new Date(record.checkIn) > shiftStart;
                            })() : false;
                            return (
                            <tr key={record._id} className="table-row">
                                <td className="table-cell px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{record.employee?.name}</span>
                                        <span className="text-xs text-slate-400">{record.employee?.email}</span>
                                    </div>
                                </td>
                                <td className="table-cell px-8 py-6 text-slate-600 dark:text-slate-400 text-sm">{record.date}</td>
                                <td className="table-cell px-8 py-6">
                                    <div className={`flex items-center gap-2 font-medium ${late ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {record.status === 'absent' || !record.checkIn ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md text-xs">Absent</span>
                                        ) : (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${late ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell px-8 py-6">
                                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                                        {record.status === 'absent' || !record.checkIn ? (
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[150px] truncate block" title={record.reason}>{record.reason || 'No check-in'}</span>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </>
                                        )}
                                    </div>
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
