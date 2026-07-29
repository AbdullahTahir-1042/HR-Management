import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart2, Users, Clock, AlertCircle, Filter, Calendar, 
    DollarSign, ClipboardList, Download, CheckCircle, XCircle, 
    AlertTriangle, Building2, UserCheck, Search, Briefcase, FileText,
    Banknote, Wallet, ChevronRight, TrendingUp
} from 'lucide-react';
import apiClient from '../../api/axiosClient';

const HRReports = ({ employees }) => {
    // ── Report Type Tab ─────────────────────────────────────
    const [reportType, setReportType] = useState('attendance'); // 'attendance', 'leave', 'payroll', 'employee'

    // ── State ──────────────────────────────────────────────
    const [records, setRecords] = useState([]);
    const [leaveRecords, setLeaveRecords] = useState([]);
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

    // ── Fetch data depending on active report ────────────────
    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.employeeId) params.employeeId = filters.employeeId;

            // Fetch attendance with date filters, leaves without (to never miss new approvals)
            await Promise.all([
                fetchAttendanceReport(params),
                fetchLeaveReport(filters.employeeId)
            ]);
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
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
                fetchLeaveReport(filters.employeeId)
            ]);
        } catch (err) {
            console.error('Error refreshing report data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [filters.startDate, filters.endDate, filters.employeeId]); // Refetch on core filter change

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
        return filterByDept(leaveRecords, 'employee');
    }, [leaveRecords, filters.department]);

    const filteredEmployees = useMemo(() => {
        let list = employees.filter(e => e.role === 'employee');
        if (filters.department) {
            list = list.filter(e => e.department?.toLowerCase() === filters.department.toLowerCase());
        }
        if (filters.employeeId) {
            list = list.filter(e => e._id === filters.employeeId);
        }
        return list;
    }, [employees, filters.department, filters.employeeId]);

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

        const SHIFT_START_HOUR = 9;
        const SHIFT_START_MIN = 15;
        const lateArrivals = filteredAttendance.filter(r => {
            if (!r.checkIn) return false;
            const t = new Date(r.checkIn);
            const h = t.getHours();
            const m = t.getMinutes();
            return h > SHIFT_START_HOUR || (h === SHIFT_START_HOUR && m > SHIFT_START_MIN);
        }).length;

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

            const SHIFT_START_HOUR = 9;
            const SHIFT_START_MIN = 15;
            const lateCount = empAttendance.filter(r => {
                if (!r.checkIn) return false;
                const t = new Date(r.checkIn);
                const h = t.getHours();
                const m = t.getMinutes();
                return h > SHIFT_START_HOUR || (h === SHIFT_START_HOUR && m > SHIFT_START_MIN);
            }).length;

            // Late penalty: 0.25 * dailyRate per late check-in
            const lateDeduction = Math.round(lateCount * (dailyRate * 0.25));

            // 2. Find approved leaves for this employee within the selected date range
            const empLeaves = filteredLeaves.filter(l => {
                const lEmpId = String(l.employee?._id || l.employee || '');
                return lEmpId === empIdStr && (l.status?.toLowerCase() === 'approved');
            });

            // 3. Compute total leave days taken per leave type (within the filter period)
            const rangeStart = filters.startDate ? new Date(filters.startDate) : null;
            const rangeEnd = filters.endDate ? new Date(filters.endDate) : null;

            // Group leave days used per leaveType
            const leaveUsedByType = {}; // { leaveTypeId: { days, quota } }
            let totalLeaveDays = 0;

            empLeaves.forEach(l => {
                const leaveStart = new Date(l.startDate);
                const leaveEnd = new Date(l.endDate);

                // Find intersection of leave range and filter date range
                const start = rangeStart && leaveStart < rangeStart ? rangeStart : leaveStart;
                const end = rangeEnd && leaveEnd > rangeEnd ? rangeEnd : leaveEnd;

                if (start <= end) {
                    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                    const diffTime = e - s;
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    const days = Math.max(1, diffDays);
                    totalLeaveDays += days;

                    // Track per leave type for quota comparison
                    const typeId = String(l.leaveType?._id || l.leaveType || 'unknown');
                    const quota = Number(l.leaveType?.quota) || 0;
                    if (!leaveUsedByType[typeId]) {
                        leaveUsedByType[typeId] = { days: 0, quota };
                    }
                    leaveUsedByType[typeId].days += days;
                }
            });

            // 4. Only deduct salary for EXCESS days beyond quota (unpaid leave)
            //    Leaves within quota are PAID — no deduction.
            let unpaidLeaveDays = 0;
            Object.values(leaveUsedByType).forEach(({ days, quota }) => {
                const excess = Math.max(0, days - quota);
                unpaidLeaveDays += excess;
            });

            const leaveDeduction = Math.round(dailyRate * unpaidLeaveDays);
            const totalDeduction = leaveDeduction + lateDeduction;
            const netSalary = Math.max(0, baseSalary - totalDeduction);

            return {
                employee: emp,
                baseSalary,
                presentDays,
                lateCount,
                lateDeduction,
                leaveDays: totalLeaveDays,         // total approved leave days (for display)
                unpaidLeaveDays,                    // excess days that are actually deducted
                leaveDeduction,
                deduction: totalDeduction,
                netSalary
            };
        });
    }, [filteredEmployees, filteredAttendance, filteredLeaves, filters.startDate, filters.endDate]);

    const payrollSummary = useMemo(() => {
        const totalBase = payrollData.reduce((acc, curr) => acc + curr.baseSalary, 0);
        const totalDeductions = payrollData.reduce((acc, curr) => acc + curr.deduction, 0);
        const totalLeaveDeductions = payrollData.reduce((acc, curr) => acc + curr.leaveDeduction, 0);
        const totalLateDeductions = payrollData.reduce((acc, curr) => acc + curr.lateDeduction, 0);
        const totalNet = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
        const avgNet = payrollData.length > 0 ? Math.round(totalNet / payrollData.length) : 0;

        // Cost by department
        const deptCost = {};
        payrollData.forEach(p => {
            const dept = p.employee?.department || 'Other';
            deptCost[dept] = (deptCost[dept] || 0) + p.netSalary;
        });

        return { totalBase, totalDeductions, totalLeaveDeductions, totalLateDeductions, totalNet, avgNet, deptCost };
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

    // ── Attendance Chart (last 14 days dynamic counts) ──────
    const chartData = useMemo(() => {
        const grouped = {};
        filteredAttendance.forEach(r => {
            grouped[r.date] = (grouped[r.date] || 0) + 1;
        });

        const sorted = Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-14);

        const maxCount = Math.max(...sorted.map(([, c]) => c), 1);

        return sorted.map(([date, count]) => ({
            date: date.slice(5), // MM-DD
            count,
            heightPercent: Math.round((count / maxCount) * 100)
        }));
    }, [filteredAttendance]);

    // ── Formatter Helpers ───────────────────────────────────
    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const calcHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '—';
        const diff = new Date(checkOut) - new Date(checkIn);
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h ${m}m`;
    };

    const SHIFT_START_HOUR = 9;
    const SHIFT_START_MIN = 15;
    const isLate = (checkIn) => {
        if (!checkIn) return false;
        const t = new Date(checkIn);
        const h = t.getHours();
        const m = t.getMinutes();
        return h > SHIFT_START_HOUR || (h === SHIFT_START_HOUR && m > SHIFT_START_MIN);
    };

    const formatCurrency = (val) => {
        return `₨ ${Number(val).toLocaleString()}`;
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
                    ['Probation Status', `${employeeSummary.probation} staff`],
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
                    !r.checkIn ? 'Absent' : isLate(r.checkIn) ? 'Late' : !r.checkOut ? 'Active' : 'Present'
                ]);
            } else if (reportType === 'leave') {
                tableHeaders = [['Employee', 'Department', 'Start Date', 'End Date', 'Reason', 'Status']];
                tableRows = filteredLeaves.map(l => [
                    `${l.employee?.name || '—'}\n(${l.employee?.email || '—'})`,
                    l.employee?.department || '—',
                    l.startDate ? new Date(l.startDate).toLocaleDateString() : '—',
                    l.endDate ? new Date(l.endDate).toLocaleDateString() : '—',
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
                    e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'
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

    // ── Report Type Metadata ───────────────────────────────
    const reportTypesMeta = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardList },
        { id: 'leave', label: 'Leave Requests', icon: Calendar },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'employee', label: 'Staff Directory', icon: Users },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ── Heading ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports Dashboard</h1>
                    <p className="text-sm text-slate-400">Generate, analyze, and export HR and employee reports</p>
                </div>
                <button
                    onClick={exportToPDF}
                    disabled={loading}
                    className="self-start md:self-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                    <Download size={16} /> Export to PDF
                </button>
            </div>

            {/* ── Report Type Switcher ── */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
                {reportTypesMeta.map((type) => {
                    const Icon = type.icon;
                    const isActive = reportType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setReportType(type.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={16} />
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter size={15} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Filters</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh report data"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all disabled:opacity-60"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                            {refreshing ? 'Syncing...' : 'Refresh'}
                        </button>
                        {(filters.startDate || filters.endDate || filters.employeeId || filters.department) && (
                            <button
                                onClick={() => setFilters({ startDate: defaultDateRange.firstDay, endDate: defaultDateRange.lastDay, employeeId: '', department: '' })}
                                className="text-xs text-slate-400 hover:text-rose-500 font-semibold transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">From Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50/50"
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">To Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50/50"
                            />
                        </div>
                    </div>

                    {/* Department Dropdown */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Department</label>
                        <select
                            value={filters.department}
                            onChange={e => setFilters({ ...filters, department: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50/50 capitalize"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Employee Dropdown */}
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Employee Name</label>
                        <select
                            value={filters.employeeId}
                            onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50/50"
                        >
                            <option value="">All Employees</option>
                            {employees.filter(e => e.role === 'employee').map(emp => (
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
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard icon={Users} label="Total Attendance" value={attendanceSummary.total} color="indigo" />
                                <SummaryCard icon={Clock} label="Avg Active Hours" value={`${attendanceSummary.avgHours} hrs`} color="emerald" />
                                <SummaryCard icon={AlertTriangle} label="Late Arrivals" value={attendanceSummary.lateArrivals} color="amber" />
                                <SummaryCard icon={UserCheck} label="Active Work Sessions" value={attendanceSummary.activeSessions} color="rose" />
                            </div>

                            {/* Chart (Visual presence history) */}
                            {chartData.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    {/* Chart Header */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <BarChart2 size={15} className="text-indigo-500" />
                                            <h2 className="text-sm font-semibold text-slate-700">Daily Attendance</h2>
                                            <span className="text-xs text-slate-400 font-medium">— last {chartData.length} days</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> High</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-300 inline-block" /> Low</span>
                                        </div>
                                    </div>

                                    {/* Chart Body */}
                                    <div className="overflow-x-auto pb-2">
                                        <div className="relative min-w-[500px]">
                                            {/* Y-axis grid lines */}
                                            <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '24px', top: 0 }}>
                                                {[100, 75, 50, 25, 0].map(pct => (
                                                    <div key={pct} className="flex items-center gap-2">
                                                        <span className="text-[9px] text-slate-300 w-4 text-right shrink-0">{Math.round((pct / 100) * Math.max(...chartData.map(d => d.count), 1))}</span>
                                                        <div className="flex-1 border-t border-dashed border-slate-100" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Bars */}
                                            <div className="flex items-end gap-1.5 ml-7" style={{ height: '160px' }}>
                                                {chartData.map((item, i) => {
                                                    const isHigh = item.heightPercent >= 60;
                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center gap-0 group relative" style={{ height: '100%', justifyContent: 'flex-end' }}>
                                                            {/* Hover tooltip */}
                                                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-10">
                                                                <div className="bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                                                                    {item.count} present
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                                                </div>
                                                            </div>
                                                            {/* Bar */}
                                                            <div
                                                                className={`w-full rounded-t-md transition-all duration-300 cursor-default ${isHigh ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-indigo-200 group-hover:bg-indigo-300'}`}
                                                                style={{ height: `${item.heightPercent}%`, minHeight: '3px' }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* X-axis labels */}
                                            <div className="flex gap-1.5 mt-2 ml-7">
                                                {chartData.map((item, i) => (
                                                    <div key={i} className="flex-1 text-center">
                                                        <span className="text-[9px] text-slate-400">{item.date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Row */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-slate-800">{Math.max(...chartData.map(d => d.count))}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Peak Day</p>
                                        </div>
                                        <div className="text-center border-x border-slate-100">
                                            <p className="text-lg font-bold text-slate-800">
                                                {Math.round(chartData.reduce((s, d) => s + d.count, 0) / chartData.length)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Daily Avg</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-slate-800">{chartData.reduce((s, d) => s + d.count, 0)}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Total Check-ins</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Detail Table */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-slate-800">Attendance Log</h2>
                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                                        {filteredAttendance.length} records
                                    </span>
                                </div>
                                {filteredAttendance.length === 0 ? (
                                    <EmptyState msg="No attendance logs matches the selected filters." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                                                    <th className="px-6 py-4">Employee</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-emerald-600">Check In</th>
                                                    <th className="px-6 py-4 text-amber-600">Check Out</th>
                                                    <th className="px-6 py-4">Hours</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredAttendance.map(record => (
                                                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{record.employee?.name}</span>
                                                                <span className="text-[10px] text-slate-400">{record.employee?.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm capitalize">{record.employee?.department || '—'}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm">{record.date}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-bold flex items-center gap-1.5 ${isLate(record.checkIn) ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isLate(record.checkIn) ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                                {formatTime(record.checkIn)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm font-semibold">{formatTime(record.checkOut)}</td>
                                                        <td className="px-6 py-4 text-slate-700 text-sm font-bold">{calcHours(record.checkIn, record.checkOut)}</td>
                                                        <td className="px-6 py-4">
                                                            {!record.checkIn ? (
                                                                <Badge color="slate" label="Absent" />
                                                            ) : isLate(record.checkIn) ? (
                                                                <Badge color="amber" label="Late Entry" />
                                                            ) : !record.checkOut ? (
                                                                <Badge color="rose" label="Active" />
                                                            ) : (
                                                                <Badge color="emerald" label="Present" />
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

                    {/* ── LEAVE REPORT VIEW ── */}
                    {reportType === 'leave' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard icon={Calendar} label="Total Requests" value={leaveSummary.total} color="indigo" />
                                <SummaryCard icon={CheckCircle} label="Approved Leaves" value={leaveSummary.approved} color="emerald" />
                                <SummaryCard icon={Clock} label="Pending Requests" value={leaveSummary.pending} color="amber" />
                                <SummaryCard icon={XCircle} label="Rejected Leaves" value={leaveSummary.rejected} color="rose" />
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

                            {/* Detailed Records Table */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-slate-800">Leave Logs</h2>
                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                                        {filteredLeaves.length} logs
                                    </span>
                                </div>
                                {filteredLeaves.length === 0 ? (
                                    <EmptyState msg="No leave requests matches the filters." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                                                    <th className="px-6 py-4">Employee</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4">Start Date</th>
                                                    <th className="px-6 py-4">End Date</th>
                                                    <th className="px-6 py-4">Reason</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredLeaves.map(log => (
                                                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{log.employee?.name}</span>
                                                                <span className="text-[10px] text-slate-400">{log.employee?.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm capitalize">{log.employee?.department || '—'}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm font-semibold">{new Date(log.startDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm font-semibold">{new Date(log.endDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm italic max-w-xs truncate" title={log.reason}>{log.reason}</td>
                                                        <td className="px-6 py-4">
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

                    {/* ── EMPLOYEE DIRECTORY REPORT VIEW ── */}
                    {reportType === 'employee' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard icon={Users} label="Total Headcount" value={employeeSummary.total} color="indigo" />
                                <SummaryCard icon={UserCheck} label="Full Time Staff" value={employeeSummary.fullTime} color="emerald" />
                                <SummaryCard icon={Clock} label="Probation Status" value={employeeSummary.probation} color="amber" />
                                <SummaryCard icon={Briefcase} label="Internships" value={employeeSummary.internship} color="rose" />
                            </div>

                            {/* Department Breakdown Visual */}
                            {Object.keys(employeeSummary.deptCount).length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-600" />
                                        Department Employee Distribution
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {Object.entries(employeeSummary.deptCount).map(([dept, count]) => {
                                            const pct = Math.round((count / employeeSummary.total) * 100);
                                            return (
                                                <div key={dept} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{dept}</p>
                                                        <p className="text-2xl font-black text-slate-800 mt-1">{count} <span className="text-xs font-semibold text-slate-400">staff</span></p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 flex items-center justify-center font-bold text-xs text-indigo-600">
                                                        {pct}%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Directory Listing */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-slate-800">Staff Records Index</h2>
                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                                        {filteredEmployees.length} profiles
                                    </span>
                                </div>
                                {filteredEmployees.length === 0 ? (
                                    <EmptyState msg="No staff members match the filters." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                                                    <th className="px-6 py-4">Employee</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4">Contact Info</th>
                                                    <th className="px-6 py-4 text-indigo-600">Base Salary</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Hired Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredEmployees.map(emp => (
                                                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {emp.photo ? (
                                                                    <img src={emp.photo} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm border border-indigo-100">
                                                                        {emp.name?.[0]}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-800 text-sm">{emp.name}</span>
                                                                    <span className="text-[10px] text-slate-400 capitalize">{emp.role}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm capitalize font-medium">{emp.department}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col text-slate-600 text-xs leading-normal">
                                                                <span className="font-medium">{emp.email}</span>
                                                                <span>{emp.phone || 'No phone'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-800 text-sm font-bold">{formatCurrency(emp.salary)}</td>
                                                        <td className="px-6 py-4">
                                                            {emp.status === 'full time' ? (
                                                                <Badge color="emerald" label="Full Time" />
                                                            ) : emp.status === 'probation' ? (
                                                                <Badge color="amber" label="Probation" />
                                                            ) : (
                                                                <Badge color="slate" label="Internship" />
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                                                            {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}
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
const SummaryCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-600', icon: 'text-indigo-500', border: 'border-indigo-100/50' },
        emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-100/50' },
        amber: { bg: 'bg-amber-50/50', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-100/50' },
        rose: { bg: 'bg-rose-50/50', text: 'text-rose-600', icon: 'text-rose-500', border: 'border-rose-100/50' },
        slate: { bg: 'bg-slate-50/50', text: 'text-slate-600', icon: 'text-slate-500', border: 'border-slate-100/50' },
    };
    const c = colors[color] || colors.slate;
    return (
        <div className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-4`}>
            <div className={`w-11 h-11 ${c.bg} rounded-2xl flex items-center justify-center`}>
                <Icon size={20} className={c.icon} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={`text-xl font-black mt-0.5 tracking-tight ${c.text}`}>{value}</p>
            </div>
        </div>
    );
};

// ── Badge Component ────────────────────────────────────────
const Badge = ({ color, label }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        amber: 'bg-amber-50  text-amber-700  border-amber-100',
        rose: 'bg-rose-50   text-rose-700   border-rose-100',
        slate: 'bg-slate-50  text-slate-500  border-slate-100',
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
    const { employee, baseSalary, presentDays, lateCount, lateDeduction, leaveDays, unpaidLeaveDays = 0, leaveDeduction, deduction, netSalary } = payslip;
    const dailyRate = Math.round(baseSalary / 30);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 space-y-6 p-6"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-100">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Official Payslip Voucher</h2>
                        <p className="text-xs text-slate-400">Itemized Monthly Salary Statement</p>
                    </div>
                </div>

                {/* Employee Profile Header */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {employee.photo ? (
                            <img src={employee.photo} alt={employee.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base border-2 border-white shadow-sm">
                                {employee.name?.[0]}
                            </div>
                        )}
                        <div>
                            <p className="font-black text-slate-800 text-base">{employee.name}</p>
                            <p className="text-xs text-slate-400">{employee.email}</p>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
                                {employee.department || 'General'} &nbsp;·&nbsp; {employee.status || 'Full Time'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Breakdown Sheet */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Earnings &amp; Allowances</h3>
                    <div className="bg-indigo-50/40 rounded-2xl p-3.5 border border-indigo-100/60 space-y-2 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                            <span>Monthly Base Salary</span>
                            <span className="text-slate-900 font-black">{formatCurrency(baseSalary)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-indigo-100/40">
                            <span>Calculated Daily Rate (Base / 30)</span>
                            <span>{formatCurrency(dailyRate)} / day</span>
                        </div>
                    </div>

                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pt-2">Deductions Breakdown</h3>
                    <div className="bg-rose-50/40 rounded-2xl p-3.5 border border-rose-100/60 space-y-2 text-xs">
                        {/* Leave Deduction */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-700">Leave Deduction</p>
                                <p className="text-[10px] text-slate-400">
                                    {leaveDays} approved leave {leaveDays === 1 ? 'day' : 'days'} taken
                                    {unpaidLeaveDays > 0
                                        ? ` · ${unpaidLeaveDays} excess day${unpaidLeaveDays > 1 ? 's' : ''} beyond quota × ${formatCurrency(dailyRate)}`
                                        : ' · All within allocated quota (Paid Leave)'}
                                </p>
                            </div>
                            <span className={`font-bold tabular-nums ${unpaidLeaveDays > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {unpaidLeaveDays > 0 ? `-${formatCurrency(leaveDeduction)}` : '₨ 0'}
                            </span>
                        </div>

                        {/* Late Deduction */}
                        <div className="flex justify-between items-center pt-2 border-t border-rose-100/40">
                            <div>
                                <p className="font-bold text-slate-700">Late Arrival Penalty</p>
                                <p className="text-[10px] text-slate-400">{lateCount} late check-in {lateCount === 1 ? 'entry' : 'entries'} × 0.25 day rate</p>
                            </div>
                            <span className="font-bold text-rose-600 tabular-nums">
                                {lateCount > 0 ? `-${formatCurrency(lateDeduction)}` : '₨ 0'}
                            </span>
                        </div>

                        {/* Total Deductions */}
                        <div className="flex justify-between items-center pt-2 border-t border-rose-200/60 font-black text-rose-700 text-xs">
                            <span>Total Deductions</span>
                            <span className="tabular-nums">-{formatCurrency(deduction)}</span>
                        </div>
                    </div>
                </div>

                {/* Net Payout Banner */}
                <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-100">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Net Disbursed Salary</p>
                        <p className="text-2xl font-black">{formatCurrency(netSalary)}</p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-xl text-xs font-bold border border-white/30 backdrop-blur-sm">
                        Paid Out
                    </span>
                </div>

                {/* Action Footer */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={15} /> Print Payslip
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
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
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const deductionRate = payrollSummary.totalBase > 0
        ? ((payrollSummary.totalDeductions / payrollSummary.totalBase) * 100).toFixed(1)
        : 0;

    const efficiencyRate = payrollSummary.totalBase > 0
        ? ((payrollSummary.totalNet / payrollSummary.totalBase) * 100).toFixed(1)
        : 100;

    const filteredPayroll = useMemo(() => {
        if (deductionFilter === 'leave') return payrollData.filter(p => p.leaveDays > 0);
        if (deductionFilter === 'late') return payrollData.filter(p => p.lateCount > 0);
        if (deductionFilter === 'deduction') return payrollData.filter(p => p.deduction > 0);
        return payrollData;
    }, [payrollData, deductionFilter]);

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

            {/* ── 4 Interactive KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

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

            {/* ── Deductions Audit & Department Cost Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Deductions Detailed Audit Box (2 cols) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500" /> Deductions Audit
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase">
                            {deductionRate}% of Budget
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Leave Deductions Bar */}
                        <div className="space-y-1.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <Calendar size={13} className="text-amber-600" /> Unpaid Leave Deductions
                                </span>
                                <span className="font-black text-amber-700 tabular-nums">-{formatCurrency(payrollSummary.totalLeaveDeductions)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{totalLeaveDays} approved leave days</span>
                                <span>1.0x daily rate deduction</span>
                            </div>
                        </div>

                        {/* Late Deductions Bar */}
                        <div className="space-y-1.5 bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <Clock size={13} className="text-rose-600" /> Late Arrival Penalty
                                </span>
                                <span className="font-black text-rose-700 tabular-nums">-{formatCurrency(payrollSummary.totalLateDeductions)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{totalLateEntries} late check-ins (&gt;12:00 PM)</span>
                                <span>0.25x daily rate penalty</span>
                            </div>
                        </div>

                        {/* Total Audit Summary */}
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-black">
                            <span className="text-slate-700">Combined Deductions Total</span>
                            <span className="text-rose-600 text-sm tabular-nums">-{formatCurrency(payrollSummary.totalDeductions)}</span>
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

            {/* ── View Switcher & Counter Bar ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-base font-black text-slate-800">Employee Salary Sheet</h3>
                    <p className="text-xs text-slate-400">Showing {filteredPayroll.length} of {payrollData.length} records</p>
                </div>
                <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setView('table')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >Table View</button>
                    <button
                        onClick={() => setView('cards')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'cards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >Cards View</button>
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
                    {filteredPayroll.length === 0 ? (
                        <div className="col-span-full"><EmptyState msg="No employee payroll records match the selected filter." /></div>
                    ) : filteredPayroll.map((p, i) => {
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
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={15} className="text-indigo-500" />
                            <h3 className="text-sm font-black text-slate-800">Monthly Salary Audit Sheet</h3>
                        </div>
                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                            {filteredPayroll.length} entries
                        </span>
                    </div>

                    {filteredPayroll.length === 0 ? (
                        <EmptyState msg="No payroll records match the selected filter." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4 text-right">Gross Base</th>
                                        <th className="px-6 py-4 text-center text-amber-600">Leave Deductions</th>
                                        <th className="px-6 py-4 text-center text-rose-500">Late Deductions</th>
                                        <th className="px-6 py-4 text-right text-rose-600">Total Deductions</th>
                                        <th className="px-6 py-4 text-right text-emerald-600">Net Payout</th>
                                        <th className="px-6 py-4 text-center">Payslip</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPayroll.map((p) => (
                                        <tr
                                            key={p.employee._id}
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                                            onClick={() => setSelectedPayslip(p)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {p.employee.photo ? (
                                                        <img src={p.employee.photo} alt={p.employee.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                                                            {getInitials(p.employee.name)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{p.employee.name}</p>
                                                        <p className="text-[10px] text-slate-400">{p.employee.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-600 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    {p.employee.department || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-800 text-sm tabular-nums">{formatCurrency(p.baseSalary)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.leaveDays > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-md border border-amber-100">
                                                            {p.leaveDays} {p.leaveDays === 1 ? 'day' : 'days'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-amber-600 mt-0.5 tabular-nums">-{formatCurrency(p.leaveDeduction)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.lateCount > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-md border border-rose-100">
                                                            {p.lateCount} {p.lateCount === 1 ? 'late' : 'lates'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-rose-600 mt-0.5 tabular-nums">-{formatCurrency(p.lateDeduction)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold text-sm tabular-nums ${p.deduction > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                                                    {p.deduction > 0 ? `-${formatCurrency(p.deduction)}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-emerald-600 text-sm tabular-nums">{formatCurrency(p.netSalary)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedPayslip(p); }}
                                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-100 transition-colors cursor-pointer"
                                                >
                                                    Payslip
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                    <tr>
                                        <td className="px-6 py-4 font-black text-slate-800 text-sm" colSpan={2}>Totals &amp; Averages</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800 tabular-nums">{formatCurrency(payrollSummary.totalBase)}</td>
                                        <td className="px-6 py-4 text-center font-bold text-amber-600 text-xs tabular-nums">-{formatCurrency(payrollSummary.totalLeaveDeductions)}</td>
                                        <td className="px-6 py-4 text-center font-bold text-rose-600 text-xs tabular-nums">-{formatCurrency(payrollSummary.totalLateDeductions)}</td>
                                        <td className="px-6 py-4 text-right font-black text-rose-600 tabular-nums">-{formatCurrency(payrollSummary.totalDeductions)}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 tabular-nums">{formatCurrency(payrollSummary.totalNet)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
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

