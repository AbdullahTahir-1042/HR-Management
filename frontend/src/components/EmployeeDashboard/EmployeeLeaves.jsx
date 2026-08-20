import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Send, ClipboardList, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Lock, AlertCircle, ChevronDown } from 'lucide-react';
import LeaveDetailModal from '../LeaveDetailModal';

const getLeaveTypeId = (leaveType) => {
    if (!leaveType) return '';
    if (typeof leaveType === 'object') return String(leaveType._id || leaveType.id || '');
    return String(leaveType);
};

const LeaveTypeSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full mt-1.5" ref={ref}>
            <div
                className={`w-full p-3 bg-slate-50 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'} rounded-xl cursor-pointer flex justify-between items-center transition-all text-sm font-medium text-slate-700`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-slate-700' : 'text-slate-400'}>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${value === opt.value ? 'bg-indigo-50/50 text-indigo-600' : 'text-slate-600'}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const EmployeeLeaves = ({ user, leaveForm, setLeaveForm, handleApplyLeave, leaves, statusFilter, setStatusFilter, leaveBalances = [], leaveTypes = [], onRefresh }) => {
    const [selectedLeave, setSelectedLeave] = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const calculateDays = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.abs(e - s);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const truncateReason = (reason = '') => {
        return reason.length > 20 ? reason.substring(0, 20) + '...' : reason;
    };

    const getDatesInRange = (startDateStr, endDateStr) => {
        if (!startDateStr || !endDateStr) return [];
        const dates = [];
        const curr = new Date(startDateStr + 'T00:00:00');
        const last = new Date(endDateStr + 'T00:00:00');
        while (curr <= last) {
            const year = curr.getFullYear();
            const month = String(curr.getMonth() + 1).padStart(2, '0');
            const day = String(curr.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    // Map of all currently booked/pending dates for this employee
    const bookedDatesMap = React.useMemo(() => {
        const map = new Map();
        if (!leaves || !Array.isArray(leaves)) return map;

        leaves.forEach(l => {
            if (!l.startDate || !l.endDate) return;
            const lStart = String(l.startDate).slice(0, 10);
            const lEnd = String(l.endDate).slice(0, 10);
            const dateList = getDatesInRange(lStart, lEnd);
            dateList.forEach(d => {
                // If a date already has an approved leave, don't overwrite with rejected
                if (!map.has(d) || l.status === 'approved') {
                    map.set(d, l);
                }
            });
        });
        return map;
    }, [leaves]);

    const filteredLeavesForTable = React.useMemo(() => {
        if (!leaves || !Array.isArray(leaves)) return [];
        return leaves.filter(l => statusFilter === 'all' ? true : l.status === statusFilter);
    }, [leaves, statusFilter]);

    const [viewMonth, setViewMonth] = useState(() => new Date());
    const [showVisualCalendar, setShowVisualCalendar] = useState(true);

    const calendarGrid = React.useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startingDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= totalDays; d++) {
            const yyyy = year;
            const mm = String(month + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            days.push({ dayNumber: d, dateStr });
        }

        return {
            year,
            month,
            days,
            monthName: firstDay.toLocaleString('default', { month: 'long' })
        };
    }, [viewMonth]);

    const todayStr = React.useMemo(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const handleCalendarDayClick = (dateStr) => {
        if (dateStr < todayStr) return; // Block past date selection

        if (leaveForm.isHalfDay) {
            setLeaveForm(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
            return;
        }

        if (!leaveForm.startDate || (leaveForm.startDate && leaveForm.endDate)) {
            setLeaveForm(prev => ({ ...prev, startDate: dateStr, endDate: '' }));
        } else {
            if (dateStr >= leaveForm.startDate) {
                setLeaveForm(prev => ({ ...prev, endDate: dateStr }));
            } else {
                setLeaveForm(prev => ({ ...prev, startDate: dateStr, endDate: '' }));
            }
        }
    };

    const handlePrevMonth = (e) => {
        e.preventDefault();
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.preventDefault();
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const deductionPreview = React.useMemo(() => {
        if (!leaveForm.startDate || !leaveForm.endDate || (!leaveForm.leaveTypeId && !leaveForm.isHalfDay)) return null;
        const s = new Date(leaveForm.startDate + 'T00:00:00');
        const e = new Date(leaveForm.endDate + 'T00:00:00');
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null;

        const requestedDates = getDatesInRange(leaveForm.startDate, leaveForm.endDate);

        // Separate overlapping vs net new dates
        const overlappingDates = [];
        const netNewDates = [];
        const conflictingLeavesSet = new Set();

        requestedDates.forEach(d => {
            if (bookedDatesMap.has(d)) {
                overlappingDates.push(d);
                conflictingLeavesSet.add(bookedDatesMap.get(d));
            } else {
                netNewDates.push(d);
            }
        });

        let overlapCount = overlappingDates.length;
        let netDuration = netNewDates.length;
        let totalDuration = requestedDates.length;

        if (leaveForm.isHalfDay) {
            totalDuration = 0.5;
            netDuration = 0.5;
            if (overlappingDates.length > 0) {
                overlapCount = 0.5;
                netDuration = 0;
            }
        }

        // 1. Get balance or fallback to calculate from leaves array
        let remaining = 0;
        let allocated = 12;
        let lTypeObj = null;

        if (leaveForm.isHalfDay) {
            remaining = 999;
            allocated = 999;
        } else {
            const typeIdStr = String(leaveForm.leaveTypeId);
            const bal = leaveBalances.find(b => getLeaveTypeId(b.leaveType) === typeIdStr);

            lTypeObj = leaveTypes.find(t => String(t._id || t.id || '') === typeIdStr);

            if (bal !== undefined) {
                remaining = bal.remaining ?? 0;
                allocated = bal.allocated ?? 12;
            } else {
                allocated = Number(lTypeObj?.quota || lTypeObj?.maxDays) || 12;

                // Calculate approved and pending used days from leaves list
                const usedDays = leaves
                    .filter(l => getLeaveTypeId(l.leaveType) === typeIdStr && ['approved', 'pending_hr', 'pending_team_lead'].includes(l.status))
                    .reduce((acc, l) => {
                        const ls = String(l.startDate).slice(0, 10);
                        const le = String(l.endDate).slice(0, 10);
                        return acc + (l.isHalfDay ? 0.5 : getDatesInRange(ls, le).length);
                    }, 0);

                remaining = Math.max(0, allocated - usedDays);
            }
        }

        const maxConsecutiveDays = Number(lTypeObj?.maxConsecutiveDays) || 0;
        const exceedsMaxConsecutive = maxConsecutiveDays > 0 && netDuration > maxConsecutiveDays;
        
        // Calculate Global Leaves for the CURRENT YEAR
        const GLOBAL_MAX_LEAVES = 24;
        const isExemptFromGlobal = ['Maternity Leave', 'Paternity Leave', 'Unpaid Leave'].includes(lTypeObj?.name);
        
        let globalUsed = 0;
        const currentYear = new Date().getFullYear();
        
        leaves.forEach(l => {
            const lType = leaveTypes.find(t => String(t._id || t.id) === String(l.leaveType?._id || l.leaveType));
            if (lType && !['Maternity Leave', 'Paternity Leave', 'Unpaid Leave'].includes(lType.name) && ['approved', 'pending_hr', 'pending_team_lead'].includes(l.status)) {
                const leaveYear = new Date(l.startDate).getFullYear();
                if (leaveYear === currentYear) {
                    const ls = String(l.startDate).slice(0, 10);
                    const le = String(l.endDate).slice(0, 10);
                    globalUsed += l.isHalfDay ? 0.5 : getDatesInRange(ls, le).length;
                }
            }
        });

        const exceedsGlobalLimit = !isExemptFromGlobal && (globalUsed + netDuration > GLOBAL_MAX_LEAVES);

        const isUnpaid = lTypeObj?.name === 'Unpaid Leave';
        const excessDays = Math.max(0, netDuration - remaining);
        const isFullyBooked = netDuration === 0 || exceedsMaxConsecutive || excessDays > 0 || exceedsGlobalLimit;

        return {
            totalDuration,
            overlapCount,
            netDuration,
            overlappingDates,
            conflictingLeaves: Array.from(conflictingLeavesSet),
            remaining,
            allocated,
            excessDays,
            isFullyBooked,
            exceedsMaxConsecutive,
            maxConsecutiveDays,
            isUnpaid,
            exceedsGlobalLimit,
            globalUsed,
            GLOBAL_MAX_LEAVES
        };
    }, [leaveForm.startDate, leaveForm.endDate, leaveForm.leaveTypeId, bookedDatesMap, leaveBalances, leaveTypes, leaves, user?.salary]);

    return (
        <>
            <motion.div
                key="leaves"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
            >
                {/* Leave Balances Grid */}
                {leaveBalances.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                        {leaveBalances.map(b => {
                            const usedPercent = b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0;
                            return (
                                <div key={b.leaveType?._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1 rounded-lg">
                                            {b.leaveType?.name}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-md">
                                            {b.used} {b.used === 1 ? 'Day Used' : 'Days Used'}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{b.remaining} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Days Left</span></p>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total: {b.allocated} Days</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${usedPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                                                    }`}
                                                style={{ width: `${usedPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {/* Apply Leave Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                            <h3 className="text-lg font-bold text-slate-800 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                                <Calendar size={20} className="text-indigo-600" />
                                <span>Request Leave</span>
                            </h3>
                            <form onSubmit={handleApplyLeave} className="flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    {!leaveForm.isHalfDay && (
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">Leave Type</label>
                                            <LeaveTypeSelect
                                                value={leaveForm.leaveTypeId || ''}
                                                onChange={(val) => setLeaveForm({ ...leaveForm, leaveTypeId: val })}
                                                options={leaveTypes.map(t => {
                                                    const typeId = String(t._id || t.id || '');
                                                    const balance = leaveBalances.find(b => getLeaveTypeId(b.leaveType) === typeId);
                                                    const remaining = balance !== undefined ? balance.remaining : t.quota;
                                                    return {
                                                        value: typeId,
                                                        label: `${t.name} (${remaining} ${remaining === 1 ? 'day left' : 'days left'})`
                                                    };
                                                })}
                                                placeholder="Select Type"
                                            />
                                            
                                            {/* Policy Hint Display */}
                                            {(() => {
                                                if (!leaveForm.leaveTypeId) return null;
                                            const selectedType = leaveTypes.find(t => String(t._id || t.id || '') === leaveForm.leaveTypeId);
                                            if (!selectedType) return null;
                                            const hasMax = selectedType.maxConsecutiveDays > 0;
                                            const hasCooldown = selectedType.cooldownDays > 0;
                                            if (!hasMax && !hasCooldown) return null;
                                            return (
                                                <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
                                                    <div className="p-1 bg-indigo-100 rounded-md">
                                                        <AlertCircle size={14} className="text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-indigo-900 leading-tight mb-0.5">Leave Policy Rules</p>
                                                        <ul className="text-[10px] font-semibold text-indigo-700 space-y-0.5 list-disc pl-3">
                                                            {hasMax && <li>Max <strong>{selectedType.maxConsecutiveDays}</strong> consecutive days allowed per request.</li>}
                                                            {hasCooldown && <li><strong>{selectedType.cooldownDays} days</strong> cooldown period between requests.</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        </div>
                                    )}

                                    {/* Start & End Date Status Cards */}
                                    
                                    <div className="flex items-center gap-2 px-1">
                                        <input 
                                            type="checkbox" 
                                            id="half-day-leave"
                                            checked={leaveForm.isHalfDay || false}
                                            onChange={(e) => {
                                                const isHalfDay = e.target.checked;
                                                setLeaveForm(prev => ({ 
                                                    ...prev, 
                                                    isHalfDay,
                                                    halfDayPeriod: isHalfDay ? 'First Half' : '',
                                                    endDate: (isHalfDay && prev.startDate) ? prev.startDate : prev.endDate
                                                }));
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500/20"
                                        />
                                        <label htmlFor="half-day-leave" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                                            Request Half Day / Early Leave
                                        </label>
                                    </div>
                                    
                                    {leaveForm.isHalfDay && (
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="halfDayPeriod" 
                                                    value="First Half" 
                                                    checked={leaveForm.halfDayPeriod === 'First Half'}
                                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, halfDayPeriod: e.target.value }))}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                First Half (Morning)
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="halfDayPeriod" 
                                                    value="Second Half" 
                                                    checked={leaveForm.halfDayPeriod === 'Second Half'}
                                                    onChange={(e) => setLeaveForm(prev => ({ ...prev, halfDayPeriod: e.target.value }))}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                Second Half (Early Check-out)
                                            </label>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider flex items-center justify-between mb-1.5">
                                            <span>Duration (Start to End)</span>
                                            {(leaveForm.startDate || leaveForm.endDate) && (
                                                <span className="text-[9px] font-extrabold text-indigo-600">Selected</span>
                                            )}
                                        </label>
                                        <DatePicker
                                            selectsRange={!leaveForm.isHalfDay}
                                            selected={leaveForm.isHalfDay && leaveForm.startDate ? new Date(leaveForm.startDate) : null}
                                            startDate={leaveForm.startDate ? new Date(leaveForm.startDate) : null}
                                            endDate={leaveForm.endDate ? new Date(leaveForm.endDate) : null}
                                            onChange={(update) => {
                                                const parseDate = (d) => {
                                                    if (!d) return '';
                                                    const offset = d.getTimezoneOffset() * 60000;
                                                    return new Date(d.getTime() - offset).toISOString().split('T')[0];
                                                };
                                                
                                                if (leaveForm.isHalfDay) {
                                                    const dateStr = parseDate(update);
                                                    setLeaveForm(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
                                                } else {
                                                    const [start, end] = update;
                                                    setLeaveForm(prev => ({ 
                                                        ...prev, 
                                                        startDate: parseDate(start), 
                                                        endDate: parseDate(end) 
                                                    }));
                                                }
                                            }}
                                            dateFormat="yyyy-MM-dd"
                                            isClearable={true}
                                            placeholderText={leaveForm.isHalfDay ? "Select date" : "Select date range"}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 cursor-pointer"
                                            wrapperClassName="w-full"
                                            minDate={new Date()}
                                        />
                                    </div>

                                    {/* Expandable/Collapsible Visual Calendar Switch & Clear Button */}
                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowVisualCalendar(!showVisualCalendar)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Calendar size={14} />
                                            <span>{showVisualCalendar ? 'Hide Visual Calendar' : 'Show Interactive Visual Calendar'}</span>
                                        </button>
                                        {(leaveForm.startDate || leaveForm.endDate) && (
                                            <button
                                                type="button"
                                                onClick={() => setLeaveForm(prev => ({ ...prev, startDate: '', endDate: '' }))}
                                                className="text-[11px] font-bold text-rose-500 hover:text-rose-700 underline cursor-pointer"
                                            >
                                                Clear Dates
                                            </button>
                                        )}
                                    </div>

                                    {/* ── INTERACTIVE VISUAL CALENDAR PICKER ── */}
                                    {showVisualCalendar && (
                                        <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-indigo-600" />
                                                    <span>{calendarGrid.monthName} {calendarGrid.year}</span>
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={handlePrevMonth}
                                                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
                                                        title="Previous Month"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleNextMonth}
                                                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
                                                        title="Next Month"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Instructions Banner */}
                                            <p className="text-[10px] text-slate-500 font-semibold bg-white p-2 rounded-lg border border-slate-200/60">
                                                👉 <strong>Click any day</strong> for Start Date, then <strong>click a second day</strong> for End Date. Leave dates are color-coded: <span className="text-emerald-600 font-bold">green</span> = approved, <span className="text-amber-600 font-bold">yellow</span> = pending, <span className="text-rose-600 font-bold">red</span> = rejected.
                                            </p>

                                            {/* Calendar Weekday Headers */}
                                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase">
                                                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                            </div>

                                            {/* Calendar Days Grid */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {calendarGrid.days.map((item, idx) => {
                                                    if (!item) {
                                                        return <div key={`pad-${idx}`} className="h-7" />;
                                                    }

                                                    const { dayNumber, dateStr } = item;
                                                    const isPast = dateStr < todayStr;
                                                    const isBooked = bookedDatesMap.has(dateStr);
                                                    const bookedLeaveObj = isBooked ? bookedDatesMap.get(dateStr) : null;

                                                    const isStart = leaveForm.startDate === dateStr;
                                                    const isEnd = leaveForm.endDate === dateStr;
                                                    const isInSelectedRange = leaveForm.startDate && leaveForm.endDate && dateStr >= leaveForm.startDate && dateStr <= leaveForm.endDate;

                                                    const isConflict = isBooked && isInSelectedRange;

                                                    // Determine booked leave status color
                                                    const bookedStatus = bookedLeaveObj?.status || '';
                                                    const isApproved = bookedStatus === 'approved';
                                                    const isRejected = bookedStatus === 'rejected' || bookedStatus === 'hr_rejected';

                                                    let btnStyle = "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 border border-slate-200/80 dark:border-slate-700 cursor-pointer";

                                                    if (isPast) {
                                                        btnStyle = "bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-default opacity-50";
                                                    } else if (isConflict) {
                                                        btnStyle = "bg-rose-500 text-white font-black ring-2 ring-rose-300 dark:ring-rose-500/50 animate-pulse cursor-pointer";
                                                    } else if (isStart || isEnd) {
                                                        btnStyle = "bg-indigo-600 text-white font-black shadow-md ring-2 ring-indigo-400 dark:ring-indigo-500/50 cursor-pointer";
                                                    } else if (isInSelectedRange) {
                                                        btnStyle = "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-300 font-bold border-t border-b border-indigo-200 dark:border-indigo-800/50 cursor-pointer";
                                                    } else if (isBooked && isApproved) {
                                                        btnStyle = "bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-extrabold opacity-95 cursor-default";
                                                    } else if (isBooked && isRejected) {
                                                        btnStyle = "bg-rose-100/90 dark:bg-rose-900/40 text-rose-900 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60 font-extrabold opacity-95 cursor-default";
                                                    } else if (isBooked) {
                                                        // Pending (pending_hr, pending_team_lead)
                                                        btnStyle = "bg-amber-100/90 dark:bg-amber-900/40 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 font-extrabold opacity-95 cursor-default";
                                                    }

                                                    return (
                                                        <button
                                                            key={dateStr}
                                                            type="button"
                                                            disabled={isPast}
                                                            onClick={() => handleCalendarDayClick(dateStr)}
                                                            className={`h-7 rounded-lg text-xs flex items-center justify-center transition-all relative ${btnStyle}`}
                                                            title={
                                                                isPast
                                                                    ? `🚫 Past date (Cannot select past dates)`
                                                                    : isConflict
                                                                        ? `⚠️ Conflict: Overlaps with booked leave (${bookedLeaveObj?.status})`
                                                                        : isBooked
                                                                            ? `🔒 Booked Leave (${bookedLeaveObj?.status})`
                                                                            : `Select ${dateStr}`
                                                            }
                                                        >
                                                            <span>{dayNumber}</span>
                                                            {isBooked && !isConflict && (
                                                                <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Color Legend */}
                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-start text-[9px] font-bold text-slate-500 flex-wrap gap-x-4 gap-y-2">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" /> Selected
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded bg-emerald-200 border border-emerald-400 inline-block" /> Approved
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400 inline-block" /> Pending
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-400 inline-block" /> Rejected
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300 inline-block" /> Past
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider">Reason</label>
                                    <textarea
                                        className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 resize-none"
                                        placeholder="Tell us why..."
                                        value={leaveForm.reason}
                                        onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                        required
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center gap-2 mt-4 px-1">
                                    <input 
                                        type="checkbox" 
                                        id="urgent-leave"
                                        checked={leaveForm.isUrgent || false}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, isUrgent: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20"
                                    />
                                    <label htmlFor="urgent-leave" className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 cursor-pointer select-none">
                                        <AlertTriangle size={14} />
                                        This is an urgent/emergency request (Bypasses consecutive day limits)
                                    </label>
                                </div>

                                {/* Booked Dates Quick Reference Tags */}
                                {bookedDatesMap.size > 0 && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Calendar size={12} className="text-indigo-600" /> Your Booked Leave Dates ({bookedDatesMap.size} days):
                                        </p>
                                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                                            {Array.from(bookedDatesMap.entries()).map(([dStr, lObj]) => {
                                                const st = lObj.status || '';
                                                const tagStyle = st === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : (st === 'rejected' || st === 'hr_rejected')
                                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                        : 'bg-amber-50 text-amber-800 border-amber-200';
                                                return (
                                                    <span key={dStr} className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${tagStyle}`} title={`${st?.toUpperCase()}`}>
                                                        {dStr}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Deduction & Overlap Preview Banner */}
                                {deductionPreview && (
                                    <div className="space-y-2">
                                        {/* 1. Duration Summary Box */}
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="text-slate-600">Selected Date Range:</span>
                                                <span className="text-slate-800 font-extrabold">{deductionPreview.totalDuration} Days</span>
                                            </div>

                                            {/* Overlap Breakdown */}
                                            {deductionPreview.overlapCount > 0 && (
                                                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                                    <span className="text-amber-600 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} /> Already Booked (Excluded):
                                                    </span>
                                                    <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        -{deductionPreview.overlapCount} {deductionPreview.overlapCount === 1 ? 'Day' : 'Days'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-indigo-900 bg-indigo-50/50 p-2 rounded-lg">
                                                <span>Net New Leave Duration:</span>
                                                <span className="text-sm font-black text-indigo-700">{deductionPreview.netDuration} {deductionPreview.netDuration === 1 ? 'Day' : 'Days'}</span>
                                            </div>
                                        </div>

                                        {/* 2. Overlap Detailed Alert */}
                                        {deductionPreview.overlapCount > 0 && (
                                            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                                    <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                                                    <span>Overlapping Dates Auto-Excluded</span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-amber-700">
                                                    <strong>{deductionPreview.overlapCount} day(s)</strong> in this period overlap with existing booked leave(s). They will <strong>not be double-counted</strong>.
                                                </p>
                                            </div>
                                        )}

                                        {/* 3. Fully Booked Error (Dates Overlap) */}
                                        {deductionPreview.netDuration === 0 && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                                                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                                                <span>All selected dates are already covered by your existing leave. Please pick different dates.</span>
                                            </div>
                                        )}

                                        {/* 4. Strict Quota Exceeded Block */}
                                        {deductionPreview.netDuration > 0 && !deductionPreview.exceedsMaxConsecutive && deductionPreview.excessDays > 0 && (
                                            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs space-y-1.5 text-rose-900 shadow-sm">
                                                <div className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                                                    <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                                                    <span>Request Blocked: Quota Exceeded</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-rose-800 font-medium">
                                                    You are requesting <strong>{deductionPreview.netDuration} days</strong>, but you only have <strong>{deductionPreview.remaining} days</strong> remaining in this category. Please reduce the number of days or select a different leave type.
                                                </p>
                                            </div>
                                        )}

                                        {/* 4b. Max Consecutive Days Exceeded Block */}
                                        {deductionPreview.netDuration > 0 && deductionPreview.exceedsMaxConsecutive && (
                                            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs space-y-1.5 text-rose-900 shadow-sm">
                                                <div className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                                                    <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                                                    <span>Request Blocked: Consecutive Days Limit Exceeded</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-rose-800 font-medium">
                                                    You are requesting <strong>{deductionPreview.netDuration} consecutive days</strong>, but this leave type allows a maximum of <strong>{deductionPreview.maxConsecutiveDays} consecutive days</strong> per request. Please shorten your request.
                                                </p>
                                            </div>
                                        )}

                                        {/* 4c. Global Leave Cap Block */}
                                        {deductionPreview.netDuration > 0 && deductionPreview.exceedsGlobalLimit && (
                                            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs space-y-1.5 text-rose-900 shadow-sm">
                                                <div className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                                                    <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                                                    <span>Request Blocked: Global Limit Exceeded</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-rose-800 font-medium">
                                                    You are allowed a maximum of <strong>{deductionPreview.GLOBAL_MAX_LEAVES} standard paid leaves</strong> per year across all categories. You have already used <strong>{deductionPreview.globalUsed} days</strong>.
                                                </p>
                                            </div>
                                        )}

                                        {/* 5. Fully Covered Banner */}
                                        {deductionPreview.netDuration > 0 && deductionPreview.excessDays === 0 && !deductionPreview.exceedsMaxConsecutive && !deductionPreview.isUnpaid && (
                                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                                                <span>✓ Request is fully covered under your remaining quota.</span>
                                            </div>
                                        )}

                                        {/* 6. Unpaid Leave Notice */}
                                        {deductionPreview.netDuration > 0 && deductionPreview.isUnpaid && deductionPreview.excessDays === 0 && !deductionPreview.exceedsMaxConsecutive && (
                                            <div className="p-2.5 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                                                <span>✓ This will be processed as Unpaid Leave.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                        <button
                            disabled={deductionPreview?.isFullyBooked}
                            className="w-full py-3.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 text-sm mt-auto cursor-pointer"
                        >
                            <Send size={18} /> Submit Application
                        </button>
                    </form>
                </div>
            </div>

            {/* Leave History Table */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-800">My Leave History</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                                {['all', 'pending_hr', 'pending_team_lead', 'approved', 'hr_rejected', 'rejected'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    title="Sync latest status from HR"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                                >
                                    <RefreshCw size={12} />
                                    Sync
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto flex flex-col justify-between">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                    <th className="px-3 py-3">Type</th>
                                    <th className="px-3 py-3">Duration</th>
                                    <th className="px-3 py-3 text-center">Days</th>
                                    <th className="px-3 py-3">Reason</th>
                                    <th className="px-3 py-3 text-right">Status</th>
                                    <th className="px-3 py-3 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredLeavesForTable.map(leave => (
                                    <tr
                                        key={leave._id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedLeave(leave)}
                                    >
                                        <td className="px-3 py-3">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100/80 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg inline-block">
                                                {leave.leaveType?.name || 'Annual Leave'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="text-slate-700 dark:text-slate-300 font-medium text-xs whitespace-nowrap">
                                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs bg-slate-100 dark:bg-slate-700/50 px-2.5 py-0.5 rounded-md inline-block">
                                                {calculateDays(leave.startDate, leave.endDate)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/50 transition-colors block truncate max-w-[180px]">
                                                {truncateReason(leave.reason)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className={`
                                                        px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block
                                                        ${(leave.status === 'pending_hr' || leave.status === 'pending') ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : ''}
                                                        ${leave.status === 'pending_team_lead' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : ''}
                                                        ${leave.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : ''}
                                                        ${(leave.status === 'rejected' || leave.status === 'hr_rejected') ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' : ''}
                                                    `}>
                                                {leave.status === 'pending_hr' ? 'Pending HR' :
                                                 leave.status === 'pending_team_lead' ? 'Pending TL' :
                                                 leave.status === 'hr_rejected' ? 'HR Rejected' : 
                                                 leave.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <ChevronRight size={16} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLeavesForTable.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                <ClipboardList size={36} className="mb-2 opacity-30" />
                                <p className="text-xs font-semibold">No leave requests found {statusFilter !== 'all' && `with status "${statusFilter}"`}.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </motion.div>

    <LeaveDetailModal
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
    />
</>
    );
};

export default EmployeeLeaves;
