import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// --- FIREBASE IMPORTS ---
import { requestForToken, onMessageListener } from '../firebase';

import HRSidebar from '../components/HRDashboard/HRSidebar';
import HRHeader from '../components/HRDashboard/HRHeader';
import HROverview from '../components/HRDashboard/HROverview';
import AnnouncementPage from '../components/HRDashboard/AnnouncementsPage';
import HRLeaveManagement from '../components/HRDashboard/HRLeaveManagement';
import HRAttendanceTracking from '../components/HRDashboard/HRAttendanceTracking';
import HREmployeeList from '../components/HRDashboard/HREmployeeList';
import AddEmployeePage from '../components/HRDashboard/AddEmployeePage';
import EmployeeDetailsPage from '../components/HRDashboard/EmployeeDetailsPage';
import EditEmployeePage from '../components/HRDashboard/EditEmployeePage';
import UpdateProfilePage from '../components/UpdateProfilePage';
import HRDepartments from '../components/HRDashboard/HRDepartments';
import HRReports from '../components/HRDashboard/HRReports'; // 👈 NEW
import HRMistakeReports from '../components/HRDashboard/HRMistakeReports';
import HRHolidayManagement from '../components/HRDashboard/HRHolidayManagement';
import HRRequestsManagement from '../components/HRDashboard/HRRequestsManagement';
import HRLeaveTypeManagement from '../components/HRDashboard/HRLeaveTypeManagement';
import LatecomersPage from '../components/HRDashboard/LatecomersPage';

const SHIFT_START_HOUR = 9;
const SHIFT_START_MINUTE = 0;
const SHIFT_END_HOUR = 18;
const SHIFT_END_MINUTE = 0;

const HRDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [mistakeReports, setMistakeReports] = useState([]);

    // ── UC-09: HR Requests state ───────────────────────────────────────────────
    const [hrRequests, setHrRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [isEditingEmployee, setIsEditingEmployee] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [latecomerDateFilter, setLatecomerDateFilter] = useState('');
    const [leaveFilter, setLeaveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [leavesRes, attendanceRes, employeesRes, holidaysRes, hrRequestsRes, leaveTypesRes, announcementsRes, mistakeReportsRes] = await Promise.all([
                apiClient.get('/leaves/all'),
                apiClient.get('/attendance/all'),
                apiClient.get('/auth/users'),
                apiClient.get('/holidays'),
                apiClient.get('/hr-requests'),
                apiClient.get('/leaves/types'),
                apiClient.get('/announcements'),
                apiClient.get('/mistake-reports')
            ]);
            setLeaves(leavesRes.data);
            setAttendance(attendanceRes.data);
            setEmployees(employeesRes.data);
            setHolidays(holidaysRes.data);
            setHrRequests(hrRequestsRes.data);
            setLeaveTypes(leaveTypesRes.data);
            setAnnouncements(announcementsRes.data);
            setMistakeReports(mistakeReportsRes.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // --- FIREBASE NOTIFICATION SETUP ---
    useEffect(() => {
        const setupHRNotifications = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    await apiClient.put('/auth/fcm-token', { token });
                    console.log('HR FCM Token synced successfully.');
                }
            } catch (error) {
                console.error('Error setting up HR notifications:', error);
            }
        };
        setupHRNotifications();

        const unsubscribe = onMessageListener((payload) => {
            console.log("HR Foreground message received:", payload);
            fetchAllAnnouncements(); 
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    useEffect(() => {
        setIsAddingEmployee(false);
        setIsEditingEmployee(false);
        setSelectedEmployee(null);
    }, [activeTab]);

    const fetchAllLeaves = async () => {
        const res = await apiClient.get('/leaves/all');
        setLeaves(res.data);
    };

    const fetchAllAttendance = async () => {
        const res = await apiClient.get('/attendance/all');
        setAttendance(res.data);
    };

    const fetchAllEmployees = async () => {
        try {
            const res = await apiClient.get('/auth/users');
            setEmployees(res.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await apiClient.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays:', err);
        }
    };

    // ── UC-09: Fetch all HR requests ───────────────────────────────────────────
    const fetchHRRequests = async () => {
        try {
            const res = await apiClient.get('/hr-requests');
            setHrRequests(res.data);
        } catch (err) {
            console.error('Error fetching HR requests:', err);
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

    // ── UC-09: Update HR request status & note ─────────────────────────────────
    const handleUpdateHRRequest = async (id, { status, hrNote }) => {
        try {
            await apiClient.put(`/hr-requests/${id}`, { status, hrNote });
            fetchHRRequests();
        } catch (err) {
            console.error('Error updating HR request:', err);
            alert('Failed to update request.');
        }
    };
    const fetchAllAnnouncements = async () => {
        try {
            const res = await apiClient.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        await apiClient.put(`/leaves/${id}/status`, { status });
        fetchAllLeaves();
    };

    
    const latecomers = attendance
    .filter(record => record.checkIn)
    .map(record => {
        const checkIn = new Date(record.checkIn);
        const shiftStart = new Date(checkIn);
        shiftStart.setHours(SHIFT_START_HOUR, SHIFT_START_MINUTE, 0, 0);
        const shiftEnd = new Date(checkIn);
        shiftEnd.setHours(SHIFT_END_HOUR, SHIFT_END_MINUTE, 0, 0);
        const minutesLate = Math.round((checkIn - shiftStart) / 60000);
        let compensated = false;
        if (record.checkOut && minutesLate > 0) {
            const checkOut = new Date(record.checkOut);
            const expectedEnd = new Date(shiftEnd);
            const overtimeMinutes = Math.round((checkOut - expectedEnd) / 60000);
            if (overtimeMinutes >= minutesLate) compensated = true;
        }
        return { ...record, minutesLate, compensated };
    })
    .filter(record => record.minutesLate > 0); 
    const filteredLatecomers = latecomers.filter(l => latecomerDateFilter ? l.date === latecomerDateFilter : true);
    const filteredLeaves = leaves.filter(l => leaveFilter === 'all' ? true : l.status === leaveFilter);
    const filteredAttendance = attendance.filter(a => {
        const matchesSearch =
            a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = attendanceDateFilter ? a.date === attendanceDateFilter : true;
        return matchesSearch && matchesDate;
    });

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
            <HRSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                logout={logout}
            />

            <main className="flex-1 overflow-y-auto">
                <HRHeader
                    activeTab={activeTab}
                    leaveFilter={leaveFilter}
                    setLeaveFilter={setLeaveFilter}
                    attendanceDateFilter={attendanceDateFilter}
                    setAttendanceDateFilter={setAttendanceDateFilter}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                <div className="p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">

                        {activeTab === 'dashboard' && (
                            <HROverview
                                user={user}
                                leaves={leaves}
                                attendance={attendance}
                                employees={employees}
                                holidays={holidays}
                                latecomers={latecomers}
                                announcements={announcements}
                                mistakeReports={mistakeReports}
                                setActiveTab={setActiveTab}
                            />
                        )}

                        {activeTab === 'employees' && (
                            <>
                                {isAddingEmployee ? (
                                    <AddEmployeePage
                                        onBack={() => setIsAddingEmployee(false)}
                                        onEmployeeAdded={fetchAllEmployees}
                                    />
                                ) : isEditingEmployee ? (
                                    <EditEmployeePage
                                        employee={selectedEmployee}
                                        onBack={() => setIsEditingEmployee(false)}
                                        onEmployeeUpdated={(updatedEmp) => {
                                            fetchAllEmployees();
                                            setSelectedEmployee(updatedEmp);
                                        }}
                                    />
                                ) : selectedEmployee ? (
                                    <EmployeeDetailsPage
                                        employee={selectedEmployee}
                                        leaves={leaves}
                                        leaveTypes={leaveTypes}
                                        onBack={() => setSelectedEmployee(null)}
                                        onEdit={() => setIsEditingEmployee(true)}
                                        onDelete={async (id) => {
                                            if (window.confirm('Are you sure you want to delete this employee? All their records will be permanently removed.')) {
                                                try {
                                                    await apiClient.delete(`/auth/users/${id}`);
                                                    setSelectedEmployee(null);
                                                    fetchAllEmployees();
                                                } catch (err) {
                                                    console.error("Error deleting employee:", err);
                                                    alert(err.response?.data?.msg || "Failed to delete employee");
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <HREmployeeList
                                        employees={employees}
                                        searchTerm={searchTerm}
                                        onAddNew={() => setIsAddingEmployee(true)}
                                        onSelect={setSelectedEmployee}
                                        onDelete={async (id) => {
                                            if (window.confirm('Are you sure you want to delete this employee? All their records will be permanently removed.')) {
                                                try {
                                                    await apiClient.delete(`/auth/users/${id}`);
                                                    fetchAllEmployees();
                                                } catch (err) {
                                                    console.error("Error deleting employee:", err);
                                                    alert(err.response?.data?.msg || "Failed to delete employee");
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'leaves' && (
                            <HRLeaveManagement
                                filteredLeaves={filteredLeaves}
                                handleStatusUpdate={handleStatusUpdate}
                            />
                        )}

                        {activeTab === 'leave-types' && (
                            <HRLeaveTypeManagement
                                leaveTypes={leaveTypes}
                                fetchLeaveTypes={fetchLeaveTypes}
                            />
                        )}

                        {activeTab === 'attendance' && (
                            <HRAttendanceTracking
                                filteredAttendance={filteredAttendance}
                                searchTerm={searchTerm}
                            />
                        )}

                        {activeTab === 'holidays' && (
                            <HRHolidayManagement
                                holidays={holidays}
                                fetchHolidays={fetchHolidays}
                            />
                        )}

                        {activeTab === 'hr-requests' && (
                            <HRRequestsManagement
                                requests={hrRequests}
                                onUpdate={handleUpdateHRRequest}
                            />
                        )}

                        {activeTab === 'profile' && (
                            <UpdateProfilePage
                                user={user}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        )}

                        {activeTab === 'departments' && (
                            <HRDepartments />
                        )}

                        {activeTab === 'reports' && (
                            <HRReports employees={employees} />
                        )}

                        {activeTab === 'mistake-reports' && (
                            <HRMistakeReports />
                        )}

                        {activeTab === 'latecomers' && (
                            <LatecomersPage
                                latecomers={filteredLatecomers}
                                dateFilter={latecomerDateFilter}
                                setDateFilter={setLatecomerDateFilter}
                            />
                        )}

                        {activeTab === 'announcements' && (
                            <AnnouncementPage
                                initialAnnouncements={announcements}
                                initialEmployees={employees}
                                onRefreshAnnouncements={fetchAllAnnouncements}
                            />
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;