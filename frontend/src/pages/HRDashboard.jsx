import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// Component Imports
import HRSidebar from '../components/HRDashboard/HRSidebar';
import HRHeader from '../components/HRDashboard/HRHeader';
import HROverview from '../components/HRDashboard/HROverview';
import HRLeaveManagement from '../components/HRDashboard/HRLeaveManagement';
import HRAttendanceTracking from '../components/HRDashboard/HRAttendanceTracking';
import HREmployeeList from '../components/HRDashboard/HREmployeeList';
import AddEmployeePage from '../components/HRDashboard/AddEmployeePage';
import EmployeeDetailsPage from '../components/HRDashboard/EmployeeDetailsPage';
import EditEmployeePage from '../components/HRDashboard/EditEmployeePage';
import UpdateProfilePage from '../components/UpdateProfilePage';

const HRDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leaves', 'attendance', 'employees'
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [isEditingEmployee, setIsEditingEmployee] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Filters
    const [leaveFilter, setLeaveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');

    useEffect(() => {
        fetchAllLeaves();
        fetchAllAttendance();
        fetchAllEmployees();
    }, []);

    // Reset view states when tab changes
    useEffect(() => {
        setIsAddingEmployee(false);
        setIsEditingEmployee(false);
        setSelectedEmployee(null);
    }, [activeTab]);

    const fetchAllLeaves = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/leaves/all`);
        setLeaves(res.data);
    };

    const fetchAllAttendance = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance/all`);
        setAttendance(res.data);
    };

    const fetchAllEmployees = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/users`);
            setEmployees(res.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        await axios.put(`${import.meta.env.VITE_API_URL}/leaves/${id}/status`, { status });
        fetchAllLeaves();
    };

    const filteredLeaves = leaves.filter(l => {
        if (leaveFilter === 'all') return true;
        return l.status === leaveFilter;
    });

    const filteredAttendance = attendance.filter(a => {
        const matchesSearch = a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             a.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = attendanceDateFilter ? a.date === attendanceDateFilter : true;
        return matchesSearch && matchesDate;
    });

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
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
                                        onBack={() => setSelectedEmployee(null)}
                                        onEdit={() => setIsEditingEmployee(true)}
                                        onDelete={async (id) => {
                                            if (window.confirm('Are you sure you want to delete this employee? All their records will be permanently removed.')) {
                                                try {
                                                    await axios.delete(`${import.meta.env.VITE_API_URL}/auth/users/${id}`);
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
                                                    await axios.delete(`${import.meta.env.VITE_API_URL}/auth/users/${id}`);
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
                        {activeTab === 'attendance' && (
                            <HRAttendanceTracking 
                                filteredAttendance={filteredAttendance} 
                                searchTerm={searchTerm} 
                            />
                        )}
                        {activeTab === 'profile' && (
                            <UpdateProfilePage 
                                user={user} 
                                onBack={() => setActiveTab('dashboard')} 
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;
