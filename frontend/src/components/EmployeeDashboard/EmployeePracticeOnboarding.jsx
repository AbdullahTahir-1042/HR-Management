import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle2, Circle, ExternalLink, HelpCircle, Award, Compass, RefreshCw, Layers } from 'lucide-react';

const EmployeePracticeOnboarding = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/onboarding/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching onboarding tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (taskId) => {
        try {
            // Optimistic update
            setTasks(prevTasks => 
                prevTasks.map(t => {
                    if (t._id === taskId) {
                        const index = t.completedBy.indexOf(user.id);
                        const newCompletedBy = [...t.completedBy];
                        if (index > -1) {
                            newCompletedBy.splice(index, 1);
                        } else {
                            newCompletedBy.push(user.id);
                        }
                        return { ...t, completedBy: newCompletedBy };
                    }
                    return t;
                })
            );

            // Make API call
            await apiClient.post(`/onboarding/tasks/${taskId}/toggle`);
        } catch (err) {
            console.error("Error toggling task completion:", err);
            alert("Failed to update status. Please try again.");
            fetchTasks(); // Revert back on error
        }
    };

    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completedBy.includes(user?.id)).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Categories
    const categories = ['all', ...new Set(tasks.map(t => t.category).filter(Boolean))];

    // Filter tasks
    const filteredTasks = tasks.filter(t => 
        filterCategory === 'all' ? true : t.category === filterCategory
    );

    const getMotivationText = (percent) => {
        if (percent === 100) return "Outstanding! You have completed all onboarding steps!";
        if (percent >= 75) return "Almost there! Just a few remaining tasks.";
        if (percent >= 40) return "Great progress! You are settling in nicely.";
        if (percent > 0) return "Good start! Keep going to finish your onboarding.";
        return "Welcome! Let's get started on your onboarding checklist.";
    };

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
            className="space-y-8"
        >
            {/* Header info */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Practice Onboarding</h1>
                <p className="text-sm text-slate-500 mt-1">Complete your checklist tasks to get fully settled into your new role.</p>
            </div>

            {/* Premium Progress Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/10 border border-indigo-700/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                
                <div className="space-y-4 max-w-lg z-10 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 border border-indigo-400/20">
                        <Award size={14} className="text-indigo-200" />
                        <span>Onboarding Goal Tracker</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Your Progress is {progressPercent}%</h2>
                    <p className="text-sm text-indigo-200/90 leading-relaxed font-medium">
                        {getMotivationText(progressPercent)}
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3 z-10 w-full md:w-auto">
                    <div className="relative w-28 h-28 flex items-center justify-center bg-white/5 rounded-full border border-white/10 shadow-inner">
                        <span className="text-2xl font-black">{progressPercent}%</span>
                        {/* Circle path styling for premium vibe */}
                        <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-white/10"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-indigo-400 transition-all duration-1000"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 48}
                                strokeDashoffset={2 * Math.PI * 48 * (1 - progressPercent / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <span className="text-xs text-indigo-300 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                        {completedTasks} / {totalTasks} Tasks Done
                    </span>
                </div>
            </div>

            {/* Filter and Content Area */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        <Layers size={18} className="text-indigo-600" />
                        <span>Filter by Category:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50'}`}
                            >
                                {cat === 'all' ? 'All Tasks' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400"
                            >
                                No tasks found in this category.
                            </motion.div>
                        ) : (
                            filteredTasks.map((task) => {
                                const isCompleted = task.completedBy.includes(user?.id);
                                return (
                                    <motion.div
                                        key={task._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${isCompleted ? 'border-emerald-200 bg-emerald-50/10 shadow-sm' : 'border-slate-200 hover:border-indigo-100 hover:shadow-md hover:shadow-slate-100/50'}`}
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {task.category || 'General'}
                                                </span>

                                                <button
                                                    onClick={() => handleToggleComplete(task._id)}
                                                    className="p-1 rounded-full transition-colors focus:outline-none"
                                                    title={isCompleted ? "Mark incomplete" : "Mark complete"}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="text-emerald-500 fill-emerald-100/30" size={24} />
                                                    ) : (
                                                        <Circle className="text-slate-300 hover:text-indigo-500 transition-colors" size={24} />
                                                    )}
                                                </button>
                                            </div>

                                            <div>
                                                <h3 className={`font-bold text-base transition-colors duration-300 ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                    {task.title}
                                                </h3>
                                                <p className={`text-xs mt-2 leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {task.description || "No description provided."}
                                                </p>
                                            </div>
                                        </div>

                                        {(task.link || isCompleted) && (
                                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-[11px] font-bold">
                                                    {isCompleted ? (
                                                        <span className="text-emerald-600 flex items-center gap-1">Task Completed</span>
                                                    ) : (
                                                        <span className="text-amber-500 flex items-center gap-1">Pending Action</span>
                                                    )}
                                                </span>
                                                {task.link && (
                                                    <a
                                                        href={task.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                    >
                                                        Open Guide <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default EmployeePracticeOnboarding;
