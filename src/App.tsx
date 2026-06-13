import React, { lazy, Suspense, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Lazy-load every page so the initial bundle only contains the shell + auth logic
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const UdharChallan = lazy(() => import('./pages/UdharChallan'));
const JamaChallan = lazy(() => import('./pages/JamaChallan'));
const StockManagement = lazy(() => import('./pages/StockManagement'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const ChallanBook = lazy(() => import('./pages/ChallanBook'));
const ClientLedger = lazy(() => import('./pages/ClientLedger'));
const Billing = lazy(() => import('./pages/Billing'));
const CreateBill = lazy(() => import('./pages/CreateBill'));
const BillBook = lazy(() => import('./pages/BillBook'));
const Payments = lazy(() => import('./pages/Payments'));

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
});

const RootRoute: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
});

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<RootRoute><Landing /></RootRoute>} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/bill-book"
                element={<ProtectedRoute><BillBook /></ProtectedRoute>}
              />
              <Route
                path="/payments"
                element={<ProtectedRoute><Payments /></ProtectedRoute>}
              />
              <Route
                path="/clients"
                element={<ProtectedRoute><ClientManagement /></ProtectedRoute>}
              />
              <Route
                path="/udhar-challan"
                element={<ProtectedRoute><UdharChallan /></ProtectedRoute>}
              />
              <Route
                path="/jama-challan"
                element={<ProtectedRoute><JamaChallan /></ProtectedRoute>}
              />
              <Route
                path="/stock"
                element={<ProtectedRoute><StockManagement /></ProtectedRoute>}
              />
              <Route
                path="/stock-history"
                element={<ProtectedRoute><StockHistory /></ProtectedRoute>}
              />
              <Route
                path="/challan-book"
                element={<ProtectedRoute><ChallanBook /></ProtectedRoute>}
              />
              <Route
                path="/client-ledger"
                element={<ProtectedRoute><ClientLedger /></ProtectedRoute>}
              />
              <Route path="/billing">
                <Route
                  index
                  element={<ProtectedRoute><Billing /></ProtectedRoute>}
                />
                <Route
                  path="create/:clientId"
                  element={<ProtectedRoute><CreateBill /></ProtectedRoute>}
                />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
