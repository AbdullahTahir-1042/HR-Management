import toast from 'react-hot-toast';
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

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
import EditProfilePage from '../components/EditProfilePage';
import HRDepartments from '../components/HRDashboard/HRDepartments';
import HRReports from '../components/HRDashboard/HRReports';
import HRMistakeReports from '../components/HRDashboard/HRMistakeReports';
import HRHolidayManagement from '../components/HRDashboard/HRHolidayManagement';
import HRRequestsManagement from '../components/HRDashboard/HRRequestsManagement';
import HRLeaveTypeManagement from '../components/HRDashboard/HRLeaveTypeManagement';

import HRTrainingManagement from '../components/HRDashboard/HRTrainingManagement'; // ✅ NEW
import OfficeScheduleManagement from '../components/HRDashboard/OfficeScheduleManagement'; // ✅ NEW
import MessagesPage from '../components/MessagesPage';
import VirtualHRAssistant from '../components/VirtualHRAssistant';

const EmployeeDetailsRouteWrapper = ({ employees, leaves, leaveTypes, fetchAllEmployees, setEmployees }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const employee = employees.find(e => e._id === id);
    if (!employee) return <div className="p-10 text-center">Loading or not found...</div>;
    return (
        <EmployeeDetailsPage
            employee={employee}
            leaves={leaves}
            leaveTypes={leaveTypes}
            onBack={() => navigate('/hr/employees')}
            onEdit={() => navigate(`/hr/employees/${id}/edit`)}
            onDelete={async (empId) => {
                if (!await window.confirmModal("Are you sure you want to delete this employee?")) return;
                try {
                    await apiClient.delete(`/auth/users/${empId}`);
                    fetchAllEmployees();
                    navigate('/hr/employees');
                } catch (err) {
                    toast.error(err.response?.data?.msg || "Failed to delete employee");
                }
            }}
            onRestore={async (empId) => {
                if (!await window.confirmModal("Are you sure you want to mark this employee as Active?")) return;
                try {
                    await apiClient.put(`/auth/users/${empId}/restore`);
                    const res = await apiClient.get('/auth/users');
                    setEmployees(res.data);
                } catch (err) {
                    toast.error(err.response?.data?.msg || "Failed to restore employee");
                }
            }}
        />
    );
};

const EditEmployeeRouteWrapper = ({ employees, fetchAllEmployees }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const employee = employees.find(e => e._id === id);
    if (!employee) return <div className="p-10 text-center">Loading or not found...</div>;
    return (
        <EditEmployeePage
            employee={employee}
            onBack={() => navigate(`/hr/employees/${id}`)}
            onEmployeeUpdated={() => {
                fetchAllEmployees();
                navigate(`/hr/employees/${id}`);
            }}
        />
    );
};

const HRDashboard = () => {
    const mainRef = useRef(null);
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [mistakeReports, setMistakeReports] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const [hrRequests, setHrRequests] = useState([]);
    const [loans, setLoans] = useState([]);
    const [hrRequestsSubTab, setHrRequestsSubTab] = useState('general');
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTodayStr = () => new Date().toISOString().slice(0, 10);
    const [departments, setDepartments] = useState([]);

    const [leaveFilter, setLeaveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState(getTodayStr());

    const [performanceReviews, setPerformanceReviews] = useState([]);
    const [awards, setAwards] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [leavesRes, attendanceRes, employeesRes, holidaysRes, hrRequestsRes, loansRes, leaveTypesRes, announcementsRes, mistakeReportsRes, deptsRes, reviewsRes, awardsRes] = await Promise.all([
                apiClient.get('/leaves/all'),
                apiClient.get('/attendance/all'),
                apiClient.get('/auth/users'),
                apiClient.get('/holidays'),
                apiClient.get('/hr-requests'),
                apiClient.get('/loans/all'),
                apiClient.get('/leaves/types'),
                apiClient.get('/announcements'),
                apiClient.get('/mistake-reports'),
                apiClient.get('/departments'),
                apiClient.get('/performance-reviews').catch(e => ({data: []})),
                apiClient.get('/awards').catch(e => ({data: []}))
            ]);
            setLeaves(leavesRes.data);
            setAttendance(attendanceRes.data);
            setEmployees(employeesRes.data);
            setHolidays(holidaysRes.data);
            setHrRequests(hrRequestsRes.data);
            setLoans(loansRes.data || []);
            setLeaveTypes(leaveTypesRes.data);
            setAnnouncements(announcementsRes.data);
            setMistakeReports(mistakeReportsRes.data);
            setDepartments(deptsRes.data || []);
            setPerformanceReviews(reviewsRes.data || []);
            setAwards(awardsRes.data || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const refreshRequestsAndLoans = useCallback(async () => {
        try {
            const [hrRequestsRes, loansRes] = await Promise.all([
                apiClient.get('/hr-requests'),
                apiClient.get('/loans/all')
            ]);
            setHrRequests(hrRequestsRes.data || []);
            setLoans(loansRes.data || []);
        } catch (err) {
            console.error('Error refreshing requests and loans:', err);
        }
    }, []);

    // Purely event-driven real-time updates (Zero continuous API polling)
    useEffect(() => {
        let bcLoans, bcHR;

        const handleUpdateEvent = () => {
            refreshRequestsAndLoans();
        };

        // Window events (for same-window instant sync)
        window.addEventListener('loan_event', handleUpdateEvent);
        window.addEventListener('hr_request_event', handleUpdateEvent);

        // BroadcastChannel (for cross-tab instant sync)
        if ('BroadcastChannel' in window) {
            try {
                bcLoans = new BroadcastChannel('loans_channel');
                bcLoans.onmessage = handleUpdateEvent;

                bcHR = new BroadcastChannel('hr_requests_channel');
                bcHR.onmessage = handleUpdateEvent;
            } catch (e) {}
        }

        return () => {
            window.removeEventListener('loan_event', handleUpdateEvent);
            window.removeEventListener('hr_request_event', handleUpdateEvent);
            if (bcLoans) bcLoans.close();
            if (bcHR) bcHR.close();
        };
    }, [refreshRequestsAndLoans]);

    // Lightweight poll just for the sidebar's unread-messages badge
    useEffect(() => {
        const fetchUnreadMessages = async () => {
            try {
                const res = await apiClient.get('/conversations');
                setUnreadMessages((res.data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0));
            } catch (err) {
                console.error('Error fetching unread messages count:', err);
            }
        };
        fetchUnreadMessages();
        const interval = setInterval(fetchUnreadMessages, 5000);
        return () => clearInterval(interval);
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

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [navHistory, setNavHistory] = useState([]);

    // Scroll to top automatically whenever active tab or active detail page changes
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }, []);

    const handleSidebarNavigate = (tabKey) => {
        
        setSelectedEmployee(null);
        setIsAddingEmployee(false);
        setIsEditingEmployee(false);
        setNavHistory([]);
        setSidebarOpen(false);
    };

    const pushNavState = () => {
        setNavHistory(prev => [
            ...prev,
            {
                
                selectedEmployee,
                isAddingEmployee,
                isEditingEmployee
            }
        ]);
    };

    const handleTabChange = (newTab) => {
        
        if (newTab === 'dashboard') {
            setNavHistory([]);
        } else {
            pushNavState();
        }
        
        setIsAddingEmployee(false);
        setIsEditingEmployee(false);
        setSelectedEmployee(null);
        setSidebarOpen(false);
    };

    const handleSelectEmployee = (emp) => {
        pushNavState();
        setSelectedEmployee(emp);
    };

    const handleStartAddEmployee = () => {
        pushNavState();
        setIsAddingEmployee(true);
    };

    const handleStartEditEmployee = () => {
        pushNavState();
        setIsEditingEmployee(true);
    };



    
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

    const handleUpdateHRRequest = async (id, data) => {
        try {
            const res = await apiClient.put(`/hr-requests/${id}`, data);
            setHrRequests(prev => prev.map(r => r._id === id ? res.data : r));
            try {
                const bc = new BroadcastChannel('hr_requests_channel');
                bc.postMessage({ type: 'HR_REQUEST_UPDATED', requestId: id });
                bc.close();
            } catch (e) {}
        } catch (err) {
            console.error('Error updating HR request:', err);
            toast.error(err.response?.data?.msg || 'Failed to update HR request');
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

    const handleStatusUpdate = async (id, status, remark) => {
        try {
            await apiClient.put(`/leaves/${id}/hr-review`, { action: status, remark });
            fetchAllLeaves();
            try {
                const bc = new BroadcastChannel('leaves_channel');
                bc.postMessage({ type: 'LEAVE_STATUS_CHANGED', leaveId: id, status });
                bc.close();
            } catch (e) { /* BroadcastChannel not supported */ }
        } catch (err) {
            console.error('Error updating leave status:', err);
            toast.error(err.response?.data?.msg || 'Failed to update leave status');
        }
    };

    const handleDeleteLeave = async (id) => {
        if (await window.confirmModal('Are you sure you want to delete this leave request?')) {
            try {
                await apiClient.delete(`/leaves/${id}`);
                fetchAllLeaves();
                try {
                    const bc = new BroadcastChannel('leaves_channel');
                    bc.postMessage({ type: 'LEAVE_STATUS_CHANGED', leaveId: id, status: 'deleted' });
                    bc.close();
                } catch (e) { /* BroadcastChannel not supported */ }
            } catch (err) {
                console.error('Error deleting leave request:', err);
                toast.error(err.response?.data?.msg || 'Failed to delete leave request');
            }
        }
    };


    const filteredLeaves = leaves.filter(l => {
        if (leaveFilter === 'all') return true;
        if (leaveFilter === 'pending') return l.status === 'pending' || l.status === 'pending_hr' || l.status === 'pending_team_lead';
        if (leaveFilter === 'approved') return l.status === 'approved';
        if (leaveFilter === 'rejected') return l.status === 'rejected' || l.status === 'hr_rejected';
        return l.status === leaveFilter;
    });
    const filteredAttendance = attendance.filter(a => {
        const matchesSearch =
            a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = attendanceDateFilter ? a.date === attendanceDateFilter : true;
        return matchesSearch && matchesDate;
    });

    const pendingRequestsCount = (hrRequests || []).filter(r => r.status === 'Pending').length;

    const handleNotificationNavigate = (tab, subTab) => {
        
        if (tab === 'hr-requests' && subTab) {
            setHrRequestsSubTab(subTab);
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
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans relative">
            <HRSidebar
                
                
                user={user}
                logout={logout}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
                unreadMessages={unreadMessages}
                pendingRequestsCount={pendingRequestsCount}
            />
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                <HRHeader
                    leaveFilter={leaveFilter}
                    setLeaveFilter={setLeaveFilter}
                    attendanceDateFilter={attendanceDateFilter}
                    setAttendanceDateFilter={setAttendanceDateFilter}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setSidebarOpen={setSidebarOpen}
                />

                <div className="p-4 lg:p-6 max-w-full mx-auto">

                    <Routes>
                        <Route path="/" element={
                            <HROverview
                                user={user} leaves={leaves} attendance={attendance} employees={employees} holidays={holidays}
                                announcements={announcements} mistakeReports={mistakeReports} hrRequests={hrRequests} loans={loans}
                                setHrRequestsSubTab={setHrRequestsSubTab}
                            />
                        } />
                        <Route path="employees" element={
                            <HREmployeeList
                                employees={employees} performanceReviews={performanceReviews} mistakeReports={mistakeReports} awards={awards} searchTerm={searchTerm}
                                onAddNew={() => navigate('/hr/employees/add')}
                                onSelect={(emp) => navigate(`/hr/employees/${emp._id}`)}
                                onDelete={async (id) => {
                                    if (!await window.confirmModal("Are you sure you want to delete this employee?")) return;
                                    try { await apiClient.delete(`/auth/users/${id}`); fetchAllEmployees(); } 
                                    catch (err) { toast.error("Failed to delete employee"); }
                                }}
                            />
                        } />
                        <Route path="employees/add" element={
                            <AddEmployeePage onBack={() => navigate('/hr/employees')} onEmployeeAdded={() => { fetchAllEmployees(); navigate('/hr/employees'); }} />
                        } />
                        <Route path="employees/:id" element={
                            <EmployeeDetailsRouteWrapper 
                                employees={employees} leaves={leaves} leaveTypes={leaveTypes} fetchAllEmployees={fetchAllEmployees} setEmployees={setEmployees}
                            />
                        } />
                        <Route path="employees/:id/edit" element={
                            <EditEmployeeRouteWrapper employees={employees} fetchAllEmployees={fetchAllEmployees} />
                        } />
                        <Route path="leaves" element={<HRLeaveManagement filteredLeaves={filteredLeaves} handleStatusUpdate={handleStatusUpdate} handleDeleteLeave={handleDeleteLeave} employees={employees} departments={departments} />} />
                        <Route path="leave-types" element={<HRLeaveTypeManagement leaveTypes={leaveTypes} fetchLeaveTypes={fetchLeaveTypes} />} />
                        <Route path="attendance" element={<HRAttendanceTracking filteredAttendance={filteredAttendance} searchTerm={searchTerm} />} />
                        <Route path="holidays" element={<HRHolidayManagement holidays={holidays} fetchHolidays={fetchHolidays} />} />
                        <Route path="hr-requests" element={<HRRequestsManagement requests={hrRequests} onUpdate={handleUpdateHRRequest} initialSubTab={hrRequestsSubTab} externalLoans={loans} onRefreshLoans={setLoans} />} />
                        <Route path="profile" element={<UpdateProfilePage user={user} onBack={() => navigate('/hr')} />} />
                        <Route path="profile/edit-profile" element={<EditProfilePage user={user} />} />
                        <Route path="departments" element={<HRDepartments />} />
                        <Route path="training" element={<HRTrainingManagement />} />
                        <Route path="reports" element={<HRReports employees={employees} loans={loans} />} />
                        <Route path="mistake-reports" element={<HRMistakeReports />} />
                        <Route path="office-schedule" element={<OfficeScheduleManagement />} />
                        <Route path="announcements" element={<AnnouncementPage initialAnnouncements={announcements} initialEmployees={employees} onRefreshAnnouncements={fetchAllAnnouncements} />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="*" element={<Navigate to="/hr" replace />} />
                    </Routes>
                </div>
            </main>
            
            <VirtualHRAssistant user={user} />
        </div>
    );
};

export default HRDashboard;