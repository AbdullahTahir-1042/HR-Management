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
import UpdateProfilePage from '../components/UpdateProfilePage';

const EmployeeDashboard = () => {
    const { user: authUser, logout, updateUser } = useContext(AuthContext);
    const [fullUser, setFullUser] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '', leaveTypeId: '' });
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'attendance', 'leaves'
    
    // Filters
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

    useEffect(() => {
        fetchUserProfile();
        fetchTodayAttendance();
        fetchMyLeaves();
        fetchAttendanceHistory();
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

    const fetchLeaveTypes = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/types`);
            setLeaveTypes(res.data);
            if (res.data.length > 0) {
                setLeaveForm(prev => ({ ...prev, leaveTypeId: res.data[0]._id }));
            }
        } catch (err) {
            console.error("Error fetching leave types:", err);
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

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const today = new Date();
        const noticeTime = Math.abs(start - today);
        const noticeDays = Math.ceil(noticeTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && noticeDays < 4) {
            return alert("For a 1-day leave, you must apply at least 4 days in advance.");
        }
        if (diffDays > 1 && noticeDays < 8) {
            return alert("For leaves longer than 1 day, you must apply at least 8 days in advance.");
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/leaves/apply`, leaveForm);
            alert('Leave request submitted!');
            setLeaveForm({ startDate: '', endDate: '', reason: '', leaveTypeId: leaveTypes[0]?._id || '' });
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
