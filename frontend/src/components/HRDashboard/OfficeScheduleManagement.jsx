import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { Calendar, Clock, Edit2, Trash2, Plus, Save, Bell, X, Users, Briefcase, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateUtils';

const OfficeScheduleManagement = () => {
    const [activeTab, setActiveTab] = useState('office'); // 'office', 'departments', 'employees'

    // Office Schedule State
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    
    // Departments State
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    // Employees State
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employeeSearch, setEmployeeSearch] = useState('');

    // Shared UI State
    const [isSaving, setIsSaving] = useState(false);

    // Modal States
    const [officeModal, setOfficeModal] = useState({ isOpen: false, data: {}, isDefault: false, editingId: null });
    const [shiftModal, setShiftModal] = useState({ isOpen: false, type: null, entityId: null, data: {} }); // type: 'department' | 'employee'

    useEffect(() => {
        if (activeTab === 'office') fetchSchedules();
        else if (activeTab === 'departments') fetchDepartments();
        else if (activeTab === 'employees') fetchEmployees();
    }, [activeTab]);

    const fetchSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const res = await apiClient.get('/office-schedule');
            setSchedules(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch schedules');
        } finally {
            setLoadingSchedules(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            setLoadingDepartments(true);
            const res = await apiClient.get('/departments');
            setDepartments(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch departments');
        } finally {
            setLoadingDepartments(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const res = await apiClient.get('/auth/users');
            setEmployees(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch employees');
        } finally {
            setLoadingEmployees(false);
        }
    };

    // --- Office Schedule Logic ---
    const handleOpenOfficeModal = (schedule = null, isDefault = false) => {
        setOfficeModal({
            isOpen: true,
            editingId: schedule ? schedule._id : null,
            isDefault,
            data: schedule ? {
                date: schedule.date || '',
                startDate: schedule.date || '',
                endDate: schedule.date || '',
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                gracePeriod: schedule.gracePeriod,
                workingDays: schedule.workingDays || [1, 2, 3, 4, 5],
                reason: schedule.reason || ''
            } : {
                date: '', startDate: '', endDate: '', startTime: '09:00', endTime: '18:00', gracePeriod: 15, workingDays: [1, 2, 3, 4, 5], reason: ''
            }
        });
    };

    const handleOfficeSubmit = async (e, notifyEmployees = false) => {
        e.preventDefault();
        const { isDefault, editingId, data } = officeModal;
        if (!isDefault && !editingId && (!data.startDate || !data.endDate)) return toast.error("Start and End dates are required.");
        if (data.startTime >= data.endTime) return toast.error("Start time must be before end time.");

        setIsSaving(true);
        try {
            const payload = { ...data, isDefault, notifyEmployees };
            if (editingId && !isDefault) {
                await apiClient.put(`/office-schedule/${editingId}`, payload);
                toast.success('Schedule updated successfully');
            } else {
                await apiClient.post('/office-schedule', payload);
                toast.success(isDefault ? 'Default schedule updated' : 'Schedule override created');
            }
            fetchSchedules();
            setOfficeModal({ ...officeModal, isOpen: false });
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to save schedule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOverride = async (id) => {
        if (!await window.confirmModal('Are you sure you want to delete this custom schedule?')) return;
        try {
            await apiClient.delete(`/office-schedule/${id}`);
            toast.success('Schedule deleted');
            fetchSchedules();
        } catch (error) {
            toast.error('Failed to delete schedule');
        }
    };

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const toggleWorkingDay = (dayIndex) => {
        const current = officeModal.data.workingDays || [];
        const updated = current.includes(dayIndex)
            ? current.filter(d => d !== dayIndex)
            : [...current, dayIndex].sort((a, b) => a - b);
        setOfficeModal({ ...officeModal, data: { ...officeModal.data, workingDays: updated } });
    };

    const formatWorkingDays = (days) => {
        if (!days || days.length === 0) return 'None';
        if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return 'Mon – Fri';
        if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5,6])) return 'Mon – Sat';
        return days.map(d => DAY_NAMES[d]).join(', ');
    };

    // --- Department & Employee Shift Logic ---
    const handleOpenShiftModal = (type, entity) => {
        const details = entity.shiftDetails || { startTime: '09:00', endTime: '18:00', gracePeriod: 15 };
        setShiftModal({
            isOpen: true,
            type,
            entityId: entity._id,
            entityName: entity.name,
            data: {
                startTime: details.startTime || '09:00',
                endTime: details.endTime || '18:00',
                gracePeriod: details.gracePeriod || 15
            }
        });
    };

    const handleShiftSubmit = async (e) => {
        e.preventDefault();
        const { type, entityId, data } = shiftModal;
        if (data.startTime >= data.endTime) return toast.error("Start time must be before end time.");
        
        setIsSaving(true);
        try {
            if (type === 'department') {
                await apiClient.put(`/departments/${entityId}`, { shiftDetails: data });
                toast.success('Department schedule updated');
                fetchDepartments();
            } else if (type === 'employee') {
                await apiClient.put(`/auth/users/${entityId}`, { shiftDetails: data });
                toast.success('Employee schedule updated');
                fetchEmployees();
            }
            setShiftModal({ ...shiftModal, isOpen: false });
        } catch (error) {
            toast.error(`Failed to update ${type} schedule`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearShift = async (type, entityId) => {
        if (!await window.confirmModal(`Are you sure you want to clear this ${type} schedule? They will fall back to the default schedule.`)) return;
        setIsSaving(true);
        try {
            const nullShift = { startTime: null, endTime: null, gracePeriod: 0 };
            if (type === 'department') {
                await apiClient.put(`/departments/${entityId}`, { shiftDetails: nullShift });
                fetchDepartments();
            } else if (type === 'employee') {
                await apiClient.put(`/auth/users/${entityId}`, { shiftDetails: nullShift });
                fetchEmployees();
            }
            toast.success('Schedule cleared');
        } catch (error) {
            toast.error('Failed to clear schedule');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Helpers ---
    const formatTime12hr = (timeString) => {
        if (!timeString) return '';
        const [h, m] = timeString.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    const defaultSchedule = Array.isArray(schedules) ? schedules.find(s => s.isDefault) : null;
    const customSchedules = Array.isArray(schedules) ? schedules.filter(s => !s.isDefault) : [];

    // --- Render ---
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Schedule Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure default working hours, date overrides, and entity-specific schedules.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-max">
                <button onClick={() => setActiveTab('office')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'office' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Clock className="w-4 h-4" /> Default & Overrides
                </button>
                <button onClick={() => setActiveTab('departments')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'departments' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Briefcase className="w-4 h-4" /> Departments
                </button>
                <button onClick={() => setActiveTab('employees')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'employees' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                    <Users className="w-4 h-4" /> Employees
                </button>
            </div>

            {/* Content: Office Schedule */}
            {activeTab === 'office' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-500" /> Default Office Timings
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Applies to everyone unless a specific department or employee schedule exists.</p>
                            </div>
                            <button onClick={() => handleOpenOfficeModal(defaultSchedule, true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition" title="Edit Default Schedule">
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>
                        {defaultSchedule ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Working Hours</p>
                                    <p className="text-lg font-medium text-slate-800 dark:text-white">{formatTime12hr(defaultSchedule.startTime)} - {formatTime12hr(defaultSchedule.endTime)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Grace Period</p>
                                    <p className="text-lg font-medium text-slate-800 dark:text-white">{defaultSchedule.gracePeriod} Minutes</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Working Days</p>
                                    <p className="text-lg font-medium text-slate-800 dark:text-white">{formatWorkingDays(defaultSchedule.workingDays)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">No default schedule configured.</p>
                                <button onClick={() => handleOpenOfficeModal(null, true)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm font-medium">Set Default Schedule</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Overrides
                            </h2>
                            <button onClick={() => handleOpenOfficeModal(null, false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium text-sm">
                                <Plus className="w-4 h-4" /> Add Override
                            </button>
                        </div>
                        {customSchedules.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                                            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Working Hours</th>
                                            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Reason</th>
                                            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customSchedules.map(schedule => (
                                            <tr key={schedule._id} className="border-b border-slate-100 dark:border-slate-700">
                                                <td className="py-4 font-medium text-slate-800 dark:text-white">{formatDate(schedule.date)}</td>
                                                <td className="py-4 text-slate-600 dark:text-slate-300">{formatTime12hr(schedule.startTime)} - {formatTime12hr(schedule.endTime)}</td>
                                                <td className="py-4 text-slate-600 dark:text-slate-300">{schedule.reason || '-'}</td>
                                                <td className="py-4 flex justify-end gap-2">
                                                    <button onClick={() => handleOpenOfficeModal(schedule, false)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteOverride(schedule._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No upcoming overrides found.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Content: Departments */}
            {activeTab === 'departments' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Department Schedules</h2>
                    {loadingDepartments ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Department</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Shift Status</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Timing</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map(dept => {
                                        const hasCustomShift = dept.shiftDetails?.startTime;
                                        return (
                                            <tr key={dept._id} className="border-b border-slate-100 dark:border-slate-700">
                                                <td className="py-4 font-medium text-slate-800 dark:text-white">{dept.name}</td>
                                                <td className="py-4">
                                                    {hasCustomShift ? (
                                                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-xs font-medium rounded-full">Custom Shift</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-600">Default Time</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-slate-600 dark:text-slate-300 font-medium">
                                                    {hasCustomShift ? `${formatTime12hr(dept.shiftDetails.startTime)} - ${formatTime12hr(dept.shiftDetails.endTime)}` : '-'}
                                                </td>
                                                <td className="py-4 flex justify-end gap-2">
                                                    <button onClick={() => handleOpenShiftModal('department', dept)} className="px-3 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg transition font-medium">Edit</button>
                                                    {hasCustomShift && (
                                                        <button onClick={() => handleClearShift('department', dept._id)} className="px-3 py-1.5 text-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-100 dark:border-rose-500/20 rounded-lg transition font-medium">Clear</button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {departments.length === 0 && !loadingDepartments && <div className="text-center py-8 text-slate-500 dark:text-slate-400">No departments found.</div>}
                        </div>
                    )}
                </div>
            )}

            {/* Content: Employees */}
            {activeTab === 'employees' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Employee Schedules</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search employees..." 
                                value={employeeSearch}
                                onChange={e => setEmployeeSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                    {loadingEmployees ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Employee</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Department</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Shift Status</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Timing</th>
                                        <th className="pb-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(emp => {
                                        const hasCustomShift = emp.shiftDetails?.startTime;
                                        return (
                                            <tr key={emp._id} className="border-b border-slate-100 dark:border-slate-700">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                                            {emp.photo ? <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" /> : emp.name.substring(0, 2)}
                                                        </div>
                                                        <span className="font-medium text-slate-800 dark:text-white">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm text-slate-600 dark:text-slate-300">{emp.department || 'N/A'}</td>
                                                <td className="py-4">
                                                    {hasCustomShift ? (
                                                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-xs font-medium rounded-full shadow-sm">Employee Shift</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-600">Inherited</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                                    {hasCustomShift ? `${formatTime12hr(emp.shiftDetails.startTime)} - ${formatTime12hr(emp.shiftDetails.endTime)}` : '-'}
                                                </td>
                                                <td className="py-4 flex justify-end gap-2">
                                                    <button onClick={() => handleOpenShiftModal('employee', emp)} className="px-3 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg transition font-medium">Edit</button>
                                                    {hasCustomShift && (
                                                        <button onClick={() => handleClearShift('employee', emp._id)} className="px-3 py-1.5 text-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-100 dark:border-rose-500/20 rounded-lg transition font-medium">Clear</button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {employees.length === 0 && !loadingEmployees && <div className="text-center py-8 text-slate-500 dark:text-slate-400">No employees found.</div>}
                        </div>
                    )}
                </div>
            )}

            {/* Office Schedule Modal (Existing functionality ported) */}
            {officeModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                {officeModal.isDefault ? 'Edit Default Schedule' : (officeModal.editingId ? 'Edit Schedule Override' : 'New Schedule Override')}
                            </h3>
                            <button onClick={() => setOfficeModal({ ...officeModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X className="w-5 h-5" /></button>
                        </div>
                        <form className="p-6 space-y-4">
                            {!officeModal.isDefault && officeModal.editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date *</label>
                                    <input type="date" disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg opacity-70" value={officeModal.data.date || ''} />
                                </div>
                            )}
                            {!officeModal.isDefault && !officeModal.editingId && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date *</label>
                                        <input type="date" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.startDate} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, startDate: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Date *</label>
                                        <input type="date" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.endDate} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, endDate: e.target.value } })} />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Time *</label>
                                    <input type="time" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.startTime} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, startTime: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Time *</label>
                                    <input type="time" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.endTime} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, endTime: e.target.value } })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Grace Period (Minutes) *</label>
                                <input type="number" min="0" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.gracePeriod} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, gracePeriod: parseInt(e.target.value) || 0 } })} />
                            </div>

                            {officeModal.isDefault && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Working Days *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_FULL_NAMES.map((name, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleWorkingDay(idx)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                                    (officeModal.data.workingDays || []).includes(idx)
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">Selected: {formatWorkingDays(officeModal.data.workingDays)}</p>
                                </div>
                            )}

                            {!officeModal.isDefault && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reason (Optional)</label>
                                    <input type="text" placeholder="e.g. Holiday" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={officeModal.data.reason} onChange={e => setOfficeModal({ ...officeModal, data: { ...officeModal.data, reason: e.target.value } })} />
                                </div>
                            )}
                            <div className="pt-4 flex justify-end gap-3 flex-col sm:flex-row">
                                <button type="button" onClick={() => setOfficeModal({ ...officeModal, isOpen: false })} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors text-center">Cancel</button>
                                <button type="button" disabled={isSaving} onClick={(e) => handleOfficeSubmit(e, false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors text-center border border-slate-700">Save Only</button>
                                <button type="button" disabled={isSaving} onClick={(e) => handleOfficeSubmit(e, true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex justify-center items-center gap-2">
                                    <Bell className="w-4 h-4" /> Save & Notify
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shift Modal (For Department and Employee) */}
            {shiftModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white capitalize">
                                {shiftModal.type} Schedule
                            </h3>
                            <button onClick={() => setShiftModal({ ...shiftModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleShiftSubmit} className="p-6 space-y-5">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Setting schedule for:</p>
                                <p className="text-base font-bold text-slate-800 dark:text-white">{shiftModal.entityName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Time *</label>
                                    <input type="time" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={shiftModal.data.startTime} onChange={e => setShiftModal({ ...shiftModal, data: { ...shiftModal.data, startTime: e.target.value } })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Time *</label>
                                    <input type="time" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={shiftModal.data.endTime} onChange={e => setShiftModal({ ...shiftModal, data: { ...shiftModal.data, endTime: e.target.value } })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Grace Period (Minutes) *</label>
                                <input type="number" min="0" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900" value={shiftModal.data.gracePeriod} onChange={e => setShiftModal({ ...shiftModal, data: { ...shiftModal.data, gracePeriod: parseInt(e.target.value) || 0 } })} />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShiftModal({ ...shiftModal, isOpen: false })} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficeScheduleManagement;
