import  { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import PracticeOnboarding from './pages/PracticeOnboarding';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to={user.role === 'hr' ? '/hr' : '/employee'} />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/employee" 
                        element={
                            <ProtectedRoute role="employee">
                                <EmployeeDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/hr" 
                        element={
                            <ProtectedRoute role="hr">
                                <HRDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/practice-onboarding" element={<PracticeOnboarding />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
