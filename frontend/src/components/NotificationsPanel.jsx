import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CalendarCheck, Megaphone, TrendingUp, ShieldCheck, X } from 'lucide-react';
import apiClient from '../api/axiosClient';
import { formatDate } from '../utils/dateUtils';


const ICONS = {
    leave: <CalendarCheck size={16} className="text-emerald-500" />,
    announcement: <Megaphone size={16} className="text-sky-500" />,
    increment: <TrendingUp size={16} className="text-indigo-500" />,
    promotion: <TrendingUp size={16} className="text-purple-500" />,
    system: <ShieldCheck size={16} className="text-slate-500" />,
    chat: <Bell size={16} className="text-rose-500" />
};

const NotificationsPanel = ({ onNavigate }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const panelRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 3 seconds for real-time feel
        const interval = setInterval(fetchNotifications, 3000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (id) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleItemClick = (notif) => {
        if (!notif.isRead) handleMarkAsRead(notif._id);
        setSelectedNotification(notif);
        setIsOpen(false);
    };

    const handleActionNavigate = (notif) => {
        if (onNavigate) {
            if (notif.type === 'LoanRequest') {
                onNavigate('hr-requests', 'loans');
            } else if (notif.type === 'HRRequest') {
                onNavigate('hr-requests', 'general');
            } else if (notif.type === 'LeaveRequest' || notif.type === 'leave') {
                onNavigate('leaves');
            } else if (notif.type === 'MistakeReport') {
                onNavigate('mistake-reports');
            } else if (notif.type === 'chat') {
                onNavigate('messages');
            }
        }
        setSelectedNotification(null);
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.put('/notifications/read-all/all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={panelRef}>
            <button 
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden flex flex-col"
                    >
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Bell size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif._id} 
                                            onClick={() => handleItemClick(notif)}
                                            className={`p-4 flex gap-3 cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-50/30 hover:bg-indigo-50/50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>
                                                {ICONS[notif.type] || ICONS.system}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className={`text-sm truncate ${!notif.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-600 dark:text-slate-400'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                                                        {formatDate(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs ${!notif.isRead ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'} line-clamp-2 leading-relaxed`}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Details Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedNotification && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                                        {ICONS[selectedNotification.type] || ICONS.system}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{selectedNotification.title}</h3>
                                        <p className="text-[11px] font-medium text-slate-500">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedNotification.message}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button 
                                    onClick={() => setSelectedNotification(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                {['LoanRequest', 'HRRequest', 'LeaveRequest', 'leave', 'MistakeReport'].includes(selectedNotification.type) && (
                                    <button 
                                        onClick={() => handleActionNavigate(selectedNotification)}
                                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md flex items-center gap-2"
                                    >
                                        Take Action
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default NotificationsPanel;
