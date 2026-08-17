import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, UserPlus, Briefcase,
    Building2, UserCheck, Trash2, Crown, Phone, Pencil,
    LayoutGrid, List, Filter, TrendingUp, UserX
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const HREmployeeList = ({ employees = [], performanceReviews = [], mistakeReports = [], awards = [], searchTerm = '', onAddNew, onSelect, onEdit, onDelete }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    const [deptFilter, setDeptFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'full time' | 'probation' | 'teamLeads' | 'inactive'

    const getEmployeePerformanceStats = (empId) => {
        const empReviews = performanceReviews.filter(r => (r.employee?._id || r.employee) === empId);
        const empMistakes = mistakeReports.filter(m => (m.agentId?._id || m.agentId) === empId);
        const empAwards = awards.filter(a => (a.employee?._id || a.employee) === empId);

        let sum = empReviews.length > 0 ? empReviews.reduce((acc, rev) => acc + (rev.overallRating || 0), 0) : 5.0;
        let count = empReviews.length > 0 ? empReviews.length : 1;
        
        let totalPenalty = 0;
        empMistakes.forEach(m => { totalPenalty += (m.severityPoints || 0); });
        
        let adjustedSum = sum - totalPenalty;
        if (adjustedSum < 0) adjustedSum = 0;
        let adjustedRating = adjustedSum / count;
        if (adjustedRating > 5.0) adjustedRating = 5.0;
        
        return {
            rating: adjustedRating.toFixed(1),
            mistakes: empMistakes.length,
            awards: empAwards.length
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatSalary = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Extract unique department list
    const departments = Array.from(new Set(
        employees.map(e => e.department).filter(Boolean)
    ));

    // Filter employees based on search term, department filter & statusFilter
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.reportingTo?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = deptFilter === 'all' || emp.department?.toLowerCase() === deptFilter.toLowerCase();

        let matchesStatus = true;
        if (statusFilter === 'full time') {
            matchesStatus = emp.status === 'full time' || !emp.status;
        } else if (statusFilter === 'probation') {
            matchesStatus = emp.status === 'probation' || emp.status === 'internship';
        } else if (statusFilter === 'teamLeads') {
            matchesStatus = !!emp.isTeamLead;
        } else if (statusFilter === 'inactive') {
            matchesStatus = emp.status === 'Inactive';
        }

        return matchesSearch && matchesDept && matchesStatus;
    });

    // KPI Metrics
    const totalStaff = employees.length;
    const fullTimeCount = employees.filter(e => e.status === 'full time' || !e.status).length;
    const probationCount = employees.filter(e => e.status === 'probation' || e.status === 'internship').length;
    const teamLeadsCount = employees.filter(e => e.isTeamLead).length;
    const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

    return (
        <div className="space-y-8">

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Staff Card */}
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${statusFilter === 'all'
                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md bg-indigo-50/10'
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                        }`}>
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</p>
                        <p className="text-2xl font-black text-slate-800">{totalStaff}</p>
                    </div>
                </button>

                {/* Full Time Card */}
                <button
                    onClick={() => setStatusFilter('full time')}
                    className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${statusFilter === 'full time'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-md bg-emerald-50/10'
                            : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${statusFilter === 'full time' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                        }`}>
                        <Briefcase size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Time</p>
                        <p className="text-2xl font-black text-slate-800">{fullTimeCount}</p>
                    </div>
                </button>

                {/* Probation & Interns Card */}
                <button
                    onClick={() => setStatusFilter('probation')}
                    className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${statusFilter === 'probation'
                            ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-md bg-amber-50/10'
                            : 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${statusFilter === 'probation' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
                        }`}>
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On Probation</p>
                        <p className="text-2xl font-black text-slate-800">{probationCount}</p>
                    </div>
                </button>

                {/* Team Leads Card */}
                <button
                    onClick={() => setStatusFilter('teamLeads')}
                    className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${statusFilter === 'teamLeads'
                            ? 'border-violet-500 ring-2 ring-violet-500/10 shadow-md bg-violet-50/10'
                            : 'border-slate-200 hover:border-violet-300 hover:shadow-xs'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${statusFilter === 'teamLeads' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 group-hover:bg-violet-100'
                        }`}>
                        <Crown size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Leads</p>
                        <p className="text-2xl font-black text-slate-800">{teamLeadsCount}</p>
                    </div>
                </button>

                {/* Inactive Card */}
                <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${statusFilter === 'inactive'
                            ? 'border-slate-500 ring-2 ring-slate-500/10 shadow-md bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${statusFilter === 'inactive' ? 'bg-slate-600 text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-200'
                        }`}>
                        <UserX size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive</p>
                        <p className="text-2xl font-black text-slate-800">{inactiveCount}</p>
                    </div>
                </button>
            </div>

            {/* Header Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                        {filteredEmployees.length} Staff Member{filteredEmployees.length !== 1 ? 's' : ''}
                    </span>

                    {/* Active Filter Pill */}
                    {statusFilter !== 'all' && (
                        <button
                            onClick={() => setStatusFilter('all')}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Clear Status Filter"
                        >
                            <span>Filter: {statusFilter === 'teamLeads' ? 'Team Leads' : statusFilter === 'inactive' ? 'Inactive' : statusFilter === 'full time' ? 'Full Time' : 'Probation/Interns'}</span>
                            <span className="text-amber-900 font-extrabold text-sm">&times;</span>
                        </button>
                    )}

                    {/* Department Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">All Departments</option>
                            {departments.map((dept, idx) => (
                                <option key={idx} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            title="Table View"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            title="Grid Cards View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>

                {/* Add New Employee Primary Button */}
                {onAddNew && (
                    <button
                        onClick={onAddNew}
                        className="btn-primary w-full sm:w-auto shrink-0"
                    >
                        <UserPlus size={18} />
                        <span>Add New Employee</span>
                    </button>
                )}
            </div>

            {/* Main Content View */}
            {viewMode === 'table' ? (
                /* TABLE VIEW */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="table-container"
                >
                    <table className="table-base table-fixed">
                        <colgroup>
                            <col className="w-[20%]" />
                            <col className="w-[14%]" />
                            <col className="w-[12%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                            <col className="w-[14%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header">
                                <th className="whitespace-nowrap">Employee</th>
                                <th className="whitespace-nowrap">Dept & Role</th>
                                <th className="whitespace-nowrap">Reporting To</th>
                                <th className="whitespace-nowrap">Status</th>
                                <th className="whitespace-nowrap">Salary</th>
                                <th className="whitespace-nowrap">Performance</th>
                                <th className="whitespace-nowrap">Joined</th>
                                <th className="text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {filteredEmployees.map(emp => (
                                <tr
                                    key={emp._id}
                                    onClick={() => onSelect && onSelect(emp)}
                                    className={`table-row ${emp.status === 'Inactive' ? 'opacity-50 hover:opacity-100 grayscale' : ''}`}
                                >
                                        {/* Employee Name, Photo, Email, Phone & Lead badge */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100 group-hover:border-indigo-300 transition-colors shrink-0">
                                                    {emp.photo ? (
                                                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-indigo-600 font-black text-xs">{emp.name?.[0]?.toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors truncate">
                                                            {emp.name}
                                                        </span>
                                                        {emp.isTeamLead && (
                                                            <span className="px-1 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[9px] font-extrabold flex items-center gap-0.5 shrink-0" title="Team Lead">
                                                                <Crown size={9} /> Lead
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-medium truncate">{emp.email}</span>
                                                    {emp.phone && (
                                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                                            <Phone size={9} /> {emp.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Department & Account Role */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="space-y-0.5">
                                                <span className="flex items-center gap-1 text-slate-700 text-[11px] font-bold capitalize truncate">
                                                    <Building2 size={12} className="text-indigo-500 shrink-0" />
                                                    {emp.department || 'General'}
                                                </span>
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${emp.role === 'hr' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {emp.role === 'hr' ? 'HR Admin' : 'Employee'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Reporting To */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="flex items-center gap-1 text-slate-600 text-[11px] font-medium truncate">
                                                <UserCheck size={12} className="text-slate-400 shrink-0" />
                                                {emp.reportingTo || 'Unassigned'}
                                            </span>
                                        </td>

                                        {/* Employment Status */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`
                                                px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit
                                                ${emp.status === 'full time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''}
                                                ${emp.status === 'probation' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''}
                                                ${emp.status === 'internship' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : ''}
                                                ${emp.status === 'Inactive' ? 'bg-rose-50 text-rose-600 border border-rose-200' : ''}
                                            `}>
                                                <Briefcase size={10} />
                                                {emp.status || 'full time'}
                                            </span>
                                        </td>

                                        {/* Salary */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="text-slate-800 font-black text-[11px] tabular-nums">
                                                {formatSalary(emp.salary)}
                                            </div>
                                        </td>

                                        {/* Performance */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {(() => {
                                                const stats = getEmployeePerformanceStats(emp._id);
                                                return (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1 text-[11px]">
                                                            <span className="font-bold text-amber-500">★ {stats.rating}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                            <span className="flex items-center gap-0.5" title="Mistakes">
                                                                <Trash2 size={9} className={stats.mistakes > 0 ? 'text-rose-500' : ''} /> {stats.mistakes}
                                                            </span>
                                                            <span className="flex items-center gap-0.5" title="Awards">
                                                                <Crown size={9} className={stats.awards > 0 ? 'text-violet-500' : ''} /> {stats.awards}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </td>

                                        {/* Joined On */}
                                        <td className="px-3 py-3 text-slate-600 text-[11px] font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={11} className="text-slate-400 shrink-0" />
                                                {formatDate(emp.createdAt)}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>

                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(emp)}
                                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit Employee"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(emp._id)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete Employee"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </table>

                    {filteredEmployees.length === 0 && (
                        <div className="p-16 text-center text-slate-400">
                            <Users size={44} className="mx-auto mb-3 opacity-20" />
                            <p className="font-semibold text-sm">No employees found matching your filter criteria.</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                /* GRID CARDS VIEW */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredEmployees.map(emp => (
                        <div
                            key={emp._id}
                            onClick={() => onSelect && onSelect(emp)}
                            className={`card card-hover flex flex-col justify-between space-y-4 group ${emp.status === 'Inactive' ? 'opacity-60 hover:opacity-100 grayscale' : ''}`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100 group-hover:border-indigo-300 transition-colors shrink-0">
                                            {emp.photo ? (
                                                <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-indigo-600 font-black text-base">{emp.name?.[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 truncate">
                                                <span className="truncate">{emp.name}</span>
                                                {emp.isTeamLead && (
                                                    <Crown size={12} className="text-amber-500 shrink-0" />
                                                )}
                                            </h4>
                                            <p className="text-xs text-slate-400 font-medium truncate max-w-[160px]" title={emp.email}>{emp.email}</p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.status === 'full time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : emp.status === 'Inactive' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                        {emp.status || 'full time'}
                                    </span>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                            <Building2 size={13} /> Department:
                                        </span>
                                        <span className="font-bold capitalize text-slate-700">{emp.department || 'General'}</span>
                                    </div>
                                    {emp.phone && (
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                                <Phone size={13} /> Phone:
                                            </span>
                                            <span className="font-semibold text-slate-700">{emp.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                            <UserCheck size={13} /> Manager:
                                        </span>
                                        <span className="font-semibold text-slate-700">{emp.reportingTo || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                            <TrendingUp size={13} /> Performance:
                                        </span>
                                        {(() => {
                                            const stats = getEmployeePerformanceStats(emp._id);
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-amber-500 text-[10px]">★ {stats.rating}</span>
                                                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500" title="Mistakes">
                                                        <Trash2 size={10} className={stats.mistakes > 0 ? 'text-rose-500' : ''} /> {stats.mistakes}
                                                    </span>
                                                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500" title="Awards">
                                                        <Crown size={10} className={stats.awards > 0 ? 'text-violet-500' : ''} /> {stats.awards}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                            <Calendar size={13} /> Joined:
                                        </span>
                                        <span className="font-semibold text-slate-700">{formatDate(emp.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Annual Salary</p>
                                    <p className="text-sm font-black text-slate-800">{formatSalary(emp.salary)}</p>
                                </div>
                                <div className="flex items-center gap-1">

                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(emp)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            title="Edit Employee"
                                        >
                                            <Pencil size={17} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(emp._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete Employee"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <div className="col-span-full p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                            <Users size={44} className="mx-auto mb-3 opacity-20" />
                            <p className="font-semibold text-sm">No employees found matching your filter criteria.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default HREmployeeList;
