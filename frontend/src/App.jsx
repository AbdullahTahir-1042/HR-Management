import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './context/ConfirmContext';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    React.useEffect(() => {
        window.scrollTo(0, 0);
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
    }, [pathname]);

    return null;
};

const Login = lazy(() => import('./pages/Login'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const PracticeOnboarding = lazy(() => import('./pages/PracticeOnboarding'));
const PracticeOnboardingWizard = lazy(() => import('./components/PracticeOnboardingWizard'));

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
    if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(user.role)) {
            if (user.role === 'hr') return <Navigate to="/hr" />;
            return <Navigate to="/employee" />;
        }
    }
    return children;
};

function App() {
    return (
        <ThemeProvider>
        <AuthProvider>
            <ConfirmProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        className: 'text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 rounded-2xl',
                        duration: 4000,
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#ffffff',
                            },
                    },
                    error: {
                        iconTheme: {
                            primary: '#f43f5e',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
            <Router>
                <ScrollToTop />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/employee" element={
                            <ProtectedRoute role="employee">
                                <EmployeeDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/hr" element={
                            <ProtectedRoute role="hr">
                                <HRDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/onboarding" element={
                            <ProtectedRoute>
                                <PracticeOnboarding />
                            </ProtectedRoute>
                        } />
                        <Route path="/practice-onboarding" element={
                            <ProtectedRoute>
                                <PracticeOnboardingWizard />
                            </ProtectedRoute>
                        } />
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Suspense>
            </Router>
        </ConfirmProvider>
    </AuthProvider>
        </ThemeProvider >
    );
}

export default App;