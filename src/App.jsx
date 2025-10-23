import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import RazorpayPayment from './pages/RazorpayPayment';
import AdminDashboard from './pages/AdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import POSDashboard from './pages/POSDashboard';
import ProductManagement from './pages/ProductManagement';
import CategoryManagement from './pages/CategoryManagement';
import BranchManagement from './pages/BranchManagement';
import Reports from './pages/Reports';
import POS from './pages/POS';
import POS_ADV from './pages/POS_ADV';
import StaffManagement from './pages/StaffManagement';
import AdminProfile from './pages/AdminProfile';
import BranchManagerStaffManagement from './pages/BranchManagerStaffManagement';
import BranchManagerProfile from './pages/BranchManagerProfile';
import ComboManagement from './pages/ComboManagement';
import AdminSettings from './pages/AdminSettings';
import BrandManagement from './pages/BrandManagement';
import POSProfile from './pages/POSProfile';
import StaffStatsAdmin from './pages/StaffStatsAdmin';
import StaffStatsBranch from './pages/StaffStatsBranch';
import AppointmentsFull from './pages/AppointmentsFull';
import MembershipPurchase from './pages/MembershipPurchase';
import MembershipDetails from './pages/MembershipDetails';
import Calender from './pages/Calender';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <MainContent />
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

const MainContent = () => {
  const { user, loading } = useAuth();   // make sure your AuthContext exposes loading
  const location = useLocation();

  if (loading) {
    return <div className="p-6">Loading user…</div>;
  }

  const shouldShowSidebar = user && location.pathname !== '/login';

  return (
    <div className={`${shouldShowSidebar ? 'lg:ml-64' : ''} transition-all duration-300`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/RazorpayPayment" element={<RazorpayPayment />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/calender" element={<Calender />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <Routes>
                <Route index element={<Reports />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="branches" element={<BranchManagement />} />
                <Route path="brands" element={<BrandManagement />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="membership" element={<ComboManagement />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="therapist-availability" element={<StaffStatsAdmin />} />
                   <Route path="purchase" element={<MembershipPurchase />} />
                     {/* <Route path="membership-details" element={<MembershipDetails />} /> */}
                {/* Only render AppointmentsFull when user is defined */}
                {user && (
                  <>
                  <Route path="test" element={<AppointmentsFull branchId={user.branch_id} />} />
                  <Route path="transactions" element={<AppointmentsFull branchId={user.branch_id} />} />
                  </>
                )}
              </Routes>
            </PrivateRoute>
          }
        />

        {/* Branch Manager Routes */}
        <Route
          path="/manager/*"
          element={
            <PrivateRoute allowedRoles={['admin', 'manager']}>
              <Routes>
                <Route index element={<Reports />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="staff" element={<BranchManagerStaffManagement />} />
                <Route path="profile" element={<BranchManagerProfile />} />
                <Route path="membership" element={<ComboManagement />} />
                <Route path="therapist-availability" element={<StaffStatsBranch />} />
                <Route path="billing" element={<POS />} />
                <Route path="purchase" element={<MembershipPurchase />} />
          
                {/* <Route path="membership-details" element={<MembershipDetails />} /> */}
                {/* <Route path="book-appointment" element={<POS_ADV/>} /> */}
                {user && (
                  <>
                  <Route path="test" element={<AppointmentsFull branchId={user.branch_id} />} />
                   <Route path="transactions" element={<AppointmentsFull branchId={user.branch_id} />} />
                  </>
                )}
              </Routes>
            </PrivateRoute>
          }
        />

        {/* POS User Routes */}
        <Route
          path="/pos/*"
          element={
            <PrivateRoute allowedRoles={['admin', 'manager', 'pos']}>
              <Routes>
                <Route index element={<POSDashboard />} />
                <Route path="billing" element={<POS />} />
                <Route path="profile" element={<POSProfile />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
