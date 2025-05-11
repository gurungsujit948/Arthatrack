import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/NotFound';

// Lazy loaded pages
const TransactionsPage = React.lazy(() => import('./pages/transactions/TransactionsPage'));
const BudgetsPage = React.lazy(() => import('./pages/budgets/BudgetsPage'));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));

// Lazy loading wrapper
const LazyLoad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }
  >
    {children}
  </React.Suspense>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/transactions/*"
              element={
                <ProtectedRoute>
                  <LazyLoad>
                    <TransactionsPage />
                  </LazyLoad>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/budgets/*"
              element={
                <ProtectedRoute>
                  <LazyLoad>
                    <BudgetsPage />
                  </LazyLoad>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports/*"
              element={
                <ProtectedRoute>
                  <LazyLoad>
                    <ReportsPage />
                  </LazyLoad>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings/*"
              element={
                <ProtectedRoute>
                  <LazyLoad>
                    <SettingsPage />
                  </LazyLoad>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;