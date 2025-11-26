import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { CurrencyProvider } from './hooks/useCurrency';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import OfflineIndicator from './components/layout/OfflineIndicator';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentSuccess from './pages/PaymentSuccess';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminShops from './pages/admin/Shops';
import AdminProducts from './pages/admin/Products';
import AdminInventory from './pages/admin/Inventory';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminAnalytics from './pages/admin/Analytics';
import AdminLoyalty from './pages/admin/Loyalty';
import AdminShifts from './pages/admin/Shifts';
import AdminSuppliers from './pages/admin/Suppliers'; // ADD THIS

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerSales from './pages/manager/Sales';
import ManagerProducts from './pages/manager/Products';
import ManagerInventory from './pages/manager/Inventory';
import ManagerSettings from './pages/manager/Settings';
import ManagerAnalytics from './pages/manager/Analytics';
import ManagerShifts from './pages/manager/Shifts';
import ManagerSuppliers from './pages/manager/Suppliers'; // ADD THIS

// Cashier Pages
import CashierSales from './pages/cashier/Sales';
import CashierSettings from './pages/cashier/Settings';
import CashierShiftClock from './pages/cashier/ShiftClock';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <OfflineProvider>
              <CurrencyProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />

                  {/* Protected Password Change Route (All authenticated users) */}
                  <Route
                    path="/change-password"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                        <ChangePassword />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="shops" element={<AdminShops />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="suppliers" element={<AdminSuppliers />} /> {/* ADD THIS */}
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="loyalty" element={<AdminLoyalty />} />
                    <Route path="shifts" element={<AdminShifts />} />
                  </Route>

                  {/* Manager Routes */}
                  <Route
                    path="/manager"
                    element={
                      <ProtectedRoute allowedRoles={['manager']}>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<ManagerDashboard />} />
                    <Route path="sales" element={<ManagerSales />} />
                    <Route path="products" element={<ManagerProducts />} />
                    <Route path="inventory" element={<ManagerInventory />} />
                    <Route path="suppliers" element={<ManagerSuppliers />} /> {/* ADD THIS */}
                    <Route path="settings" element={<ManagerSettings />} />
                    <Route path="analytics" element={<ManagerAnalytics />} />
                    <Route path="shifts" element={<ManagerShifts />} />
                  </Route>

                  {/* Cashier Routes */}
                  <Route
                    path="/cashier"
                    element={
                      <ProtectedRoute allowedRoles={['cashier']}>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="sales" element={<CashierSales />} />
                    <Route path="settings" element={<CashierSettings />} />
                    <Route path="shift" element={<CashierShiftClock />} />
                  </Route>

                  {/* Default Redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>

                {/* Offline Indicator */}
                <OfflineIndicator />
              </CurrencyProvider>
            </OfflineProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;