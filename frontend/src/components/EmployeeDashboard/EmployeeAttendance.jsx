import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, LogIn, LogOut, CheckCircle, ClipboardList, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import apiClient from '../../api/axiosClient';


const EmployeeAttendance = ({ user, attendance, history, handleCheckIn, handleCheckOut }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
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

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getLateness = (recordOrDate) => {
        if (!recordOrDate) return null;
        
        let targetDate;
        let expectedTime = new Date();
        
        let h = 9, m = 0, grace = 15;

        if (user?.shiftDetails?.startTime) {
            [h, m] = user.shiftDetails.startTime.split(':').map(Number);
            grace = user.shiftDetails.gracePeriod ?? 0;
        } else if (user?.department?.shiftDetails?.startTime || user?.departmentId?.shiftDetails?.startTime) {
            const deptShift = user.department?.shiftDetails || user.departmentId?.shiftDetails;
            [h, m] = deptShift.startTime.split(':').map(Number);
            grace = deptShift.gracePeriod ?? 0;
        } else if (schedule) {
            [h, m] = (schedule.startTime || '09:00').split(':').map(Number);
            grace = schedule.gracePeriod ?? 15;
        } else if (recordOrDate.expectedCheckIn) {
            [h, m] = recordOrDate.expectedCheckIn.split(':').map(Number);
            grace = 15;
        } else {
            h = 9; m = 45; grace = 0;
        }

        if (recordOrDate.checkIn) {
            targetDate = new Date(recordOrDate.checkIn);
            expectedTime = new Date(recordOrDate.checkIn);
        } else {
            targetDate = recordOrDate;
            expectedTime = new Date(targetDate);
        }

        const cutoffTime = new Date(expectedTime);
        cutoffTime.setHours(h, m + grace, 0, 0);

        if (targetDate > cutoffTime) {
            expectedTime.setHours(h, m, 0, 0);
            const diffMs = targetDate - expectedTime;
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

    let isLate = false;
    let lateStr = null;

    if (!attendance) {
        lateStr = getLateness(currentTime);
        if (lateStr) isLate = true;
    } else {
        lateStr = getLateness(attendance);
        isLate = !!lateStr;
    }

    const localFormatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const currentDay = new Date().getDay();
    const isWorkingDay = schedule?.workingDays ? schedule.workingDays.includes(currentDay) : true;
    const isHoliday = schedule?.isHoliday;
    const holidayName = schedule?.holidayName || 'Holiday';

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
                        <div className="mb-6">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                Today
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-semibold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-lg font-black text-slate-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                        </div>
                        
                        {attendance?.status === 'absent' ? (
                            <div className="text-center py-5 bg-rose-50/80 rounded-xl border border-rose-200/80 shadow-xs">
                                <AlertTriangle size={36} className="text-rose-500 mx-auto mb-2" />
                                <p className="font-black text-slate-800 text-sm mb-1">Marked Absent</p>
                                <p className="text-rose-600 text-[11px] font-bold mb-2">You missed your check-in today.</p>
                                <p className="text-slate-500 text-[10px] px-2">{attendance.reason || 'No check-in'}</p>
                            </div>
                        ) : isHoliday ? (
                            <div className="text-center py-5 bg-purple-50/80 rounded-xl border border-purple-200/80 shadow-xs">
                                <ClipboardList size={36} className="text-purple-500 mx-auto mb-2" />
                                <p className="font-black text-slate-800 text-sm mb-1">Company Holiday</p>
                                <p className="text-purple-600 text-[11px] font-bold mb-2">{holidayName}</p>
                                <p className="text-slate-500 text-[10px] px-2">Enjoy your day off!</p>
                            </div>
                        ) : !isWorkingDay ? (
                            <div className="text-center py-5 bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs">
                                <Clock size={36} className="text-slate-400 mx-auto mb-2" />
                                <p className="font-black text-slate-700 text-sm mb-1">Non-Working Day</p>
                                <p className="text-slate-500 text-[10px] px-2">Check-in is disabled today.</p>
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
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Late</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map(record => {
                                        const recordLate = record.checkIn ? getLateness(record) : null;
                                        const isRecordLate = !!recordLate;
                                        const workStatus = record.checkIn && record.checkOut ? getWorkStatus(record) : null;
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
                                                <td className="px-4 py-3.5 text-center">
                                                    {workStatus ? (
                                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                                            workStatus.type === 'overtime' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' :
                                                            workStatus.type === 'short' ? 'bg-amber-50 text-amber-600 border-amber-200/60' :
                                                            'bg-slate-50 text-slate-500 border-slate-200/60'
                                                        }`}>
                                                            {workStatus.text}
                                                        </span>
                                                    ) : '-'}
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
