import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// --- NEW FIREBASE IMPORTS ---
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

const EmployeeDashboard = () => {
    const { user: authUser, logout, updateUser } = useContext(AuthContext);
    const [fullUser, setFullUser] = useState(null);
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

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [profile, todayAtt, history, leavesRes, holidaysRes, hrReqs, balances, types, announcementsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/auth/user`),
                axios.get(`${import.meta.env.VITE_API_URL}/attendance/status`),
                axios.get(`${import.meta.env.VITE_API_URL}/attendance/my-history`),
                axios.get(`${import.meta.env.VITE_API_URL}/leaves/my-leaves`),
                axios.get(`${import.meta.env.VITE_API_URL}/holidays`),
                axios.get(`${import.meta.env.VITE_API_URL}/hr-requests/my-requests`),
                axios.get(`${import.meta.env.VITE_API_URL}/leaves/balances`),
                axios.get(`${import.meta.env.VITE_API_URL}/leaves/types`),
                axios.get(`${import.meta.env.VITE_API_URL}/announcements`)
            ]);
            
            setFullUser(profile.data);
            updateUser(profile.data);
            setAttendance(todayAtt.data);
            setAttendanceHistory(history.data);
            setLeaves(leavesRes.data);
            setHolidays(holidaysRes.data);
            setHrRequests(hrReqs.data);
            setLeaveBalances(balances.data);
            setLeaveTypes(types.data);
            setAnnouncements(announcementsRes.data);
        } catch (err) {
            console.error("Dashboard parallel fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // --- FIREBASE NOTIFICATION SETUP ---
    useEffect(() => {
        const setupNotifications = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    await axios.put(`${import.meta.env.VITE_API_URL}/auth/fcm-token`, { token });
                    console.log('FCM Token synced to server successfully.');
                }
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };

        setupNotifications();

        const unsubscribe = onMessageListener((payload) => {
            console.log("Foreground message received:", payload);
            fetchAllAnnouncements(); 
        });
        
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/user`);
            setFullUser(res.data);
            updateUser(res.data);
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance/status`);
            setAttendance(res.data);
        } catch (err) {
            console.error("Error fetching attendance:", err);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance/my-history`);
            setAttendanceHistory(res.data);
        } catch (err) {
            console.error("Error fetching attendance history:", err);
        }
    };

    const fetchMyLeaves = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/my-leaves`);
            setLeaves(res.data);
        } catch (err) {
            console.error("Error fetching leaves:", err);
        }
    };

    const fetchAllAnnouncements = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/announcements`);
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
        }
    };

    const fetchLeaveBalances = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/balances`);
            setLeaveBalances(res.data);
        } catch (err) {
            console.error('Error fetching leave balances:', err);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/types`);
            setLeaveTypes(res.data);
        } catch (err) {
            console.error('Error fetching leave types:', err);
        }
    };

    // ── UC-07: Fetch all company holidays ─────────────────────────────────────
    const fetchHolidays = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/holidays`);
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays:', err);
        }
    };

    // ── UC-09: Fetch employee's own HR requests ────────────────────────────────
    const fetchHRRequests = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/hr-requests/my-requests`);
            setHrRequests(res.data);
        } catch (err) {
            console.error('Error fetching HR requests:', err);
        }
    };

    // ── UC-09: Submit new HR request ──────────────────────────────────────────
    const handleSubmitHRRequest = async (form) => {
        setHrRequestSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/hr-requests`, form);
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
        await axios.post(`${import.meta.env.VITE_API_URL}/attendance/check-in`);
        fetchTodayAttendance();
        fetchAttendanceHistory();
    };

    const handleCheckOut = async () => {
        await axios.post(`${import.meta.env.VITE_API_URL}/attendance/check-out`);
        fetchTodayAttendance();
        fetchAttendanceHistory();
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();

        if (!leaveForm.leaveTypeId) {
            return alert("Please select a leave type.");
        }

        const start = new Date(leaveForm.startDate);
        const end = new Date(leaveForm.endDate);

        if (start > end) return alert("Start date cannot be after the end date.");

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const today = new Date();
        const noticeTime = Math.abs(start - today);
        const noticeDays = Math.ceil(noticeTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && noticeDays < 4)
            return alert("For a 1-day leave, you must apply at least 4 days in advance.");
        if (diffDays > 1 && noticeDays < 8)
            return alert("For leaves longer than 1 day, you must apply at least 8 days in advance.");

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/leaves/apply`, leaveForm);
            alert('Leave request submitted!');
            setLeaveForm({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
            fetchMyLeaves();
            fetchLeaveBalances();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error applying for leave');
        }
    };

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
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            <EmployeeSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={fullUser || authUser}
                logout={logout}
            />

            <main className="flex-1 overflow-y-auto">
                <EmployeeHeader activeTab={activeTab} />

                <div className="p-8 max-w-7xl mx-auto">
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
                            <EmployeeAnnouncement />
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;