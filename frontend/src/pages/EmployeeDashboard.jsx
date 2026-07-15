import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// Component Imports
import EmployeeSidebar from '../components/EmployeeDashboard/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeDashboard/EmployeeHeader';
import EmployeeOverview from '../components/EmployeeDashboard/EmployeeOverview';
import EmployeeAttendance from '../components/EmployeeDashboard/EmployeeAttendance';
import EmployeeLeaves from '../components/EmployeeDashboard/EmployeeLeaves';
import EmployeeHolidays from '../components/EmployeeDashboard/EmployeeHolidays';
import EmployeeHRRequests from '../components/EmployeeDashboard/EmployeeHRRequests';
import EmployeePracticeOnboarding from '../components/EmployeeDashboard/EmployeePracticeOnboarding';
import UpdateProfilePage from '../components/UpdateProfilePage';

const EmployeeDashboard = () => {
    const { user: authUser, logout, updateUser } = useContext(AuthContext);
    const [fullUser, setFullUser] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [hrRequests, setHrRequests] = useState([]);
    const [hrSubmitting, setHrSubmitting] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'attendance', 'leaves', 'holidays', 'hr-requests', 'onboarding'
    
    // Filters
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

    useEffect(() => {
        fetchUserProfile();
        fetchTodayAttendance();
        fetchMyLeaves();
        fetchAttendanceHistory();
        fetchHolidays();
        fetchMyHRRequests();
        fetchLeaveTypes();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/user`);
            setFullUser(res.data);
            updateUser(res.data); // Update global state too
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    const fetchTodayAttendance = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance/status`);
        setAttendance(res.data);
    };

    const fetchAttendanceHistory = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance/my-history`);
        setAttendanceHistory(res.data);
    };

    const fetchMyLeaves = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/my-leaves`);
        setLeaves(res.data);
    };

    const fetchHolidays = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/holidays`);
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays:', err);
        }
    };

    const fetchMyHRRequests = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/hr-requests/my-requests`);
            setHrRequests(res.data);
        } catch (err) {
            console.error('Error fetching HR requests:', err);
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

    const handleHRRequestSubmit = async (form) => {
        setHrSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/hr-requests`, {
                subject: form.type,
                description: form.description,
            });
            await fetchMyHRRequests();
            return true;
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to submit request.');
            return false;
        } finally {
            setHrSubmitting(false);
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

        if (start > end) {
            return alert("Start date cannot be after the end date.");
        }

        if (!leaveForm.leaveTypeId) {
            return alert("Please select a leave type.");
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const noticeDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && noticeDays < 4) {
            return alert("For a 1-day leave, you must apply at least 4 days in advance.");
        }
        if (diffDays > 1 && noticeDays < 8) {
            return alert("For leaves longer than 1 day, you must apply at least 8 days in advance.");
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/leaves/apply`, leaveForm);
            alert('Leave request submitted!');
            setLeaveForm({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
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
                                setActiveTab={setActiveTab} 
                            />
                        )}
                        {activeTab === 'attendance' && (
                            <EmployeeAttendance 
                                attendance={attendance} 
                                history={attendanceHistory.filter(a => attendanceDateFilter ? a.date === attendanceDateFilter : true)}
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
                                leaves={leaves.filter(l => leaveStatusFilter === 'all' ? true : l.status === leaveStatusFilter)}
                                statusFilter={leaveStatusFilter}
                                setStatusFilter={setLeaveStatusFilter}
                                leaveTypes={leaveTypes}
                            />
                        )}
                        {activeTab === 'holidays' && (
                            <EmployeeHolidays holidays={holidays} />
                        )}
                        {activeTab === 'hr-requests' && (
                            <EmployeeHRRequests
                                requests={hrRequests}
                                onSubmit={handleHRRequestSubmit}
                                submitting={hrSubmitting}
                            />
                        )}
                        {activeTab === 'onboarding' && (
                            <EmployeePracticeOnboarding />
                        )}
                        {activeTab === 'profile' && (
                            <UpdateProfilePage 
                                user={fullUser || authUser} 
                                onBack={() => setActiveTab('dashboard')} 
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;
