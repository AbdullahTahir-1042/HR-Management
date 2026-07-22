import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import apiClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { requestForToken, onMessageListener } from '../firebase';

import EmployeeSidebar from '../components/EmployeeDashboard/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeDashboard/EmployeeHeader';
import EmployeeOverview from '../components/EmployeeDashboard/EmployeeOverview';
import EmployeeAttendance from '../components/EmployeeDashboard/EmployeeAttendance';
import EmployeeLeaves from '../components/EmployeeDashboard/EmployeeLeaves';
import EmployeeHolidays from '../components/EmployeeDashboard/EmployeeHolidays';
import EmployeeHRRequests from '../components/EmployeeDashboard/EmployeeHRRequests';
import EmployeeAnnouncement from '../components/EmployeeDashboard/EmployeeAnnouncement';
import UpdateProfilePage from '../components/UpdateProfilePage';
import MyTeamSection from '../components/EmployeeDashboard/MyTeamSection';

// ── Announcement Toast Notification ──────────────────────────────────────────
const AnnouncementToast = ({ notification, onClose }) => (
    <motion.div
        initial={{ opacity: 0, x: 80, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-5 right-5 z-[9999] w-80 bg-white border border-indigo-100 rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden"
    >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="p-4">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Megaphone size={17} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">New Announcement</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{notification.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notification.body}</p>
                </div>
                <button
                    onClick={onClose}
                    className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                >
                    <X size={15} />
                </button>
            </div>
        </div>
    </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
    const { user: authUser, logout, updateUser } = useContext(AuthContext);
    const [fullUser, setFullUser] = useState(authUser || null);
    const [attendance, setAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── UC-09: HR Requests state ───────────────────────────────────────────────
    const [hrRequests, setHrRequests] = useState([]);
    const [hrRequestSubmitting, setHrRequestSubmitting] = useState(false);

    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
    const [activeTab, setActiveTab] = useState('dashboard');

    // Filters
    const [announcements, setAnnouncements] = useState([]);
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

    // ── Notification Toast state ───────────────────────────────────────────────
    const [toast, setToast] = useState(null); // { title, body }
    const toastTimerRef = useRef(null);
    // Ref to track notified announcement IDs so notification NEVER fires twice
    const notifiedAnnouncementIdsRef = useRef(new Set());
    const isInitializedRef = useRef(false);

    const showToast = useCallback((title, body) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ title, body });
        toastTimerRef.current = setTimeout(() => setToast(null), 7000);
    }, []);

    const dismissToast = useCallback(() => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(null);
    }, []);

    // ── Initial data load ──────────────────────────────────────────────────────
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const profilePromise = authUser ? Promise.resolve({ data: authUser }) : apiClient.get('/auth/user');
            const [profile, todayAtt, history, leavesRes, holidaysRes, hrReqs, balances, types, announcementsRes] = await Promise.all([
                profilePromise,
                apiClient.get('/attendance/status'),
                apiClient.get('/attendance/my-history'),
                apiClient.get('/leaves/my-leaves'),
                apiClient.get('/holidays'),
                apiClient.get('/hr-requests/my-requests'),
                apiClient.get('/leaves/balances'),
                apiClient.get('/leaves/types'),
                apiClient.get('/announcements')
            ]);
            setFullUser(profile.data);
            if (!authUser) updateUser(profile.data);
            setAttendance(todayAtt.data);
            setAttendanceHistory(history.data);
            setLeaves(leavesRes.data);
            setHolidays(holidaysRes.data);
            setHrRequests(hrReqs.data);
            setLeaveBalances(balances.data);
            setLeaveTypes(types.data);
            const ann = announcementsRes.data || [];
            setAnnouncements(ann);
            
            // Mark all existing announcements as notified on initial load so old ones never trigger popup
            ann.forEach(a => {
                if (a._id) notifiedAnnouncementIdsRef.current.add(a._id);
            });
            isInitializedRef.current = true;
        } catch (err) {
            console.error('Dashboard parallel fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // ── Firebase notifications + fast polling fallback ─────────────────────────
    useEffect(() => {
        // 1. Request FCM token and sync to backend
        const setupNotifications = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    await apiClient.put('/auth/fcm-token', { token });
                    console.log('FCM Token synced to server successfully.');
                }
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };
        setupNotifications();

        // Helper to trigger browser desktop notification when app is in background/other tab
        const triggerDesktopNotification = (title, body) => {
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(`📢 ${title}`, {
                        body: body,
                        icon: '/favicon.svg'
                    });
                } catch (e) {
                    console.error("Desktop notification error:", e);
                }
            }
        };

        // Request browser desktop notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // 2. Firebase foreground message — show toast + desktop notification + refresh announcements
        const unsubscribe = onMessageListener((payload) => {
            console.log('Foreground message received:', payload);
            const title = payload?.notification?.title || payload?.data?.title || 'New Announcement';
            const body = payload?.notification?.body || payload?.data?.body || '';
            showToast(title, body);
            triggerDesktopNotification(title, body);
            fetchAllAnnouncements();
        });

        // 3. BroadcastChannel listener for sub-second sync across tabs in same browser
        let broadcastChannel = null;
        if ("BroadcastChannel" in window) {
            try {
                broadcastChannel = new BroadcastChannel('announcements_channel');
                broadcastChannel.onmessage = (event) => {
                    if (event.data && event.data.type === 'NEW_ANNOUNCEMENT') {
                        const announcement = event.data.announcement;
                        if (announcement && announcement._id && !notifiedAnnouncementIdsRef.current.has(announcement._id)) {
                            notifiedAnnouncementIdsRef.current.add(announcement._id);
                            showToast(announcement.title, announcement.message);
                            triggerDesktopNotification(announcement.title, announcement.message);
                            fetchAllAnnouncements();
                        }
                    }
                };
            } catch (e) {
                console.error("BroadcastChannel setup error:", e);
            }
        }

        // 4. Server-Sent Events (SSE) stream connection — receives announcements in real-time instantly without polling!
        let eventSource = null;
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const token =
                localStorage.getItem('token') ||
                localStorage.getItem('authToken') ||
                localStorage.getItem('x-auth-token') ||
                '';
            
            eventSource = new EventSource(`${baseUrl}/announcements/stream?token=${token}`);
            
            eventSource.onmessage = (event) => {
                try {
                    const newAnnouncement = JSON.parse(event.data);
                    if (newAnnouncement && newAnnouncement._id) {
                        if (!notifiedAnnouncementIdsRef.current.has(newAnnouncement._id)) {
                            notifiedAnnouncementIdsRef.current.add(newAnnouncement._id);
                            showToast(newAnnouncement.title, newAnnouncement.message);
                            triggerDesktopNotification(newAnnouncement.title, newAnnouncement.message);
                            // Prepend new announcement to the active list instantly
                            setAnnouncements(prev => {
                                const exists = prev.some(item => item._id === newAnnouncement._id);
                                if (exists) return prev;
                                return [newAnnouncement, ...prev];
                            });
                        }
                    }
                } catch (err) {
                    console.error("SSE message parsing error:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE connection error:", err);
            };
        } catch (e) {
            console.error("Failed to establish SSE connection:", e);
        }

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
            if (broadcastChannel) broadcastChannel.close();
            if (eventSource) eventSource.close();
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [showToast]);

    // ── Individual fetch helpers ───────────────────────────────────────────────
    const fetchUserProfile = async () => {
        try {
            const res = await apiClient.get('/auth/user');
            setFullUser(res.data);
            updateUser(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const res = await apiClient.get('/attendance/status');
            setAttendance(res.data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            const res = await apiClient.get('/attendance/my-history');
            setAttendanceHistory(res.data);
        } catch (err) {
            console.error('Error fetching attendance history:', err);
        }
    };

    const fetchMyLeaves = async () => {
        try {
            const res = await apiClient.get('/leaves/my-leaves');
            setLeaves(res.data);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        }
    };

    const fetchAllAnnouncements = async () => {
        try {
            const res = await apiClient.get('/announcements');
            setAnnouncements(res.data);
            announcementsCountRef.current = res.data.length;
        } catch (err) {
            console.error('Error fetching announcements:', err);
        }
    };

    const fetchLeaveBalances = async () => {
        try {
            const res = await apiClient.get('/leaves/balances');
            setLeaveBalances(res.data);
        } catch (err) {
            console.error('Error fetching leave balances:', err);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await apiClient.get('/leaves/types');
            setLeaveTypes(res.data);
        } catch (err) {
            console.error('Error fetching leave types:', err);
        }
    };

    // ── UC-07: Fetch all company holidays ─────────────────────────────────────
    const fetchHolidays = async () => {
        try {
            const res = await apiClient.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays:', err);
        }
    };

    // ── UC-09: Fetch employee's own HR requests ────────────────────────────────
    const fetchHRRequests = async () => {
        try {
            const res = await apiClient.get('/hr-requests/my-requests');
            setHrRequests(res.data);
        } catch (err) {
            console.error('Error fetching HR requests:', err);
        }
    };

    // ── UC-09: Submit new HR request ──────────────────────────────────────────
    const handleSubmitHRRequest = async (form) => {
        setHrRequestSubmitting(true);
        try {
            await apiClient.post('/hr-requests', form);
            await fetchHRRequests();
            setHrRequestSubmitting(false);
            return true;
        } catch (err) {
            alert(err.response?.data?.msg || 'Error submitting request');
            setHrRequestSubmitting(false);
            return false;
        }
    };

    const handleCheckIn = async () => {
        await apiClient.post('/attendance/check-in');
        fetchTodayAttendance();
        fetchAttendanceHistory();
    };

    const handleCheckOut = async () => {
        await apiClient.post('/attendance/check-out');
        fetchTodayAttendance();
        fetchAttendanceHistory();
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        if (!leaveForm.leaveTypeId) return alert('Please select a leave type.');
        const start = new Date(leaveForm.startDate);
        const end = new Date(leaveForm.endDate);
        if (start > end) return alert('Start date cannot be after the end date.');
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        const noticeDays = Math.ceil(Math.abs(start - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1 && noticeDays < 4)
            return alert('For a 1-day leave, you must apply at least 4 days in advance.');
        if (diffDays > 1 && noticeDays < 8)
            return alert('For leaves longer than 1 day, you must apply at least 8 days in advance.');
        try {
            await apiClient.post('/leaves/apply', leaveForm);
            alert('Leave request submitted!');
            setLeaveForm({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
            fetchMyLeaves();
            fetchLeaveBalances();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error applying for leave');
        }
    };

    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [activeTab]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans relative">
            {/* ── Announcement Toast (top-right popup) ── */}
            <AnimatePresence>
                {toast && (
                    <AnnouncementToast
                        notification={toast}
                        onClose={dismissToast}
                    />
                )}
            </AnimatePresence>

            <EmployeeSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={fullUser || authUser}
                logout={logout}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="flex-1 overflow-y-auto">
                <EmployeeHeader activeTab={activeTab} setSidebarOpen={setSidebarOpen} />

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">

                        {activeTab === 'dashboard' && (
                            <EmployeeOverview
                                user={fullUser || authUser}
                                attendance={attendance}
                                leaves={leaves}
                                holidays={holidays}
                                announcements={announcements}
                                setActiveTab={setActiveTab}
                            />
                        )}

                        {activeTab === 'attendance' && (
                            <EmployeeAttendance
                                attendance={attendance}
                                history={attendanceHistory.filter(a =>
                                    attendanceDateFilter ? a.date === attendanceDateFilter : true
                                )}
                                dateFilter={attendanceDateFilter}
                                setDateFilter={setAttendanceDateFilter}
                                handleCheckIn={handleCheckIn}
                                handleCheckOut={handleCheckOut}
                            />
                        )}

                        {activeTab === 'leaves' && (
                            <EmployeeLeaves
                                leaveForm={leaveForm}
                                setLeaveForm={setLeaveForm}
                                handleApplyLeave={handleApplyLeave}
                                leaves={leaves.filter(l =>
                                    leaveStatusFilter === 'all' ? true : l.status === leaveStatusFilter
                                )}
                                statusFilter={leaveStatusFilter}
                                setStatusFilter={setLeaveStatusFilter}
                                leaveBalances={leaveBalances}
                                leaveTypes={leaveTypes}
                            />
                        )}

                        {/* ── UC-07: Holiday Calendar ── */}
                        {activeTab === 'holidays' && (
                            <EmployeeHolidays holidays={holidays} />
                        )}

                        {/* ── UC-09: HR Requests ── */}
                        {activeTab === 'hr-requests' && (
                            <EmployeeHRRequests
                                requests={hrRequests}
                                onSubmit={handleSubmitHRRequest}
                                submitting={hrRequestSubmitting}
                            />
                        )}

                        {activeTab === 'profile' && (
                            <UpdateProfilePage
                                user={fullUser || authUser}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        )}

                        {activeTab === 'announcements' && (
                            <EmployeeAnnouncement
                                initialAnnouncements={announcements}
                                onRefreshAnnouncements={fetchAllAnnouncements}
                            />
                        )}

                        {activeTab === 'myTeam' && (
                            <MyTeamSection key="myTeam" />
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;