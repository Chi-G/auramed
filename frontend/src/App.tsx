import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Appointments from './pages/Appointments';

import Staff from './pages/Staff';
import Dashboard from './pages/Dashboard';
import Visits from './pages/Visits';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AccessDeniedModal from './components/AccessDeniedModal';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-sky-400/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-16 h-16 p-2 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
            <img src="/assets/logo.png" alt="AuraMed" className="w-full h-full object-contain logo-tint-sky" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.5s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.25s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const PermissionRoute = ({ children, permission }: { children: React.ReactNode, permission: string }) => {
  const { user, permissions, isLoading } = useAuth();

  if (isLoading) return null;

  // Hard constraint: Only super_admin and admin can access management paths
  const isManagementPath = permission === 'manage_roles';
  const role = user?.role?.toLowerCase();
  const hasAuthorizedRole = role === 'super_admin' || role === 'admin';

  if (!permissions[permission] || (isManagementPath && !hasAuthorizedRole)) {
    return <AccessDeniedModal />;
  }

  return <>{children}</>;
};

const Home = () => {
  const { user, permissions, isLoading } = useAuth();

  if (isLoading) return null;

  const role = `${user?.role || ""}`.toLowerCase().replace("_", "").replace(" ", "");
  
  // High-level access gate
  const hasDashboardAccess = 
    role === 'superadmin' || 
    role === 'admin' || 
    permissions.view_dashboard;

  if (hasDashboardAccess) {
    return <Dashboard />;
  }

  // Fallback map for specific roles stuck on Settings
  if (role === 'doctor') return <Navigate to="/visits" replace />;
  if (role === 'nurse') return <Navigate to="/appointments" replace />;
  if (role === 'receptionist') return <Navigate to="/patients" replace />;
  if (role === 'cashier') return <Navigate to="/billing" replace />;

  return <Navigate to="/settings" replace />;
};


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#0f172a',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }} />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_patients">
                    <Patients />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_patients">
                    <PatientDetails />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_appointments">
                    <Appointments />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/visits"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_clinical_visits">
                    <Visits />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_pharmacy">
                    <Pharmacy />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_billing">
                    <Billing />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="view_reports">
                    <Reports />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <PermissionRoute permission="manage_roles">
                    <Staff />
                  </PermissionRoute>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
