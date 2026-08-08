import toast from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart2, Users, Clock, AlertCircle, Filter, Calendar, 
    DollarSign, ClipboardList, Download, CheckCircle, XCircle, 
    AlertTriangle, Building2, UserCheck, Search, Briefcase, FileText,
    Banknote, Wallet, ChevronRight, TrendingUp
} from 'lucide-react';
import apiClient from '../../api/axiosClient';
import { formatDate } from '../../utils/dateUtils';


const HRReports = ({ employees, loans = [] }) => {
    // ── Report Type Tab ─────────────────────────────────────
    const [reportType, setReportType] = useState('attendance'); // 'attendance', 'leave', 'payroll', 'employee'

    // ── State ──────────────────────────────────────────────
    const [records, setRecords] = useState([]);
    const [leaveRecords, setLeaveRecords] = useState([]);
    const [payrollDeductions, setPayrollDeductions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Default date range: current month
    const defaultDateRange = useMemo(() => {
        const date = new Date();
        const y = date.getFullYear();
        const m = date.getMonth();
        const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
        const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
        return { firstDay, lastDay };
    }, []);

    const [filters, setFilters] = useState({
        startDate: defaultDateRange.firstDay,
        endDate: defaultDateRange.lastDay,
        employeeId: '',
        department: ''
    });

    // ── Attendance Log Controls & Date Presets ─────────────
    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all'); // 'all' | 'present' | 'late' | 'active'
    const [datePreset, setDatePreset] = useState('thisMonth'); // 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all' | 'custom'
    const [showAnalytics, setShowAnalytics] = useState(true);

    // ── Tab Specific Interactive Filters ─────────────────────────
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
    const [leaveSearch, setLeaveSearch] = useState('');
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');

    const [payrollSearch, setPayrollSearch] = useState('');
    
    const [directorySearch, setDirectorySearch] = useState('');
    const [directoryStatusFilter, setDirectoryStatusFilter] = useState('all'); // 'all' | 'full time' | 'probation' | 'internship'

    const handleApplyDatePreset = (presetKey) => {
        setDatePreset(presetKey);
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        if (presetKey === 'today') {
            setFilters(prev => ({ ...prev, startDate: todayStr, endDate: todayStr }));
        } else if (presetKey === 'yesterday') {
            const yest = new Date();
            yest.setDate(today.getDate() - 1);
            const yestStr = yest.toISOString().slice(0, 10);
            setFilters(prev => ({ ...prev, startDate: yestStr, endDate: yestStr }));
        } else if (presetKey === 'thisWeek') {
            const start = new Date();
            start.setDate(today.getDate() - 6);
            setFilters(prev => ({ ...prev, startDate: start.toISOString().slice(0, 10), endDate: todayStr }));
        } else if (presetKey === 'thisMonth') {
            setFilters(prev => ({ ...prev, startDate: defaultDateRange.firstDay, endDate: defaultDateRange.lastDay }));
        } else if (presetKey === 'all') {
            setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
        }
    };

    // ── Fetch attendance report (date-filtered) ─────────────
    const fetchAttendanceReport = async (params) => {
        const res = await apiClient.get('/attendance/report', { params: { ...params, type: 'attendance' } });
        setRecords(res.data);
    };

    // ── Fetch leave report (ALL leaves — filtered on frontend) ─
    // We intentionally do NOT pass date params to the leave fetch.
    // This ensures newly approved/pending leaves are always visible
    // regardless of the date range filter the HR admin has set.
    const fetchLeaveReport = async (empParam) => {
        const params = {};
        if (empParam) params.employeeId = empParam;
        const res = await apiClient.get('/attendance/report', { params: { ...params, type: 'leave' } });
        setLeaveRecords(res.data);
    };

    const fetchPayrollDeductions = async () => {
        const res = await apiClient.get('/payroll/deductions');
        setPayrollDeductions(res.data);
    };

    // ── Fetch data depending on active report ────────────────
    const [fetching, setFetching] = useState(false);
    const isInitialMount = React.useRef(true);

    const fetchReportData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        setFetching(true);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.employeeId) params.employeeId = filters.employeeId;

            // Fetch attendance with date filters, leaves without (to never miss new approvals)
            await Promise.all([
                fetchAttendanceReport(params),
                fetchLeaveReport(filters.employeeId),
                fetchPayrollDeductions()
            ]);
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            if (isInitial) setLoading(false);
            setFetching(false);
        }
    };

    // Manual refresh (no full-page loader — just refetch quietly)
    const [refreshing, setRefreshing] = useState(false);
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.employeeId) params.employeeId = filters.employeeId;
            await Promise.all([
                fetchAttendanceReport(params),
                fetchLeaveReport(filters.employeeId),
                fetchPayrollDeductions()
            ]);
        } catch (err) {
            console.error('Error refreshing report data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchReportData(true);
        } else {
            fetchReportData(false);
        }
    }, [filters.startDate, filters.endDate, filters.employeeId]); // Refetch in background on core filter change

    // ── BroadcastChannel listener ─ same pattern as announcements_channel ────
    // When HR approves/rejects a leave anywhere in the app, 'leaves_channel'
    // fires a LEAVE_STATUS_CHANGED event — we re-fetch leaves instantly.
    useEffect(() => {
        if (!('BroadcastChannel' in window)) return;
        let bc;
        try {
            bc = new BroadcastChannel('leaves_channel');
            bc.onmessage = (event) => {
                if (event.data?.type === 'LEAVE_STATUS_CHANGED') {
                    // Silent refresh — no loader, just update the data
                    fetchLeaveReport(filters.employeeId);
                }
            };
        } catch (e) {
            console.error('BroadcastChannel setup error (leaves_channel):', e);
        }
        return () => { if (bc) bc.close(); };
    }, [filters.employeeId]);

    // Refresh leave data immediately when switching to leave or payroll tab
    useEffect(() => {
        if (reportType === 'leave' || reportType === 'payroll') {
            fetchLeaveReport(filters.employeeId);
        }
    }, [reportType]);

    // ── Filter helper by Department (Frontend filter) ────────
    const filterByDept = (recordsList, deptKey = 'employee') => {
        if (!filters.department) return recordsList;
        return recordsList.filter(r => {
            const emp = r[deptKey];
            return emp?.department?.toLowerCase() === filters.department.toLowerCase();
        });
    };

    // ── Computed Lists ─────────────────────────────────────
    const filteredAttendance = useMemo(() => {
        return filterByDept(records, 'employee');
    }, [records, filters.department]);

    const filteredLeaves = useMemo(() => {
        let list = filterByDept(leaveRecords, 'employee');
        
        if (filters.employeeId) {
            const empIdStr = String(filters.employeeId);
            list = list.filter(l => String(l.employee?._id || l.employee || '') === empIdStr);
        }

        const fStart = filters.startDate || '';
        const fEnd = filters.endDate || '';

        if (fStart || fEnd) {
            list = list.filter(l => {
                const lStart = l.startDate ? String(l.startDate).slice(0, 10) : '';
                const lEnd = l.endDate ? String(l.endDate).slice(0, 10) : '';
                const lCreated = l.createdAt ? String(l.createdAt).slice(0, 10) : (l.appliedAt ? String(l.appliedAt).slice(0, 10) : '');

                // Condition 1: Leave duration overlaps with selected range
                let overlaps = true;
                if (fStart && lEnd && lEnd < fStart) overlaps = false;
                if (fEnd && lStart && lStart > fEnd) overlaps = false;

                // Condition 2: Application submitted within selected range
                let createdInRange = false;
                if (lCreated) {
                    if (fStart && fEnd) {
                        createdInRange = lCreated >= fStart && lCreated <= fEnd;
                    } else if (fStart) {
                        createdInRange = lCreated >= fStart;
                    } else if (fEnd) {
                        createdInRange = lCreated <= fEnd;
                    }
                }

                return overlaps || createdInRange;
            });
        }
        return list;
    }, [leaveRecords, filters.department, filters.employeeId, filters.startDate, filters.endDate]);

    const filteredEmployees = useMemo(() => {
        let list = employees;
        if (filters.department) {
            list = list.filter(e => e.department?.toLowerCase() === filters.department.toLowerCase());
        }
        if (filters.employeeId) {
            list = list.filter(e => e._id === filters.employeeId);
        }
        return list;
    }, [employees, filters.department, filters.employeeId]);

    // ── Interactive Displayed Lists for Leave & Directory ────────
    const displayedLeaves = useMemo(() => {
        let list = filteredLeaves;

        if (leaveStatusFilter !== 'all') {
            list = list.filter(l => l.status === leaveStatusFilter);
        }

        if (leaveTypeFilter !== 'all') {
            list = list.filter(l => l.leaveType?.toLowerCase() === leaveTypeFilter.toLowerCase());
        }

        if (leaveSearch.trim()) {
            const q = leaveSearch.toLowerCase();
            list = list.filter(l => 
                l.employee?.name?.toLowerCase().includes(q) ||
                l.employee?.email?.toLowerCase().includes(q) ||
                l.reason?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [filteredLeaves, leaveStatusFilter, leaveTypeFilter, leaveSearch]);

    const displayedEmployees = useMemo(() => {
        let list = filteredEmployees;

        if (directoryStatusFilter !== 'all') {
            list = list.filter(e => e.status?.toLowerCase() === directoryStatusFilter.toLowerCase());
        }

        if (directorySearch.trim()) {
            const q = directorySearch.toLowerCase();
            list = list.filter(e =>
                e.name?.toLowerCase().includes(q) ||
                e.email?.toLowerCase().includes(q) ||
                e.department?.toLowerCase().includes(q) ||
                e.role?.toLowerCase().includes(q) ||
                (e.phone && e.phone.includes(q))
            );
        }

        return list;
    }, [filteredEmployees, directoryStatusFilter, directorySearch]);

    // ── 1. Attendance Calculations ─────────────────────────
    const attendanceSummary = useMemo(() => {
        const total = filteredAttendance.length;

        const hoursArray = filteredAttendance
            .filter(r => r.checkIn && r.checkOut)
            .map(r => {
                const diff = new Date(r.checkOut) - new Date(r.checkIn);
                return diff / (1000 * 60 * 60);
            });

        const avgHours = hoursArray.length > 0
            ? (hoursArray.reduce((a, b) => a + b, 0) / hoursArray.length).toFixed(1)
            : 0;

        const lateArrivals = filteredAttendance.filter(r => r.status === 'late').length;

        const activeSessions = filteredAttendance.filter(r => r.checkIn && !r.checkOut).length;

        return { total, avgHours, lateArrivals, activeSessions };
    }, [filteredAttendance]);

    // ── 2. Leave Calculations ──────────────────────────────
    const leaveSummary = useMemo(() => {
        const total = filteredLeaves.length;
        const approved = filteredLeaves.filter(l => l.status === 'approved').length;
        const pending = filteredLeaves.filter(l => l.status === 'pending').length;
        const rejected = filteredLeaves.filter(l => l.status === 'rejected').length;

        // Leaves by department count
        const deptDistribution = {};
        filteredLeaves.forEach(l => {
            const dept = l.employee?.department || 'Other';
            deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
        });

        return { total, approved, pending, rejected, deptDistribution };
    }, [filteredLeaves]);

    // ── 3. Payroll Calculations ────────────────────────────
    const payrollData = useMemo(() => {
        // Calculate payroll for the list of filteredEmployees based on their approved leaves & late arrivals in the period
        return filteredEmployees.map(emp => {
            const empIdStr = String(emp._id);
            const baseSalary = Number(emp.salary) || 0;
            const dailyRate = baseSalary > 0 ? baseSalary / 30 : 0;

            // 1. Find attendance logs for this employee (robust String ID comparison)
            const empAttendance = filteredAttendance.filter(r => {
                const rEmpId = String(r.employee?._id || r.employee || '');
                return rEmpId === empIdStr;
            });
            const presentDays = empAttendance.filter(r => r.checkIn).length;

            const lateCount = empAttendance.filter(r => r.status === 'late').length;

            // Late penalty: 0.25 * dailyRate per late check-in
            const lateDeduction = Math.round(lateCount * (dailyRate * 0.25));

            // 2. Find approved leaves for this employee (decoupled from Leave tab date presets)
            const empLeaves = leaveRecords.filter(l => {
                const lEmpId = String(l.employee?._id || l.employee || '');
                return lEmpId === empIdStr && (l.status?.toLowerCase() === 'approved');
            });

            // 3. Compute total leave days taken (and count unpaid days)
            let totalLeaveDays = 0;
            let unpaidLeaveDays = 0;

            empLeaves.forEach(l => {
                const leaveStart = new Date(l.startDate);
                const leaveEnd = new Date(l.endDate);
                const diffTime = Math.abs(leaveEnd - leaveStart);
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                totalLeaveDays += days;

                const isUnpaid = l.leaveType && String(l.leaveType.name || '').toLowerCase().includes('unpaid');
                if (isUnpaid) {
                    unpaidLeaveDays += days;
                }
            });

            const activeLoans = loans.filter(l => {
                const lEmpId = String(l.employee?._id || l.employee || '');
                return lEmpId === empIdStr && (l.status === 'Approved' || l.status === 'Active');
            });
            let loanDeduction = 0;
            activeLoans.forEach(loan => {
                const deduction = Number(loan.monthlyDeduction) || 0;
                const remaining = Number(loan.remainingBalance) || 0;
                if (remaining > 0) {
                    loanDeduction += Math.min(deduction, remaining);
                }
            });

            // Absence Deductions
            const empAbsenceDeductions = payrollDeductions.filter(d => {
                const dEmpId = String(d.employee?._id || d.employee || '');
                return dEmpId === empIdStr;
            });
            const absenceDeduction = empAbsenceDeductions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

            const leaveDeduction = Math.round(unpaidLeaveDays * dailyRate);
            const totalDeduction = lateDeduction + leaveDeduction + loanDeduction + absenceDeduction;
            const netSalary = Math.max(0, baseSalary - totalDeduction);

            return {
                employee: emp,
                baseSalary,
                dailyRate,
                presentDays,
                lateCount,
                lateDeduction,
                leaveDays: totalLeaveDays,         // total approved leave days (for display)
                unpaidLeaveDays,                    // excess days that are actually deducted
                leaveDeduction,
                loanDeduction,
                absenceDeduction,
                deduction: totalDeduction,
                netSalary
            };
        });
    }, [filteredEmployees, filteredAttendance, leaveRecords, loans, payrollDeductions]);

    const payrollSummary = useMemo(() => {
        const totalBase = payrollData.reduce((acc, curr) => acc + curr.baseSalary, 0);
        const totalDeductions = payrollData.reduce((acc, curr) => acc + curr.deduction, 0);
        const totalLeaveDeductions = payrollData.reduce((acc, curr) => acc + curr.leaveDeduction, 0);
        const totalLateDeductions = payrollData.reduce((acc, curr) => acc + curr.lateDeduction, 0);
        const totalLoanDeductions = payrollData.reduce((acc, curr) => acc + curr.loanDeduction, 0);
        const totalAbsenceDeductions = payrollData.reduce((acc, curr) => acc + curr.absenceDeduction, 0);
        const totalNet = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
        const avgNet = payrollData.length > 0 ? Math.round(totalNet / payrollData.length) : 0;

        // Cost by department
        const deptCost = {};
        payrollData.forEach(p => {
            const dept = p.employee?.department || 'Other';
            deptCost[dept] = (deptCost[dept] || 0) + p.netSalary;
        });

        return { totalBase, totalDeductions, totalLeaveDeductions, totalLateDeductions, totalLoanDeductions, totalAbsenceDeductions, totalNet, avgNet, deptCost };
    }, [payrollData]);

    // ── 4. Employee Directory calculations ──────────────────
    const employeeSummary = useMemo(() => {
        const total = filteredEmployees.length;
        const fullTime = filteredEmployees.filter(e => e.status === 'full time').length;
        const probation = filteredEmployees.filter(e => e.status === 'probation').length;
        const internship = filteredEmployees.filter(e => e.status === 'internship').length;

        // Employees by department
        const deptCount = {};
        filteredEmployees.forEach(e => {
            const dept = e.department || 'Other';
            deptCount[dept] = (deptCount[dept] || 0) + 1;
        });

        return { total, fullTime, probation, internship, deptCount };
    }, [filteredEmployees]);

    // ── Formatter & Helper Functions ─────────────────────────
    const isLate = (record) => {
        if (!record) return false;
        return record.status === 'late';
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const calcHours = (checkIn, checkOut) => {
        if (!checkIn) return '—';
        if (!checkOut) return 'Active Now';
        const diff = new Date(checkOut) - new Date(checkIn);
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h ${m}m`;
    };

    const getDecimalHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const diff = new Date(checkOut) - new Date(checkIn);
        return parseFloat((diff / (1000 * 60 * 60)).toFixed(1));
    };

    const formatCurrency = (val) => {
        return `₨ ${Number(val).toLocaleString()}`;
    };

    // ── Attendance Chart (dynamic continuous timeline) ──────
    const chartData = useMemo(() => {
        const dateMap = {};
        filteredAttendance.forEach(r => {
            if (!r.date) return;
            if (!dateMap[r.date]) {
                dateMap[r.date] = { count: 0, lateCount: 0, activeCount: 0 };
            }
            dateMap[r.date].count += 1;
            if (isLate(r)) dateMap[r.date].lateCount += 1;
            if (r.checkIn && !r.checkOut) dateMap[r.date].activeCount += 1;
        });

        let dates = [];
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            let curr = new Date(start);
            let countLimit = 0;
            while (curr <= end && countLimit < 31) {
                const dStr = curr.toISOString().split('T')[0];
                dates.push(dStr);
                curr.setDate(curr.getDate() + 1);
                countLimit++;
            }
        }

        if (dates.length === 0) {
            const today = new Date();
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                dates.push(d.toISOString().split('T')[0]);
            }
        }

        const maxCount = Math.max(...dates.map(d => dateMap[d]?.count || 0), 1);

        return dates.map(dStr => {
            const data = dateMap[dStr] || { count: 0, lateCount: 0, activeCount: 0 };
            const dateObj = new Date(dStr + 'T00:00:00');
            const dayName = formatDate(dateObj);
            const monthDay = formatDate(dateObj);
            return {
                rawDate: dStr,
                dateLabel: monthDay,
                dayName,
                count: data.count,
                lateCount: data.lateCount,
                activeCount: data.activeCount,
                heightPercent: Math.round((data.count / maxCount) * 100)
            };
        });
    }, [filteredAttendance, filters.startDate, filters.endDate]);

    // ── Safe Metric Calculations for Below Chart ─────────────
    const chartSummary = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { peakCount: 0, peakDate: 'N/A', dailyAvg: '0', totalCheckIns: 0, onTimeRate: 100, lateCount: 0 };
        }
        let peakCount = 0;
        let peakDate = 'N/A';
        let totalCheckIns = 0;

        chartData.forEach(d => {
            totalCheckIns += d.count;
            if (d.count >= peakCount && d.count > 0) {
                peakCount = d.count;
                peakDate = `${d.dateLabel} (${d.dayName})`;
            }
        });

        const dailyAvg = (totalCheckIns / chartData.length).toFixed(1);
        const lateCount = filteredAttendance.filter(r => isLate(r)).length;
        const totalLogs = filteredAttendance.length;
        const onTimeRate = totalLogs > 0 ? Math.round(((totalLogs - lateCount) / totalLogs) * 100) : 100;

        return { peakCount, peakDate, dailyAvg, totalCheckIns, onTimeRate, lateCount };
    }, [chartData, filteredAttendance]);

    // ── Filtered Attendance Log (Search & Status Filters) ───
    const displayedAttendance = useMemo(() => {
        return filteredAttendance.filter(record => {
            const name = record.employee?.name || '';
            const email = record.employee?.email || '';
            const dept = record.employee?.department || '';
            const q = attendanceSearch.toLowerCase();
            const matchesSearch = !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || dept.toLowerCase().includes(q);

            let matchesStatus = true;
            if (attendanceStatusFilter === 'present') {
                matchesStatus = record.checkIn && !isLate(record);
            } else if (attendanceStatusFilter === 'late') {
                matchesStatus = isLate(record);
            } else if (attendanceStatusFilter === 'active') {
                matchesStatus = record.checkIn && !record.checkOut;
            }

            return matchesSearch && matchesStatus;
        });
    }, [filteredAttendance, attendanceSearch, attendanceStatusFilter]);

    // ── Export Attendance Log to CSV ────────────────────────
    const exportAttendanceCSV = () => {
        if (!displayedAttendance.length) return toast.error('No attendance records to export.');
        const headers = ['Employee Name', 'Email', 'Department', 'Date', 'Check In', 'Check Out', 'Hours Worked', 'Status'];
        const rows = displayedAttendance.map(r => [
            `"${r.employee?.name || ''}"`,
            `"${r.employee?.email || ''}"`,
            `"${r.employee?.department || ''}"`,
            `"${r.date || ''}"`,
            `"${formatTime(r.checkIn)}"`,
            `"${formatTime(r.checkOut)}"`,
            `"${calcHours(r.checkIn, r.checkOut)}"`,
            `"${!r.checkIn ? 'Absent' : isLate(r) ? 'Late Entry' : !r.checkOut ? 'Active Session' : 'Present'}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Attendance_Log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Export Report to PDF ───────────────────────────────
    const exportToPDF = async () => {
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();

            // Brand Identity Styling
            const primaryColor = [79, 70, 229]; // Indigo-600 #4f46e5
            const darkColor = [30, 41, 59];    // slate-800
            const lightGray = [100, 116, 139]; // slate-500

            // Document Header Logo & Date
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(...primaryColor);
            doc.text('HR Admin Portal', 14, 18);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 200 - 14, 18, { align: 'right' });

            // Slate divider line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.5);
            doc.line(14, 22, 200 - 14, 22);

            // Report Title
            doc.setFontSize(14);
            doc.setTextColor(...darkColor);
            doc.setFont('helvetica', 'bold');
            const titleStr = reportType === 'attendance' ? 'Attendance Analysis Report'
                : reportType === 'leave' ? 'Leave Request Analysis Report'
                    : reportType === 'payroll' ? 'Payroll Summary & Payout Report'
                        : 'Active Staff Directory Report';
            doc.text(titleStr, 14, 32);

            // Active Filters Display
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            const filterStr = `Filters: Date Range: [${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}]` +
                ` | Dept: [${filters.department || 'All'}]` +
                ` | Employee: [${filters.employeeId ? employees.find(e => e._id === filters.employeeId)?.name : 'All'}]`;
            doc.text(filterStr, 14, 38);

            // Summary KPIs aggregation
            let kpis = [];
            if (reportType === 'attendance') {
                kpis = [
                    ['Total Attendance Logs', `${attendanceSummary.total} entries`],
                    ['Avg Daily Active Hours', `${attendanceSummary.avgHours} hrs`],
                    ['Late Arrivals Count', `${attendanceSummary.lateArrivals} entries`],
                    ['Active Work Sessions', `${attendanceSummary.activeSessions} active`]
                ];
            } else if (reportType === 'leave') {
                kpis = [
                    ['Total Leave Requests', `${leaveSummary.total} requests`],
                    ['Approved Leaves', `${leaveSummary.approved} approved`],
                    ['Pending Requests', `${leaveSummary.pending} pending`],
                    ['Rejected Leaves', `${leaveSummary.rejected} rejected`]
                ];
            } else if (reportType === 'payroll') {
                kpis = [
                    ['Monthly Base Salary Budget', formatCurrency(payrollSummary.totalBase)],
                    ['Total Leave Deductions', formatCurrency(payrollSummary.totalDeductions)],
                    ['Net Payroll Payout', formatCurrency(payrollSummary.totalNet)],
                    ['Average Employee Net Salary', formatCurrency(payrollSummary.avgNet)]
                ];
            } else if (reportType === 'employee') {
                kpis = [
                    ['Total Headcount', `${employeeSummary.total} staff`],
                    ['Full Time Staff Ratio', `${employeeSummary.fullTime} staff`],
                    ['On Probation', `${employeeSummary.probation} staff`],
                    ['Internship Status', `${employeeSummary.internship} staff`]
                ];
            }

            // KPI Table
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkColor);
            doc.text('Key Performance Indicators (KPIs)', 14, 48);

            autoTable(doc, {
                startY: 52,
                head: [['Indicator Metric', 'Report Aggregated Value']],
                body: kpis,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
                margin: { left: 14, right: 14 }
            });

            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : (doc.previousAutoTable ? doc.previousAutoTable.finalY : 100);
            const nextStartY = finalY + 10;

            // Detailed log Section
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkColor);
            doc.text('Detailed Logs / Records Index', 14, nextStartY);

            let tableHeaders = [];
            let tableRows = [];

            if (reportType === 'attendance') {
                tableHeaders = [['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status']];
                tableRows = filteredAttendance.map(r => [
                    `${r.employee?.name || '—'}\n(${r.employee?.email || '—'})`,
                    r.employee?.department || '—',
                    r.date,
                    r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                    r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                    calcHours(r.checkIn, r.checkOut),
                    !r.checkIn ? 'Absent' : isLate(r) ? 'Late' : !r.checkOut ? 'Active' : 'Present'
                ]);
            } else if (reportType === 'leave') {
                tableHeaders = [['Employee', 'Department', 'Start Date', 'End Date', 'Reason', 'Status']];
                tableRows = filteredLeaves.map(l => [
                    `${l.employee?.name || '—'}\n(${l.employee?.email || '—'})`,
                    l.employee?.department || '—',
                    l.startDate ? formatDate(l.startDate) : '—',
                    l.endDate ? formatDate(l.endDate) : '—',
                    l.reason || '—',
                    l.status.toUpperCase()
                ]);
            } else if (reportType === 'payroll') {
                tableHeaders = [['Employee', 'Department', 'Monthly Base', 'Approved Leaves', 'Deductions', 'Net Payout']];
                tableRows = payrollData.map(p => [
                    `${p.employee?.name || '—'}\n(${p.employee?.email || '—'})`,
                    p.employee?.department || '—',
                    formatCurrency(p.baseSalary),
                    `${p.leaveDays} days`,
                    `-${formatCurrency(p.deduction)}`,
                    formatCurrency(p.netSalary)
                ]);
            } else if (reportType === 'employee') {
                tableHeaders = [['Employee', 'Department', 'Contact Info', 'Monthly Salary', 'Status', 'Hired Date']];
                tableRows = filteredEmployees.map(e => [
                    e.name || '—',
                    e.department || '—',
                    `${e.email || '—'}\n${e.phone || '—'}`,
                    formatCurrency(e.salary),
                    e.status.toUpperCase(),
                    e.createdAt ? formatDate(e.createdAt) : '—'
                ]);
            }

            autoTable(doc, {
                startY: nextStartY + 4,
                head: tableHeaders,
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 4, valign: 'middle', font: 'helvetica' },
                margin: { left: 14, right: 14 }
            });

            const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Error generating PDF report:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Departments list (derived dynamically from employees) ────────────────────────────────────
    const departments = useMemo(() => {
        const deptSet = new Set();
        employees.forEach(e => { if (e.department) deptSet.add(e.department); });
        return Array.from(deptSet).sort();
    }, [employees]);

    // ── Cascading Staff list (filtered by selected Department) ─────────────────────────────────
    const availableStaff = useMemo(() => {
        let list = employees;
        if (filters.department) {
            list = list.filter(e => e.department?.toLowerCase() === filters.department.toLowerCase());
        }
        return list;
    }, [employees, filters.department]);

    // ── Report Type Metadata ───────────────────────────────
    const reportTypesMeta = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardList },
        { id: 'leave', label: 'Leave Requests', icon: Calendar },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'employee', label: 'Staff Directory', icon: Users },
        { id: 'audit', label: 'Audit History', icon: AlertTriangle },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ── EXECUTIVE HERO CONTROL & FILTER PANEL (UI Expert Design) ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                {/* Header & Export Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Reports &amp; Analytics Console</h1>
                        <p className="text-xs text-slate-400">Live attendance, leave, payroll &amp; directory controls</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh report data"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                            {refreshing ? 'Syncing...' : 'Refresh'}
                        </button>
                        <button
                            onClick={exportToPDF}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <Download size={14} /> Export PDF
                        </button>
                    </div>
                </div>

                {/* Report Type Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 gap-1 overflow-x-auto">
                    {reportTypesMeta.map((type) => {
                        const Icon = type.icon;
                        const isActive = reportType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setReportType(type.id)}
                                className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <Icon size={14} />
                                {type.label}
                            </button>
                        );
                    })}
                </div>

                {/* Quick Date Selector Presets (Shown for Attendance & Leave reports) */}
                {(reportType === 'attendance' || reportType === 'leave') && (
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                                <Filter size={11} /> Quick Range:
                            </span>
                            <button
                                onClick={() => handleApplyDatePreset('today')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                    datePreset === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                <span>📍 Today's Entry</span>
                            </button>
                            <button
                                onClick={() => handleApplyDatePreset('yesterday')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    datePreset === 'yesterday' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                Yesterday
                            </button>
                            <button
                                onClick={() => handleApplyDatePreset('thisWeek')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    datePreset === 'thisWeek' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => handleApplyDatePreset('thisMonth')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    datePreset === 'thisMonth' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => handleApplyDatePreset('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    datePreset === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                All Records
                            </button>
                        </div>

                        {(filters.startDate || filters.endDate || filters.employeeId || filters.department) && (
                            <button
                                onClick={() => {
                                    setDatePreset('thisMonth');
                                    setFilters({ startDate: defaultDateRange.firstDay, endDate: defaultDateRange.lastDay, employeeId: '', department: '' });
                                }}
                                className="text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors underline cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {/* Filter Inputs Grid (Visible across ALL tabs: Attendance, Leave, Payroll, Staff Directory) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">From Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={e => { setDatePreset('custom'); setFilters({ ...filters, startDate: e.target.value }); }}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">To Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={e => { setDatePreset('custom'); setFilters({ ...filters, endDate: e.target.value }); }}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Department</label>
                        <select
                            value={filters.department}
                            onChange={e => {
                                const newDept = e.target.value;
                                let newEmpId = filters.employeeId;
                                if (newDept && newEmpId) {
                                    const emp = employees.find(emp => emp._id === newEmpId);
                                    if (emp && emp.department?.toLowerCase() !== newDept.toLowerCase()) {
                                        newEmpId = '';
                                    }
                                }
                                setFilters({ ...filters, department: newDept, employeeId: newEmpId });
                            }}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 capitalize"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Employee Name</label>
                        <select
                            value={filters.employeeId}
                            onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                        >
                            <option value="">All Employees ({availableStaff.length})</option>
                            {availableStaff.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Loader ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* ── ATTENDANCE REPORT VIEW ── */}
                    {reportType === 'attendance' && (
                        <div className="space-y-6">
                            {/* Summary Cards (Interactive Filters) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    icon={Users}
                                    label="Total Attendance"
                                    value={attendanceSummary.total}
                                    color="indigo"
                                    isActive={attendanceStatusFilter === 'all'}
                                    onClick={() => setAttendanceStatusFilter('all')}
                                />
                                <SummaryCard
                                    icon={Clock}
                                    label="Avg Active Hours"
                                    value={`${attendanceSummary.avgHours} hrs`}
                                    color="emerald"
                                    isActive={attendanceStatusFilter === 'present'}
                                    onClick={() => setAttendanceStatusFilter('present')}
                                />
                                <SummaryCard
                                    icon={AlertTriangle}
                                    label="Late Arrivals"
                                    value={attendanceSummary.lateArrivals}
                                    color="amber"
                                    isActive={attendanceStatusFilter === 'late'}
                                    onClick={() => setAttendanceStatusFilter('late')}
                                />
                                <SummaryCard
                                    icon={UserCheck}
                                    label="Active Work Sessions"
                                    value={attendanceSummary.activeSessions}
                                    color="rose"
                                    isActive={attendanceStatusFilter === 'active'}
                                    onClick={() => setAttendanceStatusFilter('active')}
                                />
                            </div>

                            {/* ── PROFESSIONAL ATTENDANCE LOG SECTION ── */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
                                {/* Header Controls & Search */}
                                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                                            <ClipboardList size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-slate-800">Attendance Log &amp; Time Tracking</h2>
                                            <p className="text-xs text-slate-400">Showing {displayedAttendance.length} of {filteredAttendance.length} attendance logs</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons & Export */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={exportAttendanceCSV}
                                            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Download size={14} className="text-indigo-600" /> Export CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Filters & Search Sub-Bar */}
                                <div className="px-4 py-3 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    {/* Status Filter Pills */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => setAttendanceStatusFilter('all')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                attendanceStatusFilter === 'all'
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            All Logs ({filteredAttendance.length})
                                        </button>
                                        <button
                                            onClick={() => setAttendanceStatusFilter('present')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                attendanceStatusFilter === 'present'
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                        >
                                            On Time ({filteredAttendance.filter(r => r.checkIn && !isLate(r)).length})
                                        </button>
                                        <button
                                            onClick={() => setAttendanceStatusFilter('late')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                attendanceStatusFilter === 'late'
                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                            }`}
                                        >
                                            Late Entry ({filteredAttendance.filter(r => isLate(r)).length})
                                        </button>
                                        <button
                                            onClick={() => setAttendanceStatusFilter('active')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                attendanceStatusFilter === 'active'
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                            }`}
                                        >
                                            Active Now ({filteredAttendance.filter(r => r.checkIn && !r.checkOut).length})
                                        </button>
                                    </div>

                                    {/* Log Search Box */}
                                    <div className="relative w-full md:w-64">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search staff, email, dept..."
                                            value={attendanceSearch}
                                            onChange={e => setAttendanceSearch(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                        {attendanceSearch && (
                                            <button onClick={() => setAttendanceSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Table Display */}
                                {displayedAttendance.length === 0 ? (
                                    <EmptyState msg="No attendance logs match the active filter or search keyword." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse table-fixed">
                                            <colgroup>
                                                <col className="w-[26%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[15%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[17%]" />
                                            </colgroup>
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">
                                                    <th className="px-4 py-3">Employee</th>
                                                    <th className="px-3 py-3">Department</th>
                                                    <th className="px-3 py-3">Date</th>
                                                    <th className="px-3 py-3 text-emerald-600">Check In</th>
                                                    <th className="px-3 py-3 text-slate-500">Check Out</th>
                                                    <th className="px-3 py-3">Duration &amp; Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {displayedAttendance.map(record => {
                                                    const late = isLate(record);
                                                    const active = record.checkIn && !record.checkOut;
                                                    const hoursVal = getDecimalHours(record.checkIn, record.checkOut);
                                                    const formattedDate = record.date ? formatDate(record.date + 'T00:00:00') : '—';
                                                    return (
                                                        <tr key={record._id} className="hover:bg-slate-50/60 transition-colors group">
                                                            {/* Employee Info */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    {record.employee?.photo ? (
                                                                        <img src={record.employee.photo} alt={record.employee.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200">
                                                                            {record.employee?.name?.[0]?.toUpperCase() || 'U'}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition-colors">
                                                                            {record.employee?.name || 'Unknown Staff'}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 truncate">{record.employee?.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Department */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-[11px] font-semibold text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded-lg truncate inline-block">
                                                                    {record.employee?.department || 'General'}
                                                                </span>
                                                            </td>

                                                            {/* Date */}
                                                            <td className="px-3 py-3">
                                                                <span className="text-xs text-slate-700 font-semibold truncate block">
                                                                    {formattedDate}
                                                                </span>
                                                            </td>

                                                            {/* Check In */}
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${late ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                                    <span className={`text-xs font-bold tabular-nums ${late ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                                        {formatTime(record.checkIn)}
                                                                    </span>
                                                                    {late && (
                                                                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded uppercase">
                                                                            Late
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Check Out */}
                                                            <td className="px-3 py-3">
                                                                {active ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-bold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> Active Now
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-600 font-semibold tabular-nums">
                                                                        {formatTime(record.checkOut)}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Duration & Status */}
                                                            <td className="px-3 py-3">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="font-black text-slate-800 tabular-nums">
                                                                            {calcHours(record.checkIn, record.checkOut)}
                                                                        </span>
                                                                        {!record.checkIn || record.status === 'absent' ? (
                                                                            <div className="flex flex-col items-end">
                                                                                <Badge color="slate" label="Absent" />
                                                                                {record.reason && (
                                                                                    <span className="text-[9px] text-slate-400 mt-1 max-w-[150px] truncate" title={record.reason}>
                                                                                        {record.reason}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : late ? (
                                                                            <Badge color="amber" label="Late Entry" />
                                                                        ) : active ? (
                                                                            <Badge color="rose" label="Active" />
                                                                        ) : (
                                                                            <Badge color="emerald" label="Present" />
                                                                        )}
                                                                    </div>
                                                                    {/* Mini Progress Bar vs 8h target */}
                                                                    {record.checkIn && record.checkOut && (
                                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full ${hoursVal >= 8 ? 'bg-emerald-500' : hoursVal >= 6 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                                                style={{ width: `${Math.min((hoursVal / 8) * 100, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── LEAVE REPORT VIEW ── */}
                    {reportType === 'leave' && (
                        <div className="space-y-6">
                            {/* Summary Cards (Interactive Filters) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    icon={Calendar}
                                    label="Total Requests"
                                    value={leaveSummary.total}
                                    color="indigo"
                                    isActive={leaveStatusFilter === 'all'}
                                    onClick={() => setLeaveStatusFilter('all')}
                                />
                                <SummaryCard
                                    icon={CheckCircle}
                                    label="Approved Leaves"
                                    value={leaveSummary.approved}
                                    color="emerald"
                                    isActive={leaveStatusFilter === 'approved'}
                                    onClick={() => setLeaveStatusFilter('approved')}
                                />
                                <SummaryCard
                                    icon={Clock}
                                    label="Pending Requests"
                                    value={leaveSummary.pending}
                                    color="amber"
                                    isActive={leaveStatusFilter === 'pending'}
                                    onClick={() => setLeaveStatusFilter('pending')}
                                />
                                <SummaryCard
                                    icon={XCircle}
                                    label="Rejected Leaves"
                                    value={leaveSummary.rejected}
                                    color="rose"
                                    isActive={leaveStatusFilter === 'rejected'}
                                    onClick={() => setLeaveStatusFilter('rejected')}
                                />
                            </div>

                            {/* Leaves by Department Visualization */}
                            {Object.keys(leaveSummary.deptDistribution).length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-600" />
                                        Leaves Distribution by Department
                                    </h2>
                                    <div className="space-y-4">
                                        {Object.entries(leaveSummary.deptDistribution).map(([dept, count]) => {
                                            const pct = Math.round((count / leaveSummary.total) * 100);
                                            return (
                                                <div key={dept} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-slate-700 capitalize">
                                                        <span>{dept}</span>
                                                        <span>{count} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Leave Records Table */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
                                {/* Header Controls & Search Bar */}
                                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-slate-800">Leave Applications &amp; History</h2>
                                            <p className="text-xs text-slate-400">Showing {displayedLeaves.length} of {leaveRecords.length} total applications</p>
                                        </div>
                                    </div>

                                    {/* Filters & Search */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Status Pills */}
                                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-2xs">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'approved', label: 'Approved' },
                                                { id: 'pending', label: 'Pending' },
                                                { id: 'rejected', label: 'Rejected' },
                                            ].map(pill => (
                                                <button
                                                    key={pill.id}
                                                    onClick={() => setLeaveStatusFilter(pill.id)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        leaveStatusFilter === pill.id
                                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                                            : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {pill.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Search Input */}
                                        <div className="relative min-w-[200px]">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search applicant, reason..."
                                                value={leaveSearch}
                                                onChange={e => setLeaveSearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {displayedLeaves.length === 0 ? (
                                    <EmptyState msg="No leave requests match your search or filters." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[9px] font-extrabold tracking-wider">
                                                    <th className="px-4 py-3">Employee</th>
                                                    <th className="px-3 py-3">Department</th>
                                                    <th className="px-3 py-3">Start Date</th>
                                                    <th className="px-3 py-3">End Date</th>
                                                    <th className="px-3 py-3">Reason</th>
                                                    <th className="px-3 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {displayedLeaves.map(log => (
                                                    <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                {log.employee?.photo ? (
                                                                    <img src={log.employee.photo} alt={log.employee.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200">
                                                                        {log.employee?.name?.[0]?.toUpperCase() || 'U'}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-slate-800 text-xs truncate">{log.employee?.name || 'Staff Member'}</span>
                                                                    <span className="text-[10px] text-slate-400 truncate">{log.employee?.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className="text-[11px] font-semibold text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded-lg truncate inline-block">
                                                                {log.employee?.department || 'General'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-700 text-xs font-semibold">{formatDate(log.startDate)}</td>
                                                        <td className="px-3 py-3 text-slate-700 text-xs font-semibold">{formatDate(log.endDate)}</td>
                                                        <td className="px-3 py-3 text-slate-600 text-xs italic max-w-[180px] truncate" title={log.reason}>{log.reason}</td>
                                                        <td className="px-3 py-3">
                                                            {log.status === 'approved' ? (
                                                                <Badge color="emerald" label="Approved" />
                                                            ) : log.status === 'rejected' ? (
                                                                <Badge color="rose" label="Rejected" />
                                                            ) : (
                                                                <Badge color="amber" label="Pending" />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── PAYROLL REPORT VIEW ── */}
                    {reportType === 'payroll' && (
                        <PayrollDashboard
                            payrollData={payrollData}
                            payrollSummary={payrollSummary}
                            formatCurrency={formatCurrency}
                            filters={filters}
                        />
                    )}

                    {/* ── AUDIT HISTORY VIEW ── */}
                    {reportType === 'audit' && (
                        <motion.div
                            key="audit"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-red-500 dark:text-red-400" />
                                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Absence & Payroll Audit History</h3>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                    Comprehensive Automated Actions Trail
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                                            <th className="px-3 py-3">Employee</th>
                                            <th className="px-3 py-3">Warning Status</th>
                                            <th className="px-3 py-3 text-center">Unapproved Absences</th>
                                            <th className="px-3 py-3 text-right text-red-600 dark:text-red-400">Total Deduction</th>
                                            <th className="px-3 py-3">Deduction Reasons</th>
                                            <th className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">Net Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {payrollData.map((p) => {
                                            // Find all deductions for this employee
                                            const empDeductions = payrollDeductions.filter(d => {
                                                const dEmpId = String(d.employee?._id || d.employee || '');
                                                return dEmpId === String(p.employee._id);
                                            });

                                            return (
                                                <tr key={p.employee._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.employee.name}</span>
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{p.employee.department}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {p.employee.hasReceivedAbsenceWarning ? (
                                                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-md text-[10px] font-bold">
                                                                Warning Issued
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold">
                                                                No Warning
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{empDeductions.length} recorded</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <span className={`font-bold text-xs tabular-nums ${p.absenceDeduction > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {p.absenceDeduction > 0 ? `-${formatCurrency(p.absenceDeduction)}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {empDeductions.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {empDeductions.map(d => (
                                                                    <div key={d._id} className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600 flex justify-between items-center w-full max-w-[200px]">
                                                                        <span className="truncate mr-2" title={d.reason}>{d.reason}</span>
                                                                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(d.date)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">{formatCurrency(p.netSalary)}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ── EMPLOYEE DIRECTORY REPORT VIEW ── */}
                    {reportType === 'employee' && (
                        <div className="space-y-6">
                            {/* Summary Cards (Interactive Filters) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    icon={Users}
                                    label="Total Headcount"
                                    value={employeeSummary.total}
                                    color="indigo"
                                    isActive={directoryStatusFilter === 'all'}
                                    onClick={() => setDirectoryStatusFilter('all')}
                                />
                                <SummaryCard
                                    icon={UserCheck}
                                    label="Full Time Staff"
                                    value={employeeSummary.fullTime}
                                    color="emerald"
                                    isActive={directoryStatusFilter === 'full time'}
                                    onClick={() => setDirectoryStatusFilter('full time')}
                                />
                                <SummaryCard
                                    icon={Clock}
                                    label="On Probation"
                                    value={employeeSummary.probation}
                                    color="amber"
                                    isActive={directoryStatusFilter === 'probation'}
                                    onClick={() => setDirectoryStatusFilter('probation')}
                                />
                                <SummaryCard
                                    icon={Briefcase}
                                    label="Internships"
                                    value={employeeSummary.internship}
                                    color="rose"
                                    isActive={directoryStatusFilter === 'internship'}
                                    onClick={() => setDirectoryStatusFilter('internship')}
                                />
                            </div>

                            {/* Department Breakdown Visual */}
                            {Object.keys(employeeSummary.deptCount).length > 0 && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                                        Department Employee Distribution
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {Object.entries(employeeSummary.deptCount).map(([dept, count]) => {
                                            const pct = Math.round((count / employeeSummary.total) * 100);
                                            return (
                                                <div key={dept} className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{dept}</p>
                                                        <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{count} <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">staff</span></p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                                        {pct}%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Directory Listing Table */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden space-y-0">
                                {/* Header Controls & Search Bar */}
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/80">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200">Staff Directory Index</h2>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Showing {displayedEmployees.length} of {employees.length} total staff profiles</p>
                                        </div>
                                    </div>

                                    {/* Filters & Search */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Status Pills */}
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1 shadow-2xs">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'full time', label: 'Full Time' },
                                                { id: 'probation', label: 'On Probation' },
                                                { id: 'internship', label: 'Internship' },
                                            ].map(pill => (
                                                <button
                                                    key={pill.id}
                                                    onClick={() => setDirectoryStatusFilter(pill.id)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        directoryStatusFilter === pill.id
                                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {pill.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Search Input */}
                                        <div className="relative min-w-[200px]">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Search staff, email, phone..."
                                                value={directorySearch}
                                                onChange={e => setDirectorySearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {displayedEmployees.length === 0 ? (
                                    <EmptyState msg="No staff members match your search or filters." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-extrabold tracking-wider">
                                                    <th className="px-4 py-3">Employee</th>
                                                    <th className="px-3 py-3">Department</th>
                                                    <th className="px-3 py-3">Contact Info</th>
                                                    <th className="px-3 py-3 text-indigo-600 dark:text-indigo-400">Base Salary</th>
                                                    <th className="px-3 py-3">Status</th>
                                                    <th className="px-3 py-3">Hired Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {displayedEmployees.map(emp => (
                                                    <tr key={emp._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                {emp.photo ? (
                                                                    <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200 dark:border-indigo-500/20">
                                                                        {emp.name?.[0]?.toUpperCase() || 'U'}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{emp.name}</span>
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{emp.role}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg truncate inline-block">
                                                                {emp.department || 'General'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-col text-slate-600 dark:text-slate-400 text-[11px] leading-normal min-w-0">
                                                                <span className="font-medium truncate">{emp.email}</span>
                                                                <span className="truncate">{emp.phone || 'No phone'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-800 dark:text-slate-200 text-xs font-bold tabular-nums">{formatCurrency(emp.salary)}</td>
                                                        <td className="px-3 py-3">
                                                            {emp.status === 'full time' ? (
                                                                <Badge color="emerald" label="Full Time" />
                                                            ) : emp.status === 'probation' ? (
                                                                <Badge color="amber" label="On Probation" />
                                                            ) : (
                                                                <Badge color="slate" label="Internship" />
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                                                            {emp.createdAt ? formatDate(emp.createdAt) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

// ── Summary Card Component ───────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, color, isActive = false, onClick }) => {
    const colors = {
        indigo: { bg: 'bg-indigo-50/50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500 dark:text-indigo-400', border: 'border-indigo-100/50 dark:border-indigo-500/20', activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-500/20 dark:border-indigo-400' },
        emerald: { bg: 'bg-emerald-50/50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-100/50 dark:border-emerald-500/20', activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20 dark:bg-emerald-500/20 dark:border-emerald-400' },
        amber: { bg: 'bg-amber-50/50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-500', icon: 'text-amber-500 dark:text-amber-400', border: 'border-amber-100/50 dark:border-amber-500/20', activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20 dark:bg-amber-500/20 dark:border-amber-400' },
        rose: { bg: 'bg-rose-50/50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: 'text-rose-500 dark:text-rose-400', border: 'border-rose-100/50 dark:border-rose-500/20', activeBorder: 'border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-50/20 dark:bg-rose-500/20 dark:border-rose-400' },
        slate: { bg: 'bg-slate-50/50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500 dark:text-slate-400', border: 'border-slate-100/50 dark:border-slate-500/20', activeBorder: 'border-slate-500 ring-2 ring-slate-500/20 shadow-md bg-slate-50/20 dark:bg-slate-500/20 dark:border-slate-400' },
    };
    const c = colors[color] || colors.slate;
    const Component = onClick ? 'button' : 'div';
    return (
        <Component
            onClick={onClick}
            className={`w-full text-left bg-white dark:bg-slate-800 border ${isActive ? c.activeBorder : c.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 ${onClick ? 'cursor-pointer group' : ''}`}
        >
            <div className={`w-11 h-11 ${c.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                <Icon size={20} className={c.icon} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-xl font-black mt-0.5 tracking-tight ${c.text}`}>{value}</p>
            </div>
        </Component>
    );
};

// ── Badge Component ────────────────────────────────────────
const Badge = ({ color, label }) => {
    const colors = {
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-100 dark:border-amber-500/20',
        rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
        slate: 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-600',
    };
    return (
        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm ${colors[color] || colors.slate}`}>
            {label}
        </span>
    );
};

// ── Empty State Component ─────────────────────────────────
const EmptyState = ({ msg }) => (
    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
        <FileText size={44} className="mb-4 text-slate-200" />
        <p className="text-sm font-semibold text-slate-500">{msg || "No records found matching filters."}</p>
        <p className="text-xs text-slate-400 mt-1">Try expanding or clearing the filters above.</p>
    </div>
);

// ── Payslip Receipt Modal Component ──────────────────────────────────────────
const PayslipModal = ({ payslip, onClose, formatCurrency }) => {
    if (!payslip) return null;
    const { employee, baseSalary, presentDays, lateCount, lateDeduction, leaveDays, unpaidLeaveDays = 0, leaveDeduction, loanDeduction = 0, deduction, netSalary } = payslip;
    const dailyRate = Math.round(baseSalary / 30);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden z-10 p-5 sm:p-6"
            >
                {/* Header (Pinned) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none">
                            <Banknote size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-snug">Official Payslip Voucher</h2>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Itemized Monthly Salary Statement</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Scrollable Modal Body */}
                <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
                    {/* Employee Profile Header */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {employee.photo ? (
                                <img src={employee.photo} alt={employee.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-xs" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-sm border-2 border-white dark:border-slate-800 shadow-xs">
                                    {employee.name?.[0]}
                                </div>
                            )}
                            <div>
                                <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{employee.name}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-400">{employee.email}</p>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 px-2 py-0.5 rounded-full capitalize mt-0.5 inline-block">
                                    {employee.department || 'General'} &nbsp;·&nbsp; {employee.status || 'Full Time'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Earnings & Allowances */}
                    <div className="space-y-1.5">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Earnings &amp; Allowances</h3>
                        <div className="bg-indigo-50/40 dark:bg-indigo-500/10 rounded-xl p-3 border border-indigo-100/60 dark:border-indigo-500/20 space-y-1.5 text-xs">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                                <span>Monthly Base Salary</span>
                                <span className="text-slate-900 dark:text-slate-100 font-black">{formatCurrency(baseSalary)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-indigo-100/40 dark:border-indigo-500/20">
                                <span>Calculated Daily Rate (Base / 30)</span>
                                <span>{formatCurrency(dailyRate)} / day</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions Breakdown */}
                    <div className="space-y-1.5">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deductions Breakdown</h3>
                        <div className="bg-rose-50/40 dark:bg-rose-500/10 rounded-xl p-3 border border-rose-100/60 dark:border-rose-500/20 space-y-2 text-xs">
                            {/* Leave Deduction */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Leave Deduction</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                        {leaveDays} approved leave {leaveDays === 1 ? 'day' : 'days'} taken
                                        {unpaidLeaveDays > 0
                                            ? ` · ${unpaidLeaveDays} excess day${unpaidLeaveDays > 1 ? 's' : ''} beyond quota × ${formatCurrency(dailyRate)}`
                                            : ' · All within allocated quota (Paid Leave)'}
                                    </p>
                                </div>
                                <span className={`font-bold tabular-nums ${unpaidLeaveDays > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {unpaidLeaveDays > 0 ? `-${formatCurrency(leaveDeduction)}` : '₨ 0'}
                                </span>
                            </div>

                            {/* Late Deduction */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-rose-100/40 dark:border-rose-500/20">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Late Arrival Penalty</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{lateCount} late check-in {lateCount === 1 ? 'entry' : 'entries'} × 0.25 day rate</p>
                                </div>
                                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                    {lateCount > 0 ? `-${formatCurrency(lateDeduction)}` : '₨ 0'}
                                </span>
                            </div>

                            {/* Loan Deduction */}
                            {loanDeduction > 0 && (
                                <div className="flex justify-between items-center pt-1.5 border-t border-rose-100/40 dark:border-rose-500/20">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">Loan Installment Deduction</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Monthly installment towards active loan</p>
                                    </div>
                                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                        -{formatCurrency(loanDeduction)}
                                    </span>
                                </div>
                            )}

                            {/* Total Deductions */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-rose-200/60 dark:border-rose-500/30 font-black text-rose-700 dark:text-rose-400 text-xs">
                                <span>Total Deductions</span>
                                <span className="tabular-nums">-{formatCurrency(deduction)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Payout Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md shadow-emerald-100 dark:shadow-none">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Net Disbursed Salary</p>
                            <p className="text-xl font-black">{formatCurrency(netSalary)}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-white/20 rounded-xl text-[11px] font-bold border border-white/30 backdrop-blur-sm">
                            Paid Out
                        </span>
                    </div>
                </div>

                {/* Action Footer (Pinned) */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 shrink-0 mt-auto">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={14} /> Print Payslip
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ── Payroll Dashboard Component (CEO-Grade & Interactive) ────────────────────
const PayrollDashboard = ({ payrollData, payrollSummary, formatCurrency, filters }) => {
    const [view, setView] = useState('table'); // 'table' | 'cards'
    const [deductionFilter, setDeductionFilter] = useState('all'); // 'all' | 'leave' | 'late' | 'deduction'
    const [payrollSearch, setPayrollSearch] = useState('');
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const deductionRate = payrollSummary.totalBase > 0
        ? ((payrollSummary.totalDeductions / payrollSummary.totalBase) * 100).toFixed(1)
        : 0;

    const totalAbsenceDeductionsAmount = payrollSummary.totalAbsenceDeductions || 0;

    const efficiencyRate = payrollSummary.totalBase > 0
        ? ((payrollSummary.totalNet / payrollSummary.totalBase) * 100).toFixed(1)
        : 100;

    const filteredPayroll = useMemo(() => {
        if (deductionFilter === 'leave') return payrollData.filter(p => p.leaveDays > 0);
        if (deductionFilter === 'late') return payrollData.filter(p => p.lateCount > 0);
        if (deductionFilter === 'absence') return payrollData.filter(p => p.absenceDeduction > 0);
        if (deductionFilter === 'deduction') return payrollData.filter(p => p.deduction > 0);
        return payrollData;
    }, [payrollData, deductionFilter]);

    const searchedPayroll = useMemo(() => {
        let list = filteredPayroll;
        if (payrollSearch.trim()) {
            const q = payrollSearch.toLowerCase();
            list = list.filter(p => 
                p.employee?.name?.toLowerCase().includes(q) ||
                p.employee?.email?.toLowerCase().includes(q) ||
                p.employee?.department?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [filteredPayroll, payrollSearch]);

    const totalLeaveDays = payrollData.reduce((acc, curr) => acc + curr.leaveDays, 0);
    const totalLateEntries = payrollData.reduce((acc, curr) => acc + curr.lateCount, 0);

    const deptCostEntries = Object.entries(payrollSummary.deptCost).sort(([, a], [, b]) => b - a);
    const maxDeptCost = deptCostEntries.length > 0 ? deptCostEntries[0][1] : 1;

    const DEPT_COLORS = [
        { bar: 'from-indigo-500 to-violet-500', text: 'text-indigo-600', bg: 'bg-indigo-50' },
        { bar: 'from-emerald-500 to-teal-500',  text: 'text-emerald-600', bg: 'bg-emerald-50' },
        { bar: 'from-amber-500 to-orange-500',  text: 'text-amber-600', bg: 'bg-amber-50' },
        { bar: 'from-rose-500 to-pink-500',     text: 'text-rose-600', bg: 'bg-rose-50' },
        { bar: 'from-sky-500 to-blue-500',      text: 'text-sky-600', bg: 'bg-sky-50' },
        { bar: 'from-purple-500 to-fuchsia-500',text: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

    return (
        <div className="space-y-6">

            {/* ── Header Title & Active Filter Tag ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                        <Banknote size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Payroll Executive Dashboard</h2>
                        <p className="text-xs text-slate-400">Monthly Base, Leave &amp; Attendance Deduction Audit</p>
                    </div>
                </div>

                {deductionFilter !== 'all' && (
                    <button
                        onClick={() => setDeductionFilter('all')}
                        className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                        <span>
                            Showing: {
                                deductionFilter === 'leave' ? 'Employees with Leave Deductions' :
                                deductionFilter === 'late' ? 'Employees with Late Deductions' :
                                'Employees with Any Deductions'
                            }
                        </span>
                        <span className="font-black text-sm">&times;</span>
                    </button>
                )}
            </div>

            {/* ── Deductions Audit & Department Cost Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Deductions Detailed Audit Box (2 cols) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500 dark:text-rose-400" /> Deductions Audit
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-2.5 py-1 rounded-lg uppercase">
                            {deductionRate}% of Budget
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Leave Deductions Bar */}
                        <div className="space-y-1.5 bg-amber-50/50 dark:bg-amber-500/10 p-3.5 rounded-xl border border-amber-100 dark:border-amber-500/20">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Calendar size={13} className="text-amber-600 dark:text-amber-400" /> Unpaid Leave Deductions
                                </span>
                                <span className="font-black text-amber-700 dark:text-amber-400 tabular-nums">-{formatCurrency(payrollSummary.totalLeaveDeductions)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                <span>{totalLeaveDays} approved leave days</span>
                                <span>1.0x daily rate deduction</span>
                            </div>
                        </div>

                        {/* Late Deductions Bar */}
                        <div className="space-y-1.5 bg-rose-50/50 dark:bg-rose-500/10 p-3.5 rounded-xl border border-rose-100 dark:border-rose-500/20">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Clock size={13} className="text-rose-600 dark:text-rose-400" /> Late Arrival Penalty
                                </span>
                                <span className="font-black text-rose-700 dark:text-rose-400 tabular-nums">-{formatCurrency(payrollSummary.totalLateDeductions)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                <span>{totalLateEntries} late check-ins (&gt;12:00 PM)</span>
                                <span>0.25x daily rate penalty</span>
                            </div>
                        </div>

                        {/* Absence Deductions Bar */}
                        <div className="space-y-1.5 bg-red-50/50 dark:bg-red-500/10 p-3.5 rounded-xl border border-red-100 dark:border-red-500/20">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <AlertTriangle size={13} className="text-red-600 dark:text-red-400" /> Unapproved Absences
                                </span>
                                <span className="font-black text-red-700 dark:text-red-400 tabular-nums">-{formatCurrency(totalAbsenceDeductionsAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                <span>Missing check-ins</span>
                                <span>1.0x daily rate penalty</span>
                            </div>
                        </div>

                        {/* Total Audit Summary */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-black">
                            <span className="text-slate-700 dark:text-slate-200">Combined Deductions Total</span>
                            <span className="text-rose-600 dark:text-rose-400 text-sm tabular-nums">-{formatCurrency(payrollSummary.totalDeductions)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Department Cost Distribution (3 cols) */}
                {deptCostEntries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Building2 size={16} className="text-indigo-600" /> Department Net Payout Budget
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase">
                                Net Disbursed
                            </span>
                        </div>

                        <div className="space-y-4">
                            {deptCostEntries.map(([dept, cost], i) => {
                                const pct = Math.round((cost / maxDeptCost) * 100);
                                const shareOfTotal = payrollSummary.totalNet > 0
                                    ? ((cost / payrollSummary.totalNet) * 100).toFixed(1)
                                    : 0;
                                const col = DEPT_COLORS[i % DEPT_COLORS.length];
                                return (
                                    <div key={dept} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${col.bar} flex-shrink-0`} />
                                                <span className="text-sm font-bold text-slate-700 capitalize">{dept}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-right">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${col.bg} ${col.text}`}>{shareOfTotal}%</span>
                                                <span className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(cost)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.07 }}
                                                className={`h-full bg-gradient-to-r ${col.bar} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            
            {/* ── 4 Interactive KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                {/* Gross Base Budget Card */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    onClick={() => setDeductionFilter('all')}
                    className={`text-left relative overflow-hidden bg-white border rounded-2xl p-5 transition-all cursor-pointer group ${
                        deductionFilter === 'all'
                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md bg-indigo-50/10'
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${deductionFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Wallet size={20} />
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                            {payrollData.length} Staff
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Base Budget</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight mt-1">{formatCurrency(payrollSummary.totalBase)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Total monthly committed payroll</p>
                </motion.button>

                {/* Leave Deductions Card */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    onClick={() => setDeductionFilter('leave')}
                    className={`text-left relative overflow-hidden bg-white border rounded-2xl p-5 transition-all cursor-pointer group ${
                        deductionFilter === 'leave'
                            ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-md bg-amber-50/10'
                            : 'border-amber-100 hover:border-amber-300 hover:shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${deductionFilter === 'leave' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'}`}>
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                            {totalLeaveDays} Days
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Leave Deductions</p>
                    <p className="text-2xl font-black text-amber-700 tracking-tight mt-1">-{formatCurrency(payrollSummary.totalLeaveDeductions)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">From approved unpaid leaves</p>
                </motion.button>

                {/* Late Entry Deductions Card */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    onClick={() => setDeductionFilter('late')}
                    className={`text-left relative overflow-hidden bg-white border rounded-2xl p-5 transition-all cursor-pointer group ${
                        deductionFilter === 'late'
                            ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-md bg-rose-50/10'
                            : 'border-rose-100 hover:border-rose-300 hover:shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${deductionFilter === 'late' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'}`}>
                            <Clock size={20} />
                        </div>
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                            {totalLateEntries} Late
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Late Deductions</p>
                    <p className="text-2xl font-black text-rose-700 tracking-tight mt-1">-{formatCurrency(payrollSummary.totalLateDeductions)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">0.25 day rate per late check-in</p>
                </motion.button>

                {/* Absence Deductions Card */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    onClick={() => setDeductionFilter('absence')}
                    className={`text-left relative overflow-hidden bg-white border rounded-2xl p-5 transition-all cursor-pointer group ${
                        deductionFilter === 'absence'
                            ? 'border-red-500 ring-2 ring-red-500/10 shadow-md bg-red-50/10'
                            : 'border-red-100 hover:border-red-300 hover:shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${deductionFilter === 'absence' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Absence Deductions</p>
                    <p className="text-2xl font-black text-red-700 tracking-tight mt-1">-{formatCurrency(totalAbsenceDeductionsAmount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Unapproved absences</p>
                </motion.button>

                {/* Net Payout Card */}
                <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                    onClick={() => setDeductionFilter('deduction')}
                    className={`text-left relative overflow-hidden bg-white border rounded-2xl p-5 transition-all cursor-pointer group ${
                        deductionFilter === 'deduction'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-md bg-emerald-50/10'
                            : 'border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${deductionFilter === 'deduction' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                            {efficiencyRate}% Disbursed
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Net Disbursed Payout</p>
                    <p className="text-2xl font-black text-emerald-700 tracking-tight mt-1">{formatCurrency(payrollSummary.totalNet)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Total final payroll disbursement</p>
                </motion.button>

            </div>

            {/* ── View Switcher & Counter & Search Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-black text-slate-800">Employee Salary Sheet</h3>
                    <p className="text-xs text-slate-400">Showing {searchedPayroll.length} of {payrollData.length} records</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search Input */}
                    <div className="relative min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employee, dept..."
                            value={payrollSearch}
                            onChange={e => setPayrollSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                        />
                    </div>
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setView('table')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${view === 'table' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >Table View</button>
                        <button
                            onClick={() => setView('cards')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${view === 'cards' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >Cards View</button>
                    </div>
                </div>
            </div>

            {/* ── Employee Payslip Cards View ── */}
            <AnimatePresence mode="wait">
            {view === 'cards' && (
                <motion.div
                    key="cards"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                    {searchedPayroll.length === 0 ? (
                        <div className="col-span-full"><EmptyState msg="No employee payroll records match the selected filter." /></div>
                    ) : searchedPayroll.map((p, i) => {
                        const col = DEPT_COLORS[i % DEPT_COLORS.length];
                        return (
                            <motion.div
                                key={p.employee._id}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                onClick={() => setSelectedPayslip(p)}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                            >
                                <div className={`h-1.5 w-full bg-gradient-to-r ${col.bar}`} />

                                <div className="p-5 space-y-4">
                                    {/* Employee info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {p.employee.photo ? (
                                                <img src={p.employee.photo} alt={p.employee.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs border border-indigo-200">
                                                    {getInitials(p.employee.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{p.employee.name}</p>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${col.bg} ${col.text} inline-block capitalize`}>
                                                    {p.employee.department || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={18} />
                                        </span>
                                    </div>

                                    {/* Deduction Detail Breakdown Cards */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Monthly Base</span>
                                            <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(p.baseSalary)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                                                <Calendar size={12} /> Leave ({p.leaveDays}d)
                                            </span>
                                            <span className="font-bold text-amber-600 tabular-nums">
                                                {p.leaveDays > 0 ? `-${formatCurrency(p.leaveDeduction)}` : '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                                                <Clock size={12} /> Late ({p.lateCount}x)
                                            </span>
                                            <span className="font-bold text-rose-600 tabular-nums">
                                                {p.lateCount > 0 ? `-${formatCurrency(p.lateDeduction)}` : '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-red-600 font-semibold flex items-center gap-1">
                                                <AlertTriangle size={12} /> Absence
                                            </span>
                                            <span className="font-bold text-red-600 tabular-nums">
                                                {p.absenceDeduction > 0 ? `-${formatCurrency(p.absenceDeduction)}` : '—'}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-emerald-600 font-black">Net Disbursed</span>
                                            <span className="font-black text-emerald-600 text-sm tabular-nums">{formatCurrency(p.netSalary)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Table View ── */}
            {view === 'table' && (
                <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={14} className="text-indigo-500 dark:text-indigo-400" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Monthly Salary Audit Sheet</h3>
                        </div>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                            {searchedPayroll.length} entries
                        </span>
                    </div>

                    {searchedPayroll.length === 0 ? (
                        <EmptyState msg="No payroll records match the selected filter." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                                        <th className="px-3 py-3">Employee</th>
                                        <th className="px-3 py-3">Dept</th>
                                        <th className="px-3 py-3 text-right">Gross Base</th>
                                        <th className="px-3 py-3 text-center text-amber-600 dark:text-amber-500">Leave Ded.</th>
                                        <th className="px-3 py-3 text-center text-rose-500 dark:text-rose-400">Late Ded.</th>
                                        <th className="px-3 py-3 text-center text-red-500 dark:text-red-400">Absence Ded.</th>
                                        <th className="px-3 py-3 text-center text-rose-500 dark:text-rose-400">Loan Ded.</th>
                                        <th className="px-3 py-3 text-right text-rose-600 dark:text-rose-400">Total Ded.</th>
                                        <th className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">Net Payout</th>
                                        <th className="px-3 py-3 text-center">Payslip</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {searchedPayroll.map((p) => (
                                        <tr
                                            key={p.employee._id}
                                            className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                            onClick={() => setSelectedPayslip(p)}
                                        >
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    {p.employee.photo ? (
                                                        <img src={p.employee.photo} alt={p.employee.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                                                            {getInitials(p.employee.name)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{p.employee.name}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{p.employee.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                                                    {p.employee.department || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs tabular-nums">{formatCurrency(p.baseSalary)}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {p.leaveDays > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 font-bold text-[10px] rounded-md border border-amber-100 dark:border-amber-500/20">
                                                            {p.leaveDays} {p.leaveDays === 1 ? 'day' : 'days'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 mt-0.5 tabular-nums">-{formatCurrency(p.leaveDeduction)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {p.lateCount > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[10px] rounded-md border border-rose-100 dark:border-rose-500/20">
                                                            {p.lateCount} {p.lateCount === 1 ? 'late' : 'lates'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">-{formatCurrency(p.lateDeduction)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {p.absenceDeduction > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5 tabular-nums">-{formatCurrency(p.absenceDeduction)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {p.loanDeduction > 0 ? (
                                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">-{formatCurrency(p.loanDeduction)}</span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className={`font-bold text-xs tabular-nums ${p.deduction > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {p.deduction > 0 ? `-${formatCurrency(p.deduction)}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">{formatCurrency(p.netSalary)}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedPayslip(p); }}
                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] rounded-lg border border-indigo-100 dark:border-indigo-500/20 transition-colors cursor-pointer"
                                                >
                                                    Payslip
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-600">
                                    <tr>
                                        <td className="px-3 py-3 font-black text-slate-800 dark:text-slate-200 text-xs" colSpan={2}>Totals & Averages</td>
                                        <td className="px-3 py-3 text-right font-black text-slate-800 dark:text-slate-200 text-xs tabular-nums">{formatCurrency(payrollSummary.totalBase)}</td>
                                        <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-500 text-[11px] tabular-nums">-{formatCurrency(payrollSummary.totalLeaveDeductions)}</td>
                                        <td className="px-3 py-3 text-center font-bold text-rose-600 dark:text-rose-400 text-[11px] tabular-nums">-{formatCurrency(payrollSummary.totalLateDeductions)}</td>
                                        <td className="px-3 py-3 text-right font-black text-rose-600 dark:text-rose-400 text-xs tabular-nums">-{formatCurrency(payrollSummary.totalDeductions)}</td>
                                        <td className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">{formatCurrency(payrollSummary.totalNet)}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                                {efficiencyRate}%
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>

            {/* Payslip Voucher Modal */}
            <AnimatePresence>
                {selectedPayslip && (
                    <PayslipModal
                        payslip={selectedPayslip}
                        onClose={() => setSelectedPayslip(null)}
                        formatCurrency={formatCurrency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default HRReports;

