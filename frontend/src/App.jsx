import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Route-based Code Splitting
const Login = lazy(() => import('./pages/Login'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const PracticeOnboardingWizard = lazy(() => import('./components/PracticeOnboardingWizard'));

// Sleek loading skeleton fallback
const LoadingFallback = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Resources...</p>
        </div>
    </div>
);
import  { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import PracticeOnboarding from './pages/PracticeOnboarding';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <LoadingFallback />;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to={user.role === 'hr' ? '/hr' : '/employee'} />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<LoadingFallback />}>
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
                        <Route 
                            path="/practice-onboarding" 
                            element={
                                <ProtectedRoute>
                                    <PracticeOnboardingWizard />
                                </ProtectedRoute>
                            } 
                        />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </Suspense>
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
