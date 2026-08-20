import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import apiClient from '../../api/axiosClient';

const HRAttendanceTracking = ({ filteredAttendance, searchTerm, leaves = [] }) => {
    const [schedule, setSchedule] = useState(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await apiClient.get('/office-schedule/today');
                if (res.data) setSchedule(res.data);
            } catch (err) {
                console.error("Failed to fetch schedule", err);
            }
        };
        fetchSchedule();
    }, []);

    const sortedAttendance = [...filteredAttendance]
        .filter(record => record.employee?.role !== 'admin' && record.employee?.role !== 'hr')
        .sort((a, b) => {
            const dateA = a.checkIn ? new Date(a.checkIn) : new Date(a.date);
            const dateB = b.checkIn ? new Date(b.checkIn) : new Date(b.date);
            return dateB - dateA;
        });

    const localFormatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const getLateness = (record) => {
        if (!record || !record.checkIn) return null;
        
        const checkInTime = new Date(record.checkIn);
        let h = 9, m = 0, grace = 15;

        // Try to get current shift details from the populated employee data
        const emp = record.employee;

        if (emp?.shiftDetails?.startTime) {
            [h, m] = emp.shiftDetails.startTime.split(':').map(Number);
            grace = emp.shiftDetails.gracePeriod ?? 0;
        } else if (emp?.departmentId?.shiftDetails?.startTime) {
            [h, m] = emp.departmentId.shiftDetails.startTime.split(':').map(Number);
            grace = emp.departmentId.shiftDetails.gracePeriod ?? 0;
        } else if (schedule) {
            [h, m] = (schedule.startTime || '09:00').split(':').map(Number);
            grace = schedule.gracePeriod ?? 15;
        } else if (record.expectedCheckIn) {
            [h, m] = record.expectedCheckIn.split(':').map(Number);
            grace = 15; // default global grace
        } else {
            h = 9; m = 45; grace = 0;
        }

        const cutoffTime = new Date(record.checkIn);
        cutoffTime.setHours(h, m + grace, 0, 0);

        if (checkInTime > cutoffTime) {
            const expectedTime = new Date(record.checkIn);
            expectedTime.setHours(h, m, 0, 0);
            const diffMs = checkInTime - expectedTime;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
        return null;
    };


    const getWorkStatus = (record) => {
        if (!record || !record.checkIn || !record.checkOut) return null;
        const inTime = new Date(record.checkIn);
        const outTime = new Date(record.checkOut);
        const diffMs = outTime - inTime;
        if (diffMs <= 0) return null;
        
        const diffMins = Math.floor(diffMs / 60000);
        
        let expectedStart = '09:00';
        let expectedEnd = '18:00';
        
        if (record.expectedCheckIn && record.expectedCheckOut) {
            expectedStart = record.expectedCheckIn;
            expectedEnd = record.expectedCheckOut;
        } else if (schedule) {
            expectedStart = schedule.startTime || '09:00';
            expectedEnd = schedule.endTime || '18:00';
        } else {
            return null;
        }
        
        const [startH, startM] = expectedStart.split(':').map(Number);
        const [endH, endM] = expectedEnd.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        const standardMins = endTotal > startTotal ? endTotal - startTotal : 9 * 60;
        
        if (diffMins > standardMins) {
            const overMins = diffMins - standardMins;
            const h = Math.floor(overMins / 60);
            const m = overMins % 60;
            return { type: 'overtime', text: `+${h}h ${m}m Overtime` };
        } else if (diffMins < standardMins) {
            const shortMins = standardMins - diffMins;
            const h = Math.floor(shortMins / 60);
            const m = shortMins % 60;
            return { type: 'short', text: `-${h}h ${m}m Short` };
        }
        const exactH = Math.floor(standardMins / 60);
        return { type: 'exact', text: `Exact ${exactH}h` };
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
        
        const recordLate = getLateness(record);
        if (record.status === 'late' || recordLate) {
            let lateText = recordLate ? `Late (${recordLate})` : 'Late';
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />{lateText}</span>;
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
                            <th className="table-cell px-6 py-4">Work Status</th>
                            <th className="table-cell px-6 py-4">Late Status</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {sortedAttendance.map(record => {
                            const recordLate = getLateness(record);
                            const isLate = record.status === 'late' || !!recordLate;
                            const workStatus = record.checkIn && record.checkOut ? getWorkStatus(record.checkIn, record.checkOut) : null;
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
                                    <div className={`flex items-center gap-2 font-medium ${isLate ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
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
                                    <div className="flex flex-col gap-1 w-fit">
                                        {formatDuration(record)}
                                        {leaves.some(l => 
                                            l.status === 'approved' && 
                                            l.isHalfDay && 
                                            String(l.employee?._id || l.employee) === String(record.employee?._id || record.employee) &&
                                            record.date >= l.startDate && 
                                            record.date <= l.endDate
                                        ) && (
                                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider w-fit">
                                                Half Day Leave
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell px-6 py-5">
                                    {workStatus ? (
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                            workStatus.type === 'overtime' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20' :
                                            workStatus.type === 'short' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200/60 dark:border-amber-500/20' :
                                            'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-500/20'
                                        }`}>
                                            {workStatus.text}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
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
