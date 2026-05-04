import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const HRAttendanceTracking = ({ filteredAttendance, searchTerm }) => {
    return (
        <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-[0.1em]">
                            <th className="px-8 py-4">Employee</th>
                            <th className="px-8 py-4">Date</th>
                            <th className="px-8 py-4 text-emerald-600">Check In</th>
                            <th className="px-8 py-4 text-amber-600">Check Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAttendance.map(record => (
                            <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{record.employee?.name}</span>
                                        <span className="text-xs text-slate-400">{record.employee?.email}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-600 text-sm">{record.date}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
