import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// 👇 Lazy load pages to decrease initial bundle load time
const Login = lazy(() => import('./pages/Login'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const PracticeOnboarding = lazy(() => import('./pages/PracticeOnboarding'));

const PageLoader = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading Portal...</p>
    </div>
);

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to={user.role === 'hr' ? '/hr' : '/employee'} />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/onboarding" element={<PracticeOnboarding />} />
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
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
}

export default App;
