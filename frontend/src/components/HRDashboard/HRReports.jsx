import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart2, Users, Clock, AlertCircle, Filter, Calendar, 
    DollarSign, ClipboardList, Download, CheckCircle, XCircle, 
    AlertTriangle, Building2, UserCheck, Search, Briefcase, FileText
} from 'lucide-react';
import axios from 'axios';

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

    // ── Fetch data depending on active report ────────────────
    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.startDate)  params.startDate  = filters.startDate;
            if (filters.endDate)    params.endDate    = filters.endDate;
            if (filters.employeeId) params.employeeId = filters.employeeId;

            // Fetch both attendance and leaves to support overlapping reports like payroll
            const [attendanceRes, leavesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/attendance/report`, { params: { ...params, type: 'attendance' } }),
                axios.get(`${import.meta.env.VITE_API_URL}/attendance/report`, { params: { ...params, type: 'leave' } })
            ]);

            setRecords(attendanceRes.data);
            setLeaveRecords(leavesRes.data);
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [filters.startDate, filters.endDate, filters.employeeId]); // Refetch on core filter change

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

        const lateArrivals = filteredAttendance.filter(r => {
            if (!r.checkIn) return false;
            const t = new Date(r.checkIn);
            return t.getHours() > 9 || (t.getHours() === 9 && t.getMinutes() > 15);
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
        // Calculate payroll for the list of filteredEmployees based on their approved leaves in the period
        return filteredEmployees.map(emp => {
            const baseSalary = Number(emp.salary) || 0;
            const dailyRate = baseSalary > 0 ? baseSalary / 30 : 0;
            
            // Find approved leaves for this employee within the selected date range
            const empLeaves = filteredLeaves.filter(l => 
                l.employee?._id === emp._id && 
                l.status === 'approved'
            );

            // Compute total leave days in the period
            let totalLeaveDays = 0;
            const rangeStart = filters.startDate ? new Date(filters.startDate) : null;
            const rangeEnd = filters.endDate ? new Date(filters.endDate) : null;

            empLeaves.forEach(l => {
                const leaveStart = new Date(l.startDate);
                const leaveEnd = new Date(l.endDate);

                // Find intersection of leave range and filter date range
                const start = rangeStart && leaveStart < rangeStart ? rangeStart : leaveStart;
                const end = rangeEnd && leaveEnd > rangeEnd ? rangeEnd : leaveEnd;

                if (start <= end) {
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    totalLeaveDays += diffDays;
                }
            });

            const deduction = Math.round(dailyRate * totalLeaveDays);
            const netSalary = Math.max(0, baseSalary - deduction);

            return {
                employee: emp,
                baseSalary,
                leaveDays: totalLeaveDays,
                deduction,
                netSalary
            };
        });
    }, [filteredEmployees, filteredLeaves, filters.startDate, filters.endDate]);

    const payrollSummary = useMemo(() => {
        const totalBase = payrollData.reduce((acc, curr) => acc + curr.baseSalary, 0);
        const totalDeductions = payrollData.reduce((acc, curr) => acc + curr.deduction, 0);
        const totalNet = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
        const avgNet = payrollData.length > 0 ? Math.round(totalNet / payrollData.length) : 0;

        // Cost by department
        const deptCost = {};
        payrollData.forEach(p => {
            const dept = p.employee?.department || 'Other';
            deptCost[dept] = (deptCost[dept] || 0) + p.netSalary;
        });

        return { totalBase, totalDeductions, totalNet, avgNet, deptCost };
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

    const isLate = (checkIn) => {
        if (!checkIn) return false;
        const t = new Date(checkIn);
        return t.getHours() > 9 || (t.getHours() === 9 && t.getMinutes() > 15);
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
                    r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—',
                    r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—',
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

    // ── Departments list ────────────────────────────────────
    const departments = ['design', 'hr', 'development', 'QA'];

    // ── Report Type Metadata ───────────────────────────────
    const reportTypesMeta = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardList, desc: 'Track clock-ins, late entries, and active hours' },
        { id: 'leave', label: 'Leave Requests', icon: Calendar, desc: 'Review approved, pending, and rejected leave logs' },
        { id: 'payroll', label: 'Payroll Summary', icon: DollarSign, desc: 'Calculate monthly base salary, leave deductions, and net payouts' },
        { id: 'employee', label: 'Staff Directory', icon: Users, desc: 'View headcount, status divisions, and department counts' }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {reportTypesMeta.map((type) => {
                    const Icon = type.icon;
                    const isActive = reportType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setReportType(type.id)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 group relative overflow-hidden ${
                                isActive 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl transition-colors ${
                                isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                            }`}>
                                <Icon size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>{type.label}</h3>
                                <p className={`text-[10px] line-clamp-2 leading-relaxed ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{type.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-indigo-600 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Report Criteria Filters</span>
                    </div>
                    {(filters.startDate || filters.endDate || filters.employeeId || filters.department) && (
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', employeeId: '', department: '' })}
                            className="text-xs text-rose-500 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}
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
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500">Aggregating report analytics...</p>
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
                                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <BarChart2 size={16} className="text-indigo-600" />
                                        Daily Attendance Profile
                                    </h2>
                                    <div className="flex items-end gap-3 h-48 px-2 pt-6">
                                        {chartData.map((item, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                                <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.count}
                                                </span>
                                                <div
                                                    className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all duration-300 cursor-pointer shadow-sm shadow-indigo-100"
                                                    style={{ height: `${item.heightPercent}%`, minHeight: '8px' }}
                                                    title={`${item.date}: ${item.count} present`}
                                                />
                                                <span className="text-[9px] text-slate-400 font-bold mt-2 rotate-45 origin-left whitespace-nowrap">
                                                    {item.date}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-indigo-500"></div>
                                        <span className="text-xs text-slate-400 font-medium">Present employees count per calendar date</span>
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
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard icon={DollarSign} label="Base Salaries" value={formatCurrency(payrollSummary.totalBase)} color="indigo" />
                                <SummaryCard icon={AlertTriangle} label="Total Deductions" value={formatCurrency(payrollSummary.totalDeductions)} color="rose" />
                                <SummaryCard icon={CheckCircle} label="Net Payroll" value={formatCurrency(payrollSummary.totalNet)} color="emerald" />
                                <SummaryCard icon={Users} label="Avg Net Pay" value={formatCurrency(payrollSummary.avgNet)} color="amber" />
                            </div>

                            {/* Department Cost Distribution */}
                            {Object.keys(payrollSummary.deptCost).length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Briefcase size={16} className="text-indigo-600" />
                                        Department Net Pay Budget Costs
                                    </h2>
                                    <div className="space-y-4">
                                        {Object.entries(payrollSummary.deptCost).map(([dept, cost]) => {
                                            const maxCost = Math.max(...Object.values(payrollSummary.deptCost), 1);
                                            const pct = Math.round((cost / maxCost) * 100);
                                            return (
                                                <div key={dept} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-bold text-slate-700 capitalize">
                                                        <span>{dept}</span>
                                                        <span>{formatCurrency(cost)}</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Payroll Detailed Listing */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-slate-800">Salary Breakdown Sheet</h2>
                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                                        {payrollData.length} records
                                    </span>
                                </div>
                                {payrollData.length === 0 ? (
                                    <EmptyState msg="No employee data found matching criteria." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                                                    <th className="px-6 py-4">Employee</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4 text-indigo-600">Monthly Base</th>
                                                    <th className="px-6 py-4">Leave Deductions</th>
                                                    <th className="px-6 py-4 text-emerald-600">Net Payout</th>
                                                    <th className="px-6 py-4">Formula Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {payrollData.map(p => (
                                                    <tr key={p.employee._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{p.employee.name}</span>
                                                                <span className="text-[10px] text-slate-400">{p.employee.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm capitalize">{p.employee.department}</td>
                                                        <td className="px-6 py-4 text-slate-800 text-sm font-bold">{formatCurrency(p.baseSalary)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-bold ${p.deduction > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                                                    -{formatCurrency(p.deduction)}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 font-semibold">{p.leaveDays} approved leaves</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-emerald-600 text-sm font-black">{formatCurrency(p.netSalary)}</td>
                                                        <td className="px-6 py-4 text-slate-400 text-[10px] leading-tight">
                                                            {p.baseSalary > 0 
                                                                ? `${formatCurrency(p.baseSalary)} / 30 × ${p.leaveDays} days` 
                                                                : 'Salary not set'}
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
        indigo:  { bg: 'bg-indigo-50/50',  text: 'text-indigo-600',  icon: 'text-indigo-500',  border: 'border-indigo-100/50'  },
        emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-100/50' },
        amber:   { bg: 'bg-amber-50/50',   text: 'text-amber-600',   icon: 'text-amber-500',   border: 'border-amber-100/50'   },
        rose:    { bg: 'bg-rose-50/50',    text: 'text-rose-600',    icon: 'text-rose-500',    border: 'border-rose-100/50'    },
        slate:   { bg: 'bg-slate-50/50',   text: 'text-slate-600',   icon: 'text-slate-500',   border: 'border-slate-100/50'   },
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
        amber:   'bg-amber-50  text-amber-700  border-amber-100',
        rose:    'bg-rose-50   text-rose-700   border-rose-100',
        slate:   'bg-slate-50  text-slate-500  border-slate-100',
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

export default HRReports;
