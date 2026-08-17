import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Check, X, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import LeaveDetailModal from '../LeaveDetailModal';
import LeaveConfirmationModal from '../LeaveConfirmationModal';
import { formatDate } from '../../utils/dateUtils';


// ── Mini Calendar Hover Tooltip Component ─────────────────────────────────────
const DurationCalendarTooltip = ({ startDateStr, endDateStr, targetRef }) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Normalize dates to midnight for accurate comparison
    const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const [viewDate, setViewDate] = useState(new Date(sDate.getFullYear(), sDate.getMonth(), 1));
    const [position, setPosition] = useState({ top: 0, left: 0, placeTop: true });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    React.useLayoutEffect(() => {
        if (targetRef && targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const tooltipHeight = 280; // approximate height of mini calendar
            const placeTop = spaceAbove >= tooltipHeight + 10;

            setPosition({
                top: placeTop ? rect.top - tooltipHeight - 8 : rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 276)), // keep within viewport bounds
                placeTop
            });
        }
    }, [targetRef]);

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const calendarCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
        calendarCells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarCells.push(new Date(currentYear, currentMonth, day));
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position.placeTop ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position.placeTop ? 6 : -6 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            className="z-50 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 w-64 text-slate-800 pointer-events-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-indigo-600" />
                    {monthNames[currentMonth]} {currentYear}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center mb-1">
                {daysOfWeek.map((day) => (
                    <span key={day} className="text-[10px] font-bold text-slate-400">
                        {day}
                    </span>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center text-xs">
                {calendarCells.map((cellDate, index) => {
                    if (!cellDate) {
                        return <div key={`empty-${index}`} className="h-7" />;
                    }

                    const isStart = cellDate.getTime() === sDate.getTime();
                    const isEnd = cellDate.getTime() === eDate.getTime();
                    const isInRange = cellDate >= sDate && cellDate <= eDate;

                    let bgClass = "text-slate-600 hover:bg-slate-100 rounded-md font-medium";
                    if (isStart && isEnd) {
                        bgClass = "bg-indigo-600 text-white font-black rounded-md shadow-sm";
                    } else if (isStart) {
                        bgClass = "bg-indigo-600 text-white font-black rounded-l-md shadow-sm";
                    } else if (isEnd) {
                        bgClass = "bg-indigo-600 text-white font-black rounded-r-md shadow-sm";
                    } else if (isInRange) {
                        bgClass = "bg-indigo-50 text-indigo-900 font-bold border-y border-indigo-100/60";
                    }

                    return (
                        <div
                            key={cellDate.toISOString()}
                            className={`h-7 flex items-center justify-center text-xs transition-all ${bgClass}`}
                        >
                            {cellDate.getDate()}
                        </div>
                    );
                })}
            </div>

            {/* Footer Legend */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Leave Duration
                </span>
                <span>
                    {Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1} Days
                </span>
            </div>
        </motion.div>
    );
};

const formatShortDate = (dateInput) => {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Duration Cell Helper Component ────────────────────────────────────────────
const DurationCell = ({ leave, isHovered, onHoverStart, onHoverEnd }) => {
    const targetRef = React.useRef(null);

    return (
        <div 
            ref={targetRef}
            className="inline-block"
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            <span className="flex items-center justify-center gap-1.5 font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors cursor-pointer">
                <CalendarIcon size={14} className="text-indigo-500" />
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
            </span>

            <AnimatePresence>
                {isHovered && (
                    <DurationCalendarTooltip
                        startDateStr={leave.startDate}
                        endDateStr={leave.endDate}
                        targetRef={targetRef}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const HRLeaveManagement = ({ filteredLeaves, handleStatusUpdate, handleDeleteLeave, employees = [], departments = [] }) => {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { leave, action }
    const [hoveredLeaveId, setHoveredLeaveId] = useState(null);

    const truncateReason = (reason) => {
        if (!reason) return '';
        return reason.length > 20 ? reason.substring(0, 20) + '...' : reason;
    };

    const calculateDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const onConfirmAction = async (id, action, remark) => {
        await handleStatusUpdate(id, action, remark);
        setConfirmAction(null);
    };

    return (
        <>
            <motion.div 
                key="leaves"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="table-container"
            >
                <div className="overflow-x-auto">
                    <table className="table-base table-fixed w-full min-w-[900px]">
                        <colgroup>
                            <col className="w-[25%]" />
                            <col className="w-[26%]" />
                            <col className="w-[9%]" />
                            <col className="w-[18%]" />
                            <col className="w-[12%]" />
                            <col className="w-[10%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header">
                                <th className="whitespace-nowrap">Employee</th>
                                <th className="text-center whitespace-nowrap">Duration</th>
                                <th className="text-center whitespace-nowrap">Days</th>
                                <th className="whitespace-nowrap">Reason</th>
                                <th className="whitespace-nowrap">Status</th>
                                <th className="text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {filteredLeaves.map(leave => {
                                const empId = leave.employee?._id || (typeof leave.employee === 'string' ? leave.employee : null);
                                const emp = (empId ? employees.find(e => String(e._id) === String(empId)) : null) || leave.employee || {};

                                const teamName = emp.department || '';
                                
                                // Strict department match: check department document first
                                const deptObj = teamName 
                                    ? departments.find(d => d.name && d.name.toLowerCase() === teamName.toLowerCase()) 
                                    : null;
                                
                                const deptLeadFromDeptObj = deptObj?.teamLead 
                                    ? (typeof deptObj.teamLead === 'object' ? deptObj.teamLead.name : null) 
                                    : null;

                                // Strict department match: check employee registry for a designated isTeamLead in THIS department
                                const deptLeadFromEmpObj = teamName 
                                    ? employees.find(e => 
                                        e.department && 
                                        e.department.toLowerCase() === teamName.toLowerCase() && 
                                        e.isTeamLead && 
                                        String(e._id) !== String(emp._id || empId)
                                      )?.name 
                                    : null;

                                const activeDeptLead = deptLeadFromEmpObj || deptLeadFromDeptObj;

                                const leadName = emp.isTeamLead 
                                    ? 'Team Lead' 
                                    : activeDeptLead
                                        ? activeDeptLead
                                        : (emp.reportingTo && emp.reportingTo.trim() !== '')
                                            ? emp.reportingTo.trim()
                                            : null;

                                const todayDateOnly = new Date();
                                todayDateOnly.setHours(0, 0, 0, 0);
                                const leaveStartDate = new Date(leave.startDate);
                                leaveStartDate.setHours(0, 0, 0, 0);
                                const isPast = leaveStartDate < todayDateOnly;

                                return (
                                    <tr 
                                        key={leave._id} 
                                        className="table-row"
                                        onClick={() => setSelectedLeave(leave)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{emp.name || leave.employee?.name || 'Employee'}</span>
                                                <span className="text-xs text-slate-400">{emp.email || leave.employee?.email || ''}</span>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    {teamName && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold capitalize border border-slate-200">
                                                            Team: {teamName}
                                                        </span>
                                                    )}
                                                    {emp.isTeamLead ? (
                                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100">
                                                            Team Lead
                                                        </span>
                                                    ) : leadName ? (
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                                                            Lead: {leadName}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                    <td className="px-6 py-6 text-slate-600 text-sm whitespace-nowrap text-center">
                                        <div className="flex justify-center w-full">
                                            <DurationCell
                                                leave={leave}
                                                isHovered={hoveredLeaveId === leave._id}
                                                onHoverStart={() => setHoveredLeaveId(leave._id)}
                                                onHoverEnd={() => setHoveredLeaveId(null)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-3 py-1 rounded-xl text-xs font-black shadow-2xs">
                                            {calculateDays(leave.startDate, leave.endDate)} {calculateDays(leave.startDate, leave.endDate) === 1 ? 'Day' : 'Days'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 max-w-[200px]">
                                        <span className="text-slate-600 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group-hover:border-indigo-200 transition-colors inline-block truncate max-w-full">
                                            {leave.reason || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className={`
                                            px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block
                                            ${(leave.status === 'pending' || leave.status === 'pending_hr') ? 'bg-amber-100 text-amber-700' : ''}
                                            ${leave.status === 'pending_team_lead' ? 'bg-indigo-100 text-indigo-700' : ''}
                                            ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                                            ${(leave.status === 'rejected' || leave.status === 'hr_rejected' || leave.status === 'team_lead_rejected') ? 'bg-rose-100 text-rose-700' : ''}
                                        `}>
                                            {leave.status === 'pending_hr' ? 'Pending HR' :
                                             leave.status === 'pending_team_lead' ? 'Pending TL' :
                                             leave.status === 'hr_rejected' ? 'HR Rejected' : 
                                             leave.status === 'team_lead_rejected' ? 'TL Rejected' : 
                                             leave.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2 justify-end items-center">
                                            {!isPast && (
                                                <>
                                                    {(leave.status === 'pending' || leave.status === 'pending_hr') ? (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ leave, action: 'approved' }); }}
                                                                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-colors"
                                                                title="Approve Leave (Send to TL)"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ leave, action: 'rejected' }); }}
                                                                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors"
                                                                title="Reject Leave"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : leave.status === 'pending_team_lead' ? (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ leave, action: 'rejected' }); }}
                                                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                            title="Reject Leave before TL review"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    ) : leave.status === 'approved' ? (
                                                        <button 
                                                            onClick={() => setConfirmAction({ leave, action: 'rejected' })}
                                                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                            title="Change status to Rejected"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setConfirmAction({ leave, action: 'approved' })}
                                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                            title="Change status to Approved"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDeleteLeave && handleDeleteLeave(leave._id)}
                                                className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                                                title="Delete Leave Request"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    {filteredLeaves.length === 0 && (
                        <div className="p-20 text-center text-slate-400">
                            <CalendarCheck size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No leave requests found matching your filter.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <LeaveDetailModal 
                leave={selectedLeave} 
                onClose={() => setSelectedLeave(null)} 
                onStatusUpdate={handleStatusUpdate}
            />

            {confirmAction && (
                <LeaveConfirmationModal 
                    leave={confirmAction.leave}
                    action={confirmAction.action}
                    onConfirm={onConfirmAction}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
};

export default HRLeaveManagement;
