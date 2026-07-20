import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Search, ExternalLink, Users, ListTodo, Award, Check } from 'lucide-react';

const HRPracticeOnboarding = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' or 'tasks'
    const [searchTerm, setSearchTerm] = useState('');

    // Task Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        category: 'General',
        link: ''
    });

    // Employee detail selection
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, employeesRes] = await Promise.all([
                apiClient.get('/onboarding/tasks'),
                apiClient.get('/auth/users')
            ]);
            setTasks(tasksRes.data);
            setEmployees(employeesRes.data);
        } catch (err) {
            console.error("Error fetching onboarding data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!taskForm.title.trim()) return alert("Title is required.");

        try {
            if (editingTask) {
                const res = await apiClient.put(`/onboarding/tasks/${editingTask._id}`, taskForm);
                setTasks(tasks.map(t => t._id === editingTask._id ? res.data : t));
                alert("Task updated successfully!");
            } else {
                const res = await apiClient.post('/onboarding/tasks', taskForm);
                setTasks([...tasks, res.data]);
                alert("Task created successfully!");
            }
            resetForm();
            fetchData(); // Refresh to compute progress correctly
        } catch (err) {
            console.error("Error saving task:", err);
            alert("Failed to save task.");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this onboarding task?")) return;

        try {
            await apiClient.delete(`/onboarding/tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
            alert("Task deleted.");
            fetchData(); // Refresh progress
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Failed to delete task.");
        }
    };

    const openEditForm = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title,
            description: task.description || '',
            category: task.category || 'General',
            link: task.link || ''
        });
        setShowTaskForm(true);
    };

    const resetForm = () => {
        setEditingTask(null);
        setTaskForm({
            title: '',
            description: '',
            category: 'General',
            link: ''
        });
        setShowTaskForm(false);
    };

    const getProgressInfo = (employeeId) => {
        if (tasks.length === 0) return { percent: 0, completed: 0, total: 0 };
        const completedTasks = tasks.filter(task => task.completedBy.includes(employeeId));
        const percent = Math.round((completedTasks.length / tasks.length) * 100);
        return {
            percent,
            completed: completedTasks.length,
            total: tasks.length
        };
    };

    // Filter employees
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Practice Onboarding</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage onboarding practice tasks and track employee progress.</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setActiveSubTab('overview'); setSelectedEmployee(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSubTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Users size={16} />
                        Employee Progress
                    </button>
                    <button
                        onClick={() => setActiveSubTab('tasks')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSubTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ListTodo size={16} />
                        Manage Tasks
                    </button>
                </div>
            </div>

            {/* TAB 1: OVERVIEW & PROGRESS */}
            {activeSubTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee list section */}
                    <div className={`${selectedEmployee ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300`}>
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Award className="text-indigo-600" size={24} />
                                <h2 className="font-bold text-slate-800 text-lg">Employee Training Progress</h2>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or dept..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Department & Role</th>
                                        <th className="px-6 py-4">Tasks Done</th>
                                        <th className="px-6 py-4">Progress</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                No employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => {
                                            const { percent, completed, total } = getProgressInfo(emp._id);
                                            return (
                                                <tr
                                                    key={emp._id}
                                                    onClick={() => setSelectedEmployee(emp)}
                                                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedEmployee?._id === emp._id ? 'bg-indigo-50/20' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-100 uppercase">
                                                                {emp.name[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{emp.name}</div>
                                                                <div className="text-xs text-slate-400 mt-0.5">{emp.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                                                            {emp.department || 'development'}
                                                        </span>
                                                        <div className="text-xs text-slate-400 mt-1 capitalize">{emp.role}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-sm text-slate-700">
                                                        {completed} / {total}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="w-full max-w-[160px] bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                                style={{ width: `${percent}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-bold mt-1.5 block ${percent === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                            {percent}% Complete
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setSelectedEmployee(emp)}
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Employee Details Drawer */}
                    {selectedEmployee && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center uppercase shadow-lg shadow-indigo-100">
                                            {selectedEmployee.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base leading-none">{selectedEmployee.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">{selectedEmployee.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedEmployee(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-4 space-y-4">
                                    <h4 className="font-bold text-sm text-slate-800">Task Checklist Breakdown</h4>
                                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                                        {tasks.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No tasks created yet.</p>
                                        ) : (
                                            tasks.map((task) => {
                                                const isCompleted = task.completedBy.includes(selectedEmployee._id);
                                                return (
                                                    <div
                                                        key={task._id}
                                                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${isCompleted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <p className={`font-semibold text-xs truncate ${isCompleted ? 'text-emerald-800' : 'text-slate-700'}`}>
                                                                {task.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{task.category}</p>
                                                        </div>
                                                        <div>
                                                            {isCompleted ? (
                                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-100">
                                                                    <Check size={12} strokeWidth={3} />
                                                                </span>
                                                            ) : (
                                                                <span className="w-5 h-5 rounded-full border-2 border-slate-200 block bg-white"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 flex flex-col items-center gap-2">
                                <div className="text-xs text-slate-500">
                                    Total Completed: <span className="font-bold text-slate-800">{getProgressInfo(selectedEmployee._id).completed}</span> out of {tasks.length}
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${getProgressInfo(selectedEmployee._id).percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* TAB 2: MANAGE TASKS */}
            {activeSubTab === 'tasks' && (
                <div className="space-y-6">
                    {/* Add/Edit task card form */}
                    {showTaskForm ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto"
                        >
                            <h2 className="font-bold text-slate-800 text-lg mb-4">
                                {editingTask ? 'Edit Onboarding Task' : 'Create Onboarding Task'}
                            </h2>
                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Task Title *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Set up Development Environment"
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
                                        <select
                                            value={taskForm.category}
                                            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all capitalize"
                                        >
                                            <option value="General">General</option>
                                            <option value="Documentation">Documentation</option>
                                            <option value="IT Setup">IT Setup</option>
                                            <option value="Training">Training</option>
                                            <option value="Culture">Culture</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Resource URL / Link</label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/handbook"
                                            value={taskForm.link}
                                            onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                                    <textarea
                                        placeholder="Provide detailed instructions for the employee..."
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
                                    >
                                        {editingTask ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowTaskForm(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition-all"
                            >
                                <Plus size={16} />
                                Add New Task
                            </button>
                        </div>
                    )}

                    {/* Tasks List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.length === 0 ? (
                            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                                No onboarding tasks found. Create one above to get started!
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task._id}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 capitalize">
                                                {task.category || 'General'}
                                            </span>
                                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openEditForm(task)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task._id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-slate-800 text-base line-clamp-1">{task.title}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                            {task.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400">
                                            Completed by: <strong className="text-slate-600">{task.completedBy.length}</strong> employees
                                        </span>
                                        {task.link && (
                                            <a
                                                href={task.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                View Resource <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default HRPracticeOnboarding;
