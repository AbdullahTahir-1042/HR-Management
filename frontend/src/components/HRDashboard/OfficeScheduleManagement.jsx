import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Edit2, Trash2, Plus, Save, Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OfficeScheduleManagement = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        isDefault: false,
        date: '', // used for editing single override
        startDate: '', // used for creating new overrides
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriod: 15,
        reason: '',
        notifyEmployees: false
    });
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/office-schedule', {
                headers: { 'x-auth-token': token }
            });
            setSchedules(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (schedule = null, isDefault = false) => {
        if (schedule) {
            setEditingId(schedule._id);
            setFormData({
                isDefault: schedule.isDefault,
                date: schedule.date || '',
                startDate: schedule.date || '',
                endDate: schedule.date || '',
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                gracePeriod: schedule.gracePeriod,
                workingDays: schedule.workingDays || [1, 2, 3, 4, 5],
                reason: schedule.reason || '',
                notifyEmployees: false
            });
        } else {
            setEditingId(null);
            setFormData({
                isDefault,
                date: '',
                startDate: '',
                endDate: '',
                startTime: '09:00',
                endTime: '18:00',
                gracePeriod: 15,
                workingDays: [1, 2, 3, 4, 5],
                reason: '',
                notifyEmployees: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const formatTime12hr = (timeString) => {
        if (!timeString) return '';
        const [h, m] = timeString.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    const handleSubmit = async (e, notifyEmployees = false) => {
        e.preventDefault();
        
        if (!formData.isDefault && !editingId && (!formData.startDate || !formData.endDate)) {
            return toast.error("Start and End dates are required.");
        }

        if (formData.startTime >= formData.endTime) {
            return toast.error("Start time must be before end time.");
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const payload = { ...formData, notifyEmployees };

            if (editingId && !formData.isDefault) {
                await axios.put(`/api/office-schedule/${editingId}`, payload, config);
                toast.success('Schedule updated successfully');
            } else {
                await axios.post('/api/office-schedule', payload, config);
                toast.success(formData.isDefault ? 'Default schedule updated' : 'Schedule override created');
            }
            
            fetchSchedules();
            handleCloseModal();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.msg || 'Failed to save schedule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this custom schedule?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/office-schedule/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success('Schedule deleted');
            fetchSchedules();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete schedule');
        }
    };

    const defaultSchedule = Array.isArray(schedules) ? schedules.find(s => s.isDefault) : null;
    const customSchedules = Array.isArray(schedules) ? schedules.filter(s => !s.isDefault) : [];

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const toggleWorkingDay = (dayIndex) => {
        const current = formData.workingDays || [];
        const updated = current.includes(dayIndex)
            ? current.filter(d => d !== dayIndex)
            : [...current, dayIndex].sort((a, b) => a - b);
        setFormData({ ...formData, workingDays: updated });
    };

    const formatWorkingDays = (days) => {
        if (!days || days.length === 0) return 'None';
        if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return 'Mon – Fri';
        if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5,6])) return 'Mon – Sat';
        return days.map(d => DAY_NAMES[d]).join(', ');
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-32 bg-slate-200 rounded"></div>
                    <div className="h-64 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Office Schedule Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure default working hours and date-specific overrides.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal(null, false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Custom Override
                </button>
            </div>

            {/* Default Schedule Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Default Office Timings
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This schedule applies to all employees unless a custom override exists.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal(defaultSchedule, true)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition"
                        title="Edit Default Schedule"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>

                {defaultSchedule ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Working Hours</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">
                                {formatTime12hr(defaultSchedule.startTime)} - {formatTime12hr(defaultSchedule.endTime)}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Grace Period</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">
                                {defaultSchedule.gracePeriod} Minutes
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Working Days</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-white">
                                {formatWorkingDays(defaultSchedule.workingDays)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                        <p className="text-slate-500 dark:text-slate-400 mb-4">No default schedule configured.</p>
                        <button 
                            onClick={() => handleOpenModal(null, true)}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition text-sm font-medium"
                        >
                            Set Default Schedule
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Schedules List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Upcoming Schedule Overrides
                </h2>

                {customSchedules.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                                    <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Working Hours</th>
                                    <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Grace Period</th>
                                    <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Reason</th>
                                    <th className="pb-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customSchedules.map(schedule => (
                                    <tr key={schedule._id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <td className="py-4 font-medium text-slate-800 dark:text-white">
                                            {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="py-4 text-slate-600 dark:text-slate-300">
                                            {formatTime12hr(schedule.startTime)} - {formatTime12hr(schedule.endTime)}
                                        </td>
                                        <td className="py-4 text-slate-600 dark:text-slate-300">
                                            {schedule.gracePeriod} min
                                        </td>
                                        <td className="py-4 text-slate-600 dark:text-slate-300">
                                            {schedule.reason || '-'}
                                        </td>
                                        <td className="py-4 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(schedule, false)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition"
                                                title="Edit Schedule"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(schedule._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition"
                                                title="Delete Schedule"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">No Custom Schedules</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't set any specific date overrides.</p>
                        <button 
                            onClick={() => handleOpenModal(null, false)}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition font-medium"
                        >
                            Add Override
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                {formData.isDefault ? 'Edit Default Schedule' : (editingId ? 'Edit Schedule Override' : 'New Schedule Override')}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form className="p-6 space-y-4">
                            {!formData.isDefault && editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date *</label>
                                    <input 
                                        type="date"
                                        required
                                        disabled={true}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                        value={formData.date}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}

                            {!formData.isDefault && !editingId && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date *</label>
                                        <input 
                                            type="date"
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Date *</label>
                                        <input 
                                            type="date"
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value, startDate: formData.startDate || e.target.value })}
                                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Time *</label>
                                    <input 
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Time *</label>
                                    <input 
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Late Grace Period (Minutes) *</label>
                                <input 
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={formData.gracePeriod}
                                    onChange={e => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                                />
                            </div>

                            {!formData.isDefault && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reason (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Company Event"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            )}

                            {formData.isDefault && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Working Days *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_FULL_NAMES.map((name, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleWorkingDay(idx)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                                    (formData.workingDays || []).includes(idx)
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">Selected: {formatWorkingDays(formData.workingDays)}</p>
                                </div>
                            )}

                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, false)}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Only
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                >
                                    <Bell className="w-4 h-4" />
                                    Save & Notify
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
