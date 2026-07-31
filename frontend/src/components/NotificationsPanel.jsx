import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CalendarCheck, Megaphone, TrendingUp, ShieldCheck, X } from 'lucide-react';
import apiClient from '../api/axiosClient';

const ICONS = {
    leave: <CalendarCheck size={16} className="text-emerald-500" />,
    announcement: <Megaphone size={16} className="text-sky-500" />,
    increment: <TrendingUp size={16} className="text-indigo-500" />,
    promotion: <TrendingUp size={16} className="text-purple-500" />,
    system: <ShieldCheck size={16} className="text-slate-500" />,
    chat: <Bell size={16} className="text-rose-500" />
};

const NotificationsPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
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
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden flex flex-col"
                    >
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif._id} 
                                            onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                                            className={`p-4 flex gap-3 cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-white shadow-sm border border-indigo-100' : 'bg-slate-100 border border-slate-200'}`}>
                                                {ICONS[notif.type] || ICONS.system}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className={`text-sm truncate ${!notif.isRead ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                        {new Date(notif.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={`text-xs ${!notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-500'} line-clamp-2 leading-relaxed`}>
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
        </div>
    );
};

export default NotificationsPanel;
