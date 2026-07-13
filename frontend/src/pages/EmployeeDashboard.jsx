import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// --- NEW FIREBASE IMPORTS ---
// Adjust the path to '../firebase' if your file is in the src/ root, 
// or wherever you placed firebase.js relative to this page.
import { requestForToken, onMessageListener } from '../firebase'; 

import EmployeeSidebar from '../components/EmployeeDashboard/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeDashboard/EmployeeHeader';
import EmployeeOverview from '../components/EmployeeDashboard/EmployeeOverview';
import EmployeeAttendance from '../components/EmployeeDashboard/EmployeeAttendance';
import EmployeeLeaves from '../components/EmployeeDashboard/EmployeeLeaves';
import EmployeeAnnouncement from '../components/EmployeeDashboard/EmployeeAnnouncement';
import UpdateProfilePage from '../components/UpdateProfilePage';

const EmployeeDashboard = () => {
    const { user: authUser, logout, updateUser } = useContext(AuthContext);
    const [fullUser, setFullUser] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [activeTab, setActiveTab] = useState('dashboard');

    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

    useEffect(() => {
        fetchUserProfile();
        fetchTodayAttendance();
        fetchMyLeaves();
        fetchAttendanceHistory();
        fetchAllAnnouncements();
    }, []);

    // --- NEW FIREBASE NOTIFICATION SETUP ---
    useEffect(() => {
        const setupNotifications = async () => {
            try {
                // 1. Ask browser for permission and get the token
                const token = await requestForToken();
                if (token) {
                    // 2. Send the token to the new backend route
                    await axios.put(`${import.meta.env.VITE_API_URL}/auth/fcm-token`, { token });
                    console.log('FCM Token synced to server successfully.');
                }
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };

        setupNotifications();

        // 3. Listen for live messages while the employee is using the app
        onMessageListener()
            .then((payload) => {
                // You can replace this alert with a toast notification library later if you want
                alert(`📢 ${payload.notification.title}\n\n${payload.notification.body}`);
            })
            .catch((err) => console.error('Foreground notification error:', err));
    }, []);
    // ---------------------------------------

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
            setLeaveForm({ startDate: '', endDate: '', reason: '' });
            fetchMyLeaves();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error applying for leave');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
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